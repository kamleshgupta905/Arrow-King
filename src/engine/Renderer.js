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
    this.baseCellSize = 32;
    this.offsetX = 0;
    this.offsetY = 0;
    this.animTime = 0;

    // Smooth 60fps Zoom & Pan Camera System
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.targetPanX = 0;
    this.targetPanY = 0;
    this.minZoom = 0.85;
    this.maxZoom = 3.6;
    this.boardW = 0;
    this.boardH = 0;
    this.onZoomChange = null;

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

  zoomIn() {
    this.zoomBy(1.30);
  }

  zoomOut() {
    this.zoomBy(0.77);
  }

  resetZoom() {
    this.targetZoom = 1.0;
    this.targetPanX = 0;
    this.targetPanY = 0;
    if (this.onZoomChange) this.onZoomChange(1.0);
  }

  zoomBy(factor, screenX = this.width / 2, screenY = this.height / 2) {
    const prevZoom = this.targetZoom;
    let nextZoom = this.targetZoom * factor;
    nextZoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));

    if (Math.abs(nextZoom - 1.0) < 0.05 && factor < 1) {
      nextZoom = 1.0;
    }

    const ratio = nextZoom / prevZoom;
    this.targetZoom = nextZoom;

    if (nextZoom <= 1.0) {
      this.targetPanX = 0;
      this.targetPanY = 0;
    } else {
      const cx = screenX - this.width / 2;
      const cy = screenY - this.height / 2;
      this.targetPanX = (this.targetPanX - cx) * ratio + cx;
      this.targetPanY = (this.targetPanY - cy) * ratio + cy;
      this.clampPan();
    }

    if (this.onZoomChange) this.onZoomChange(this.targetZoom);
  }

  panBy(dx, dy) {
    if (this.targetZoom <= 1.02) return;
    this.targetPanX += dx;
    this.targetPanY += dy;
    this.clampPan();
  }

  clampPan() {
    if (!this.boardW || !this.boardH) return;
    const totalW = this.boardW * (this.baseCellSize * this.targetZoom);
    const totalH = this.boardH * (this.baseCellSize * this.targetZoom);

    const maxPanX = Math.max(0, (totalW - this.width * 0.70) / 2);
    const maxPanY = Math.max(0, (totalH - this.height * 0.60) / 2);

    this.targetPanX = Math.max(-maxPanX, Math.min(maxPanX, this.targetPanX));
    this.targetPanY = Math.max(-maxPanY, Math.min(maxPanY, this.targetPanY));
  }

  updateTransforms(boardW, boardH) {
    this.boardW = boardW;
    this.boardH = boardH;

    // Safe clearance margins:
    // Clear top HUD (~92px) and bottom action buttons (~92px)
    const topInset = 92;
    const bottomInset = 92;
    const sideInset = 28;

    const availableW = Math.max(80, this.width - sideInset * 2);
    const availableH = Math.max(80, this.height - (topInset + bottomInset));

    // True mathematical fit: guaranteed zero-crop on any board shape or dimensions!
    const baseFitSize = Math.min(availableW / boardW, availableH / boardH);
    this.baseCellSize = baseFitSize;

    // 60fps buttery smooth camera easing
    this.zoom += (this.targetZoom - this.zoom) * 0.22;
    this.panX += (this.targetPanX - this.panX) * 0.22;
    this.panY += (this.targetPanY - this.panY) * 0.22;

    this.cellSize = baseFitSize * this.zoom;

    const totalW = boardW * this.cellSize;
    const totalH = boardH * this.cellSize;

    // Centered cleanly in the safe playable viewport
    const safeCenterY = topInset + availableH / 2;
    this.offsetX = (this.width - totalW) / 2 + this.panX;
    this.offsetY = safeCenterY - totalH / 2 + this.panY;
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

    // 2. Render shape silhouette backdrop & subtle contour
    this.drawShapeSilhouette(ctx, board);

    // 3. Render clean dot grid aligned with the shape
    this.drawDotGrid(ctx, board);

    // 4. Render all active and animating arrows
    this.drawArrows(ctx, board);

    // 5. Render particles (ripples, sparks, confetti)
    if (this.particles) {
      this.particles.draw(ctx);
    }

    ctx.restore();
  }

  /**
   * Draws a soft shape silhouette backdrop and clean contour outline
   * so the shape (Heart, Mushroom, Triangle, Dog, etc.) is crystal clear and unmistakable.
   */
  /**
   * Draws a crisp sharp shape silhouette backdrop and sharp maze boundary (Photo 1).
   */
  drawShapeSilhouette(ctx, board) {
    if (!board.shapePoints || board.shapePoints.length === 0) return;

    ctx.save();
    const cell = this.cellSize;
    const shapeSet = new Set();
    for (const p of board.shapePoints) {
      shapeSet.add(`${p.x},${p.y}`);
    }

    // 1. Crisp sharp silhouette tile fill
    ctx.fillStyle = '#f1f5f9';
    const tileSize = cell * 0.96;

    for (const p of board.shapePoints) {
      const pos = this.gridToScreen(p.x, p.y);
      const x = pos.x - tileSize / 2;
      const y = pos.y - tileSize / 2;

      ctx.fillRect(x, y, tileSize, tileSize);
    }

    // 2. Draw razor-sharp perimeter contour boundary (Photo 1 sharp maze walls)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = Math.max(1.8, cell * 0.055);
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;

    const half = cell / 2;
    for (const p of board.shapePoints) {
      const pos = this.gridToScreen(p.x, p.y);
      const topClear = !shapeSet.has(`${p.x},${p.y - 1}`);
      const bottomClear = !shapeSet.has(`${p.x},${p.y + 1}`);
      const leftClear = !shapeSet.has(`${p.x - 1},${p.y}`);
      const rightClear = !shapeSet.has(`${p.x + 1},${p.y}`);

      ctx.beginPath();
      if (topClear) {
        ctx.moveTo(pos.x - half, pos.y - half);
        ctx.lineTo(pos.x + half, pos.y - half);
      }
      if (bottomClear) {
        ctx.moveTo(pos.x - half, pos.y + half);
        ctx.lineTo(pos.x + half, pos.y + half);
      }
      if (leftClear) {
        ctx.moveTo(pos.x - half, pos.y - half);
        ctx.lineTo(pos.x - half, pos.y + half);
      }
      if (rightClear) {
        ctx.moveTo(pos.x + half, pos.y - half);
        ctx.lineTo(pos.x + half, pos.y + half);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draws dots: crisp inside the shape silhouette, subtle outside the shape.
   */
  drawDotGrid(ctx, board) {
    ctx.save();
    const boardW = board.width;
    const boardH = board.height;
    const dotRadius = Math.max(1.2, this.cellSize * 0.055);
    const shapeSet = new Set(board.shapePoints ? board.shapePoints.map(p => `${p.x},${p.y}`) : []);

    for (let y = 1; y < boardH; y++) {
      for (let x = 1; x < boardW; x++) {
        const inShape = shapeSet.has(`${x},${y}`);
        if (!inShape) {
          ctx.fillStyle = 'rgba(203, 213, 225, 0.20)';
        } else {
          ctx.fillStyle = '#94a3b8';
        }
        const pos = this.gridToScreen(x, y);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, inShape ? dotRadius : dotRadius * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Samples points at distance intervals along a polyline to create smooth snake beads (Photo 2).
   */
  getBeadsAlongPath(points, beadSpacing) {
    if (!points || points.length === 0) return [];
    if (points.length === 1) return [{ ...points[0], isHead: true, isTail: true }];

    const segLengths = [];
    let totalLen = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const d = Math.hypot(points[i+1].x - points[i].x, points[i+1].y - points[i].y);
      segLengths.push(d);
      totalLen += d;
    }

    if (totalLen <= 0) return [{ ...points[0], isHead: true, isTail: true }];

    const beads = [];
    const numBeads = Math.max(3, Math.round(totalLen / beadSpacing));
    const step = totalLen / numBeads;

    for (let b = 0; b <= numBeads; b++) {
      const dist = b * step;
      let accum = 0;
      let segIdx = 0;
      while (segIdx < segLengths.length && accum + segLengths[segIdx] < dist) {
        accum += segLengths[segIdx];
        segIdx++;
      }
      if (segIdx >= segLengths.length) {
        beads.push({ ...points[points.length - 1], isHead: b === numBeads, isTail: b === 0 });
      } else {
        const p1 = points[segIdx];
        const p2 = points[segIdx + 1];
        const segLen = segLengths[segIdx] || 1;
        const t = Math.max(0, Math.min(1, (dist - accum) / segLen));
        beads.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
          isHead: b === numBeads,
          isTail: b === 0
        });
      }
    }

    return beads;
  }

  /**
   * Realistic slithering calculation:
   * Moves the head forward while pulling the body/tail along the sharp turns.
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
   * Renders the animated colorful segmented snake with cartoon googly eyes (Photo 2).
   */
  drawSnake(ctx, arrow, screenPoints, headScreen, dx, dy, opacity, isDizzy = false) {
    if (!screenPoints || screenPoints.length < 2) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    const cell = this.cellSize;
    const pal = arrow.palette || {
      body: arrow.color || '#0084ff',
      light: '#5ac8fa',
      shadow: '#0055c4',
      eye: '#ffffff',
      pupil: '#07162c'
    };

    // 1. Calculate beads along the slithering path
    const beadSpacing = Math.max(7, cell * 0.44);
    const beads = this.getBeadsAlongPath(screenPoints, beadSpacing);
    const baseRadius = Math.max(5, cell * 0.38);

    // 2. Draw body segments / beads from tail to head
    for (let i = 0; i < beads.length; i++) {
      const b = beads[i];
      let r = baseRadius;

      // Tail taper: first 3 segments taper down
      if (i === 0) {
        r = baseRadius * 0.38;
      } else if (i === 1) {
        r = baseRadius * 0.62;
      } else if (i === 2) {
        r = baseRadius * 0.82;
      }

      // Head segment is slightly larger
      if (b.isHead) {
        r = baseRadius * 1.12;
      }

      // 3D glossy radial gradient (Photo 2 bubble beads)
      const grad = ctx.createRadialGradient(
        b.x - r * 0.32,
        b.y - r * 0.32,
        r * 0.10,
        b.x,
        b.y,
        r
      );
      grad.addColorStop(0, pal.light);
      grad.addColorStop(0.68, pal.body);
      grad.addColorStop(1, pal.shadow);

      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle contour ring around each bead (Photo 2 caterpillar look)
      ctx.strokeStyle = pal.shadow;
      ctx.lineWidth = Math.max(1.2, cell * 0.038);
      ctx.stroke();
    }

    // 3. Draw Head & Cartoon Googly Eyes
    const head = beads[beads.length - 1];
    const headR = baseRadius * 1.12;

    // Perpendicular vector for placing left & right eyes
    const perpX = -dy;
    const perpY = dx;
    const eyeSpacing = headR * 0.52;
    const eyeR = Math.max(2.8, headR * 0.42);

    const forwardShift = headR * 0.28;
    const eyeCenterX = head.x + dx * forwardShift;
    const eyeCenterY = head.y + dy * forwardShift;

    const eye1 = {
      x: eyeCenterX + perpX * eyeSpacing,
      y: eyeCenterY + perpY * eyeSpacing
    };
    const eye2 = {
      x: eyeCenterX - perpX * eyeSpacing,
      y: eyeCenterY - perpY * eyeSpacing
    };

    const drawSingleEye = (eyePos) => {
      // Eyeball white
      ctx.beginPath();
      ctx.arc(eyePos.x, eyePos.y, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = Math.max(1.2, eyeR * 0.24);
      ctx.stroke();

      if (isDizzy) {
        // Dizzy cartoon cross eye
        const crossSize = eyeR * 0.55;
        ctx.beginPath();
        ctx.moveTo(eyePos.x - crossSize, eyePos.y - crossSize);
        ctx.lineTo(eyePos.x + crossSize, eyePos.y + crossSize);
        ctx.moveTo(eyePos.x + crossSize, eyePos.y - crossSize);
        ctx.lineTo(eyePos.x - crossSize, eyePos.y + crossSize);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = Math.max(1.5, eyeR * 0.3);
        ctx.stroke();
      } else {
        // Dark pupil looking in travel direction
        const pupilR = eyeR * 0.52;
        const pupilOffset = eyeR * 0.32;
        const px = eyePos.x + dx * pupilOffset;
        const py = eyePos.y + dy * pupilOffset;

        ctx.beginPath();
        ctx.arc(px, py, pupilR, 0, Math.PI * 2);
        ctx.fillStyle = pal.pupil || '#0f172a';
        ctx.fill();

        // White catchlight sparkle dot
        ctx.beginPath();
        ctx.arc(px - pupilR * 0.35, py - pupilR * 0.35, pupilR * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    };

    drawSingleEye(eye1);
    drawSingleEye(eye2);

    ctx.restore();
  }

  /**
   * Draws all active arrows:
   * - Sharp 90-degree maze vectors on the board (Photo 1 sharp geometry).
   * - Vibrantly transforms into animated segmented snake with googly eyes on escape/collision (Photo 2).
   */
  drawArrows(ctx, board) {
    ctx.save();

    const lineWidth = Math.max(3.6, this.cellSize * 0.14);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;

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
      let gridPoints = arrow.points;
      let gridHead = arrow.points[arrow.points.length - 1];

      if (arrow.isEscaping) {
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

      // When clicked to escape or colliding: BECOMES THE ANIMATED SEGMENTED SNAKE (Photo 2)!
      if (arrow.isEscaping || arrow.isColliding) {
        this.drawSnake(
          ctx,
          arrow,
          screenPoints,
          headScreen,
          dx,
          dy,
          opacity,
          arrow.isColliding && arrow.hasImpacted
        );
        continue;
      }

      // 3. Stationary arrow on board: Razor-sharp 90-degree maze vector (Photo 1)
      let strokeColor = arrow.color || '#181e28';

      if (arrow.isHighlighted || arrow.id === board.hoveredArrowId) {
        strokeColor = '#e63946'; // Vibrant Red feedback
      } else if (arrow.id === board.hintArrowId) {
        const pulse = 0.5 + 0.5 * Math.sin(this.animTime * 8);
        strokeColor = pulse > 0.5 ? '#10b981' : '#f59e0b';
      }

      ctx.globalAlpha = opacity;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 4;

      // Draw razor-sharp polyline body: stop right at base of arrowhead
      if (screenPoints.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);

        for (let i = 1; i < screenPoints.length - 1; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }

        const baseEndX = tipX - dx * (headLength * 0.75);
        const baseEndY = tipY - dy * (headLength * 0.75);
        ctx.lineTo(baseEndX, baseEndY);
        ctx.stroke();
      }

      // Draw razor-sharp arrowhead at tip (Photo 1)
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
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;

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
    ctx.stroke();

    ctx.restore();
  }
}
