/**
 * Renderer.js
 * High-DPI Canvas 2D renderer for authentic Arrow Maze:
 * Clean white/off-white canvas with subtle dot grid (Photo 5),
 * dark charcoal arrow paths with rounded corners & razor-sharp arrowheads (Photos 1, 2, 3),
 * realistic snake slithering for escapes AND forward-to-obstacle collisions with recoil,
 * impact sparks, red wrong-move feedback, and particle bursts.
 */

export class Renderer {
  constructor(canvas, particleSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = particleSystem;
    this.dpr = window.devicePixelRatio || 1;

    this.width = 0;
    this.height = 0;
    this.cellSize = 32;
    this.offsetX = 0;
    this.offsetY = 0;
    this.animTime = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  gridToScreen(gx, gy) {
    return {
      x: this.offsetX + gx * this.cellSize,
      y: this.offsetY + gy * this.cellSize
    };
  }

  screenToGrid(px, py) {
    return {
      x: (px - this.offsetX) / this.cellSize,
      y: (py - this.offsetY) / this.cellSize
    };
  }

  updateTransforms(boardW, boardH) {
    const availableW = this.width - 48;
    const availableH = this.height - 150;

    this.cellSize = Math.max(16, Math.min(availableW / boardW, availableH / boardH));

    const totalW = boardW * this.cellSize;
    const totalH = boardH * this.cellSize;

    this.offsetX = (this.width - totalW) / 2;
    this.offsetY = (this.height - totalH) / 2 + 24;
  }

  render(board, dt = 0.016) {
    this.animTime += dt;
    const ctx = this.ctx;

    // 1. Clean light canvas background
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, this.width, this.height);

    if (!board || !board.level) {
      ctx.restore();
      return;
    }

    this.updateTransforms(board.width, board.height);

    // 2. Render subtle regular dot grid (Photo 5 style)
    this.drawDotGrid(ctx, board.width, board.height);

    // 3. Render all active and animating arrows
    this.drawArrows(ctx, board);

    // 4. Render particles (ripples, sparks, confetti)
    if (this.particles) {
      this.particles.draw(ctx);
    }

    ctx.restore();
  }

