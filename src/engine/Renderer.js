/**
 * Renderer.js
 * High-DPI Canvas 2D renderer for authentic Arrow Maze:
 * Clean white/off-white canvas with subtle dot grid (Photo 5),
 * dark charcoal arrow paths with rounded corners & razor-sharp arrowheads (Photos 1, 2, 3),
 * realistic snake slithering for escapes AND forward-to-obstacle collisions with recoil,
 * impact sparks, red wrong-move feedback, and particle bursts.
 */

import { getLevelTheme, drawLevelBackground, drawShapeBoardBackdrop } from './LevelThemes.js';

export function arrowBodyLength(points) {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
  }
  return length;
}

/** Head leads, tail follows. Path length stays equal to the resting arrow. */
export function slitherPath(points, dir, forwardDist) {
  const dx = dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0;
  const dy = dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0;
  const segLengths = [];
  let bodyLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segLengths.push(d);
    bodyLength += d;
  }

  const s = Math.max(0, forwardDist);
  const head = points[points.length - 1];
  const newHead = { x: head.x + dx * s, y: head.y + dy * s };

  if (s >= bodyLength) {
    const tailDist = s - bodyLength;
    return {
      points: [
        { x: head.x + dx * tailDist, y: head.y + dy * tailDist },
        newHead
      ],
      head: newHead,
      bodyLength
    };
  }

  let accum = 0;
  let segIdx = 0;
  while (segIdx < segLengths.length && accum + segLengths[segIdx] <= s) {
    accum += segLengths[segIdx];
    segIdx++;
  }
  const segLen = segLengths[segIdx] || 1;
  const t = (s - accum) / segLen;
  const p1 = points[segIdx];
  const p2 = points[segIdx + 1] || p1;
  const currentPoints = [{
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  }];
  for (let i = segIdx + 1; i < points.length; i++) {
    currentPoints.push({ x: points[i].x, y: points[i].y });
  }
  currentPoints.push(newHead);
  return { points: currentPoints, head: newHead, bodyLength };
}

