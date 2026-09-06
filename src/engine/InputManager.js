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

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleTap(e.clientX, e.clientY);
    });

    // Desktop hover effect
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.board || !this.board.level) return;
      const rect = this.canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const hovered = this.findArrowAtPoint(px, py);
      this.board.hoveredArrowId = hovered ? hovered.id : null;
      this.canvas.style.cursor = hovered ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('pointerleave', () => {
      if (this.board) {
        this.board.hoveredArrowId = null;
      }
      this.canvas.style.cursor = 'default';
    });

    // Prevent pinch-zoom / scroll on touch devices
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
    const hitThreshold = Math.max(20, this.renderer.cellSize * 0.6);
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