  /**
   * Draws a regular dot grid across the board bounds (matching Photo 5).
   */
  drawDotGrid(ctx, boardW, boardH) {
    ctx.save();
    ctx.fillStyle = '#cbd5e1';

    const dotRadius = Math.max(1.2, this.cellSize * 0.05);

    for (let y = 1; y < boardH; y++) {
      for (let x = 1; x < boardW; x++) {
        const pos = this.gridToScreen(x, y);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Realistic slithering calculation:
   * Given forward travel distance, moves the head forward while pulling the body/tail along the turns.
   */
  getSlitheringPath(arrow, board, forwardDist) {
    const points = arrow.points;
    const dir = arrow.dir;
    const dx = dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0;
    const dy = dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0;

    const segLengths = [];
    let bodyLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const d = Math.hypot(points[i+1].x - points[i].x, points[i+1].y - points[i].y);
      segLengths.push(d);
      bodyLength += d;
    }

    const s = Math.max(0, forwardDist);
    const head = points[points.length - 1];
    const newHead = {
      x: head.x + dx * s,
      y: head.y + dy * s
    };

    if (s >= bodyLength) {
      const tailDist = s - bodyLength;
      const newTail = {
        x: head.x + dx * tailDist,
        y: head.y + dy * tailDist
      };
      return {
        points: [newTail, newHead],
        head: newHead
      };
    }

    let accum = 0;
    let segIdx = 0;
    while (segIdx < segLengths.length && accum + segLengths[segIdx] <= s) {
      accum += segLengths[segIdx];
      segIdx++;
    }

    const rem = s - accum;
    const segLen = segLengths[segIdx] || 1;
    const t = rem / segLen;

    const p1 = points[segIdx];
    const p2 = points[segIdx + 1];
    const currentTail = {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    };

    const currentPoints = [currentTail];
    for (let i = segIdx + 1; i < points.length; i++) {
      currentPoints.push({ x: points[i].x, y: points[i].y });
    }
    currentPoints.push(newHead);

    return {
      points: currentPoints,
      head: newHead
    };
  }

  /**
   * Draws arrows with rounded turns, razor-sharp arrowheads, and red highlights.
   */
  drawArrows(ctx, board) {
    ctx.save();

    const lineWidth = Math.max(3.2, this.cellSize * 0.13);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const headLength = Math.max(10, this.cellSize * 0.38);
    const headWidth = Math.max(9, this.cellSize * 0.34);

    for (const arrow of board.arrows) {
      if (arrow.isEscaped) continue;

      let bumpOffsetX = 0;
      let bumpOffsetY = 0;
      let opacity = 1.0;

      const dx = arrow.dir === 'RIGHT' ? 1 : arrow.dir === 'LEFT' ? -1 : 0;
      const dy = arrow.dir === 'DOWN' ? 1 : arrow.dir === 'UP' ? -1 : 0;

      // 1. Calculate impact shudder on a blocker that was hit
      if (arrow.impactShudder > 0) {
        const shudder = Math.sin(arrow.impactShudder * 50) * (arrow.impactShudder * 10);
        bumpOffsetX += (-dy) * shudder;
        bumpOffsetY += dx * shudder;
      }

      // 2. Realistic slithering:
      // Case A: Escaping (slithers forward off screen)
      // Case B: Colliding (slithers forward to obstacle, hits, and slithers back!)
      let gridPoints = arrow.points;
      let gridHead = arrow.points[arrow.points.length - 1];

      if (arrow.isEscaping) {
        // Total distance to clear board
        const totalExitDist = Math.max(board.width, board.height) * 1.4;
        let bodyLength = 0;
        for (let i = 0; i < arrow.points.length - 1; i++) {
          bodyLength += Math.hypot(arrow.points[i+1].x - arrow.points[i].x, arrow.points[i+1].y - arrow.points[i].y);
        }
        const totalDist = bodyLength + totalExitDist;
        const eased = Math.pow(arrow.escapeProgress, 1.4);
        const forwardDist = eased * totalDist;

        const slither = this.getSlitheringPath(arrow, board, forwardDist);
        gridPoints = slither.points;
        gridHead = slither.head;
        opacity = Math.max(0, 1 - Math.pow(arrow.escapeProgress, 3));
      } else if (arrow.isColliding) {
        // Forward travel to obstacle, impact, and return to original place!
        const p = arrow.collisionProgress;
        let forwardDist = 0;
        let shake = 0;

        if (p <= 0.45) {
          const u = p / 0.45;
          const easedU = Math.sin(u * Math.PI / 2);
          forwardDist = easedU * arrow.collisionDist;
        } else {
          const v = (p - 0.45) / 0.55;
          const easedV = Math.cos(v * Math.PI / 2);
          forwardDist = easedV * arrow.collisionDist;
          shake = Math.sin(v * Math.PI * 6) * (1 - v) * 0.14;
        }

        const slither = this.getSlitheringPath(arrow, board, forwardDist);
        gridPoints = slither.points;
        gridHead = slither.head;

        bumpOffsetX += (-dy) * shake * this.cellSize;
        bumpOffsetY += dx * shake * this.cellSize;
      }

      // 3. Color determination
      let strokeColor = '#181e28'; // Crisp ink black

      if (arrow.isHighlighted || arrow.isColliding || arrow.id === board.hoveredArrowId) {
        strokeColor = '#e63946'; // Vibrant Red (Photo 5)
      } else if (arrow.id === board.hintArrowId) {
        const pulse = 0.5 + 0.5 * Math.sin(this.animTime * 8);
        strokeColor = pulse > 0.5 ? '#10b981' : '#f59e0b';
      }

      ctx.globalAlpha = opacity;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;

      // Convert points to screen coordinates
      const screenPoints = gridPoints.map(p => {
        const s = this.gridToScreen(p.x, p.y);
        return {
          x: s.x + bumpOffsetX,
          y: s.y + bumpOffsetY
        };
      });

      const headScreen = this.gridToScreen(gridHead.x, gridHead.y);
      const tipX = headScreen.x + bumpOffsetX;
      const tipY = headScreen.y + bumpOffsetY;

      // Draw polyline body: stop right at the base of the arrowhead so line cap never pokes through the tip!
      if (screenPoints.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);

        for (let i = 1; i < screenPoints.length - 1; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }

        // Final segment ends at base of arrowhead
        const baseEndX = tipX - dx * (headLength * 0.75);
        const baseEndY = tipY - dy * (headLength * 0.75);
        ctx.lineTo(baseEndX, baseEndY);
        ctx.stroke();
      }

      // Draw razor-sharp arrowhead at the tip
      this.drawArrowHead(
        ctx,
        tipX,
        tipY,
        arrow.dir,
        headLength,
        headWidth,
        strokeColor
      );
    }

    ctx.restore();
  }

  /**
   * Draws a razor-sharp classic triangular arrowhead with tip perfectly at (x, y).
   */
  drawArrowHead(ctx, tipX, tipY, dir, headLength, headWidth, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    let angle = 0;
    if (dir === 'RIGHT') angle = 0;
    else if (dir === 'DOWN') angle = Math.PI / 2;
    else if (dir === 'LEFT') angle = Math.PI;
    else if (dir === 'UP') angle = -Math.PI / 2;

    ctx.translate(tipX, tipY);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0); // Razor-sharp tip at (0, 0)
    ctx.lineTo(-headLength, -headWidth / 2);
    ctx.lineTo(-headLength, headWidth / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