/** Cells the tail must still travel after reaching the original head, so it clears the screen. */
export function clearanceCells(view, head, dir) {
  const cell = view.cellSize || 0;
  if (!view.width || !view.height || cell < 4) return null;
  const sx = view.offsetX + head.x * cell;
  const sy = view.offsetY + head.y * cell;
  let px = view.width;
  if (dir === 'RIGHT') px = view.width - sx;
  else if (dir === 'LEFT') px = sx;
  else if (dir === 'DOWN') px = view.height - sy;
  else px = sy;
  return Math.max(1.2, px / cell) + 1.8;
}

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
    this.maxZoom = 8.0;
    this.boardW = 0;
    this.boardH = 0;
    this.onZoomChange = null;

    // Smooth Game Start Entrance Animation (scale & fade on level start)
    this.entranceAnimTime = 0;
    this.entranceDuration = 0.55;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  startEntranceAnimation() {
    this.entranceAnimTime = 0;
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

    // Clear the premiere header + star/path capsule, and the bottom dock.
    const topInset = 108;
    const bottomInset = 84;
    const sideInset = 14;

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

    if (!board || !board.level) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
      return;
    }

    const cat = board.level.category || 'beginner';
    const lvlNum = board.level.levelNumber || 1;
    const theme = getLevelTheme(cat, lvlNum);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.width, this.height);

    this.updateTransforms(board.width, board.height);

    // Game Start Entrance Animation (smooth elastic/ease-out pop & fade-in)
    this.entranceAnimTime += dt;
    const progress = Math.min(1.0, this.entranceAnimTime / this.entranceDuration);
    // Smooth ease-out cubic curve
    const ease = 1 - Math.pow(1 - progress, 3);
    const entranceScale = 0.86 + 0.14 * ease;
    const entranceAlpha = Math.min(1.0, progress * 1.3);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.save();
    if (progress < 1.0) {
      ctx.globalAlpha = entranceAlpha;
      ctx.translate(centerX, centerY);
      ctx.scale(entranceScale, entranceScale);
      ctx.translate(-centerX, -centerY);
    }

    this.drawDotGrid(ctx, board, theme);

    // 4. Render all active and animating arrows
    this.drawArrows(ctx, board, theme);

    // 5. Render particles (ripples, sparks, confetti)
    if (this.particles) {
      this.particles.draw(ctx);
    }

    ctx.restore();
  }

  /**
   * Draws a tactile shape card backdrop directly behind the arrow puzzle.
   * Gives the arrows a clean, elevated plate tailored to the level and complexity theme.
   */
  drawBoardBackplate(ctx, board, theme) {
    const pts = board.shapePoints || [];
    if (pts.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const topLeft = this.gridToScreen(minX, minY);
    const botRight = this.gridToScreen(maxX, maxY);
    const bounds = {
      x: topLeft.x - this.cellSize * 0.5,
      y: topLeft.y - this.cellSize * 0.5,
      width: (botRight.x - topLeft.x) + this.cellSize,
      height: (botRight.y - topLeft.y) + this.cellSize
    };

    drawShapeBoardBackdrop(ctx, bounds, theme, this.zoom);
  }

  /**
   * Draws subtle pinpoint dots inside the shape silhouette for grid alignment (Photos 1-5).
   */
  drawShapeFill(ctx, board) {
    const pts = board.shapePoints || [];
    if (!pts.length) return;
    const occupied = new Set(pts.map((p) => `${p.x},${p.y}`));
    const size = this.cellSize * 1.06;
    ctx.save();
    ctx.fillStyle = '#E7EEF6';
    ctx.strokeStyle = '#1A2744';
    ctx.lineWidth = Math.max(1.5, this.cellSize * 0.06);
    ctx.beginPath();
    for (const p of pts) {
      const pos = this.gridToScreen(p.x, p.y);
      const x = pos.x - size / 2;
      const y = pos.y - size / 2;
      ctx.fillRect(x, y, size, size);
      const edge = (dx, dy) => !occupied.has(`${p.x + dx},${p.y + dy}`);
      if (edge(0, -1)) { ctx.moveTo(x, y); ctx.lineTo(x + size, y); }
      if (edge(0, 1)) { ctx.moveTo(x, y + size); ctx.lineTo(x + size, y + size); }
      if (edge(-1, 0)) { ctx.moveTo(x, y); ctx.lineTo(x, y + size); }
      if (edge(1, 0)) { ctx.moveTo(x + size, y); ctx.lineTo(x + size, y + size); }
    }
    ctx.stroke();
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawDotGrid(ctx, board, theme) {
    ctx.save();
    const dotRadius = Math.max(1.35, this.cellSize * 0.07);
    ctx.fillStyle = '#C5CED8';
    const filled = new Set();
    for (const arrow of (board.arrows || [])) {
      if (arrow.isEscaped) continue;
      for (const p of arrow.points) filled.add(`${p.x},${p.y}`);
    }

    for (const p of (board.shapePoints || [])) {
      if (filled.has(`${p.x},${p.y}`)) continue;
      const pos = this.gridToScreen(p.x, p.y);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Samples points at distance intervals along a polyline to create smooth snake beads.
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
   * Renders the animated colorful segmented snake with cartoon googly eyes when escaping or colliding.
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

      // 3D glossy radial gradient (bubble beads)
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

      // Subtle contour ring around each bead
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
   * Realistic slithering calculation:
   * Moves the head forward while pulling the body/tail along the sharp turns.
   */
  getSlitheringPath(arrow, board, forwardDist) {
    return slitherPath(arrow.points, arrow.dir, forwardDist);
  }

  exitClearanceCells(arrow) {
    const head = arrow.points[arrow.points.length - 1];
    return clearanceCells({
      width: this.width,
      height: this.height,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      cellSize: this.cellSize
    }, head, arrow.dir);
  }

  /**
   * Draws all active arrows:
   * - Bold, razor-sharp black 90-degree maze vectors on clean white canvas (Photos 1-5).
   * - Vibrant Red blocked feedback with smooth forward-thud & recoil (Photo 5 Dog level).
   * - Smooth glide-off escape animation.
   */
  drawArrows(ctx, board, theme) {
    ctx.save();

    // High visibility line width that scales with cell size
    const lineWidth = Math.max(2.5, Math.min(this.cellSize * 0.28, 5.6));
    const headLength = lineWidth * 1.55;
    const headWidth = lineWidth * 1.72;

    for (const arrow of board.arrows) {
      if (arrow.isEscaped) continue;

      let bumpOffsetX = 0;
      let bumpOffsetY = 0;
      let opacity = 1.0;

      const dx = arrow.dir === 'RIGHT' ? 1 : arrow.dir === 'LEFT' ? -1 : 0;
      const dy = arrow.dir === 'DOWN' ? 1 : arrow.dir === 'UP' ? -1 : 0;

      // 1. Calculate impact shudder on a blocker that was hit
      if (arrow.impactShudder > 0) {
        const shudder = Math.sin(arrow.impactShudder * 50) * (arrow.impactShudder * 8);
        bumpOffsetX += (-dy) * shudder;
        bumpOffsetY += dx * shudder;
      }

      // 2. Realistic path movement on escape or collision
      let gridPoints = arrow.points;
      let gridHead = arrow.points[arrow.points.length - 1];

      if (arrow.isEscaping) {
        const totalExitDist = Math.max(8, Math.min(board.width, board.height) * 0.72);
        let bodyLength = 0;
        for (let i = 0; i < arrow.points.length - 1; i++) {
          bodyLength += Math.hypot(arrow.points[i+1].x - arrow.points[i].x, arrow.points[i+1].y - arrow.points[i].y);
        }
        const totalDist = arrow.escapeTravel || (bodyLength + totalExitDist);
        const p = Math.max(0, Math.min(1, arrow.escapeProgress));
        const forwardDist = p * totalDist;

        const slither = this.getSlitheringPath(arrow, board, forwardDist);
        gridPoints = slither.points;
        gridHead = slither.head;
        opacity = 1;
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

      let strokeColor = '#111827';
      if (arrow.isColliding || arrow.isHighlighted) {
        strokeColor = '#DC2626';
      } else if (arrow.id === board.hintArrowId) {
        strokeColor = '#2F6BFF';
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.shadowBlur = 0;

      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = (arrow.isColliding || arrow.isHighlighted) ? lineWidth * 1.08 : lineWidth;
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2.2;

      if (screenPoints.length >= 2) {
        const last = screenPoints[screenPoints.length - 1];
        const prev = screenPoints[screenPoints.length - 2];
        const seg = Math.hypot(last.x - prev.x, last.y - prev.y) || 1;
        const cut = Math.min(headLength * 0.62, Math.max(0, seg - 1.5));
        const endX = last.x - ((last.x - prev.x) / seg) * cut;
        const endY = last.y - ((last.y - prev.y) / seg) * cut;

        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        for (let i = 1; i < screenPoints.length - 1; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Draw razor-sharp arrowhead at tip (Photos 1-5)
      this.drawArrowHead(
        ctx,
        tipX,
        tipY,
        arrow.dir,
        headLength,
        headWidth,
        strokeColor
      );

      ctx.restore();
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

    let angle = 0;
    if (dir === 'RIGHT') angle = 0;
    else if (dir === 'DOWN') angle = Math.PI / 2;
    else if (dir === 'LEFT') angle = Math.PI;
    else if (dir === 'UP') angle = -Math.PI / 2;

    ctx.translate(tipX, tipY);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-headLength, -headWidth / 2);
    ctx.lineTo(-headLength, headWidth / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
