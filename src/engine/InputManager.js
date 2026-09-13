/**
 * InputManager.js
 * Mobile touch and desktop mouse pointer handler with generous polyline hit-testing.
 * Supports tapping anywhere along an arrow's body or arrowhead.
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
    this.lastTapTime = 0;
    this.lastTapPos = { x: 0, y: 0 };
    this.dragStart = { x: 0, y: 0, time: 0 };
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
      this.canvas.setPointerCapture(e.pointerId);
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
        this.isDragging = true;
      }
    });

    // 2. Pointer Move (Panning & Multi-touch Pinch Zoom)
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.activePointers.has(e.pointerId)) {
        // Desktop hover effect when not pressing
        if (!this.board || !this.board.level) return;
        const rect = this.canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const hovered = this.findArrowAtPoint(px, py);
        this.board.hoveredArrowId = hovered ? hovered.id : null;
        this.canvas.style.cursor = hovered ? 'pointer' : 'default';
        return;
      }

      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Multi-touch Pinch to Zoom
      if (this.activePointers.size === 2 && this.lastPinchDist) {
        const pts = Array.from(this.activePointers.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (currentDist > 10 && this.lastPinchDist > 10) {
          const factor = currentDist / this.lastPinchDist;
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          const rect = this.canvas.getBoundingClientRect();
          this.renderer.zoomBy(factor, midX - rect.left, midY - rect.top);
          this.lastPinchDist = currentDist;
        }
        return;
      }

      // Single Pointer Pan / Drag
      if (this.activePointers.size === 1 && this.dragStart) {
        const totalDist = Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y);
        if (totalDist > 9) {
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

    // 3. Pointer Up & Tap / Double-Tap Trigger
    const onPointerEnd = (e) => {
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
      this.activePointers.delete(e.pointerId);
      if (this.activePointers.size < 2) {
        this.lastPinchDist = null;
      }

      if (this.activePointers.size === 0) {
        this.canvas.style.cursor = 'default';

        if (!this.isDragging && this.dragStart) {
          const pressDuration = performance.now() - this.dragStart.time;
          const moveDist = Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y);

          if (pressDuration < 420 && moveDist < 10) {
            const now = performance.now();
            const tapDist = Math.hypot(e.clientX - this.lastTapPos.x, e.clientY - this.lastTapPos.y);

            // Double tap to zoom toggle
            if (now - this.lastTapTime < 320 && tapDist < 25) {
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
              handleTap(e.clientX, e.clientY);
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

    // 4. Mouse Wheel Zoom centered at mouse position
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      this.renderer.zoomBy(factor, px, py);
    }, { passive: false });

    // Prevent browser native gestures on canvas
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  /**
   * Generous hit-testing: calculates distance from screen point (px, py)
   * to every segment of every active arrow.
   */
  findArrowAtPoint(px, py) {
    if (!this.board || !this.board.arrows) return null;

    let closestArrow = null;
    const hitThreshold = Math.max(24, this.renderer.cellSize * 0.70);
    let minDistance = hitThreshold;

    for (const arrow of this.board.arrows) {
      if (arrow.isEscaped || arrow.isEscaping) continue;

      // Check distance to all segments of this arrow
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

  /**
   * Distance from point (px, py) to line segment (x1, y1) - (x2, y2).
   */
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
