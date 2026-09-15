/**
 * InputManager.js
 * Mobile touch and desktop mouse pointer handler:
 * - Ultra-smooth 2-finger pinch-to-zoom and 2-finger pan.
 * - Double-tap to zoom toggle.
 * - High-tolerance 1-finger tapping on arrows (zero missed taps on mobile).
 * - Optimized CPU performance (no hover computations during mobile touch).
 */

import { soundManager } from '../audio/SoundManager.js';

export class InputManager {
  constructor(canvas, board, renderer, particles) {
    this.canvas = canvas;
    this.board = board;
    this.renderer = renderer;
    this.particles = particles;

    this.activePointers = new Map();
    this.lastPinchDist = null;
    this.lastMidX = null;
    this.lastMidY = null;

    this.lastTapTime = 0;
    this.lastTapPos = { x: 0, y: 0 };
    this.dragStart = null;
    this.isDragging = false;

    this.initEvents();
  }

  initEvents() {
    const handleTap = (clientX, clientY) => {
      soundManager.initContext();

      if (!this.board || !this.board.level) return;

      const rect = this.canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      if (this.particles) {
        this.particles.emitRipple(px, py);
      }

      const clickedArrow = this.findArrowAtPoint(px, py);
      if (clickedArrow) {
        this.board.tapArrow(clickedArrow.id);
      }
    };

    // 1. Pointer Down
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch (_) {}

      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 1) {
        this.dragStart = {
          x: e.clientX,
          y: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          time: performance.now()
        };
        this.isDragging = false;
      } else if (this.activePointers.size === 2) {
        const pts = Array.from(this.activePointers.values());
        this.lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.lastMidX = (pts[0].x + pts[1].x) / 2;
        this.lastMidY = (pts[0].y + pts[1].y) / 2;
        this.isDragging = true;
      }
    });

    // 2. Pointer Move (Pinch Zoom & Smooth Pan)
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.activePointers.has(e.pointerId)) {
        // Desktop mouse hover effect ONLY (never lag on mobile touch)
        if (e.pointerType === 'mouse' && this.board && this.board.level) {
          const rect = this.canvas.getBoundingClientRect();
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          const hovered = this.findArrowAtPoint(px, py);
          this.board.hoveredArrowId = hovered ? hovered.id : null;
          this.canvas.style.cursor = hovered ? 'pointer' : 'default';
        }
        return;
      }

      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Multi-touch 2-Finger Pinch Zoom and 2-Finger Pan
      if (this.activePointers.size >= 2) {
        const pts = Array.from(this.activePointers.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;

        if (this.lastPinchDist && currentDist > 10 && this.lastPinchDist > 10) {
          const factor = currentDist / this.lastPinchDist;
          const rect = this.canvas.getBoundingClientRect();
          this.renderer.zoomBy(factor, midX - rect.left, midY - rect.top);
          this.lastPinchDist = currentDist;
        }

        if (this.lastMidX !== null && this.lastMidY !== null) {
          const dx = midX - this.lastMidX;
          const dy = midY - this.lastMidY;
          this.renderer.panBy(dx, dy);
        }
        this.lastMidX = midX;
        this.lastMidY = midY;
        this.isDragging = true;
        return;
      }

      // Single Pointer Pan (ONLY if zoomed in)
      if (this.activePointers.size === 1 && this.dragStart) {
        const totalDist = Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y);
        const isZoomed = this.renderer.zoom > 1.15;

        // If zoomed in, allow dragging the canvas with 1 finger after intentional threshold
        if (isZoomed && totalDist > 16) {
          this.isDragging = true;
          const dx = e.clientX - (this.dragStart.lastX || e.clientX);
          const dy = e.clientY - (this.dragStart.lastY || e.clientY);
          this.renderer.panBy(dx, dy);
          this.dragStart.lastX = e.clientX;
          this.dragStart.lastY = e.clientY;
          this.canvas.style.cursor = 'grabbing';
        }
      }
    });

    // 3. Pointer Up / Cancel
    const onPointerEnd = (e) => {
      try {
        if (this.canvas.hasPointerCapture(e.pointerId)) {
          this.canvas.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}

      this.activePointers.delete(e.pointerId);
      if (this.activePointers.size < 2) {
        this.lastPinchDist = null;
        this.lastMidX = null;
        this.lastMidY = null;
      }

      if (this.activePointers.size === 0) {
        this.canvas.style.cursor = 'default';

        if (this.dragStart) {
          const pressDuration = performance.now() - this.dragStart.time;
          const moveDist = Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y);

          // High mobile tolerance for taps: up to 22px movement or 500ms press
          if (!this.isDragging || moveDist < 22) {
            if (pressDuration < 500) {
              const now = performance.now();
              const tapDist = Math.hypot(e.clientX - this.lastTapPos.x, e.clientY - this.lastTapPos.y);

              // Double tap toggle (zoom in / reset)
              if (now - this.lastTapTime < 320 && tapDist < 30) {
                const rect = this.canvas.getBoundingClientRect();
                if (this.renderer.targetZoom > 1.25) {
                  this.renderer.resetZoom();
                } else {
                  this.renderer.zoomBy(1.85, e.clientX - rect.left, e.clientY - rect.top);
                }
                this.lastTapTime = 0;
              } else {
                this.lastTapTime = now;
                this.lastTapPos = { x: e.clientX, y: e.clientY };
                handleTap(this.dragStart.x, this.dragStart.y);
              }
            }
          }
        }
        this.isDragging = false;
        this.dragStart = null;
      }
    };

    this.canvas.addEventListener('pointerup', onPointerEnd);
    this.canvas.addEventListener('pointercancel', onPointerEnd);

    this.canvas.addEventListener('pointerleave', () => {
      if (this.board) {
        this.board.hoveredArrowId = null;
      }
      this.canvas.style.cursor = 'default';
    });

    // 4. Mouse Wheel Zoom (Desktop)
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      this.renderer.zoomBy(factor, px, py);
    }, { passive: false });
  }

  /**
   * Generous hit-testing: finds arrow within touch threshold
   */
  findArrowAtPoint(px, py) {
    if (!this.board || !this.board.arrows) return null;

    let closestArrow = null;
    const hitThreshold = Math.max(28, this.renderer.cellSize * 0.75);
    let minDistance = hitThreshold;

    for (const arrow of this.board.arrows) {
      if (arrow.isEscaped || arrow.isEscaping) continue;

      for (let i = 0; i < arrow.points.length; i++) {
        const pScreen = this.renderer.gridToScreen(arrow.points[i].x, arrow.points[i].y);
        const distPoint = Math.hypot(px - pScreen.x, py - pScreen.y);
        if (distPoint < minDistance) {
          minDistance = distPoint;
          closestArrow = arrow;
        }

        if (i > 0) {
          const pPrevScreen = this.renderer.gridToScreen(arrow.points[i - 1].x, arrow.points[i - 1].y);
          const distSeg = this.distToSegment(px, py, pPrevScreen.x, pPrevScreen.y, pScreen.x, pScreen.y);
          if (distSeg < minDistance) {
            minDistance = distSeg;
            closestArrow = arrow;
          }
        }
      }
    }

    return closestArrow;
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);

    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);

    return Math.hypot(px - projX, py - projY);
  }
}
