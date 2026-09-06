/**
 * ParticleSystem.js
 * High-performance 2D particle simulation for neon trails,
 * tap ripples, collision sparks, lock-in shockwaves, and victory confetti.
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.ripples = [];
    this.shockwaves = [];
  }

  update(dt) {
    // Update regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size = p.baseSize * (0.4 + 0.6 * p.alpha);
    }

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.life -= dt;
      if (r.life <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }
      r.radius += r.growthRate * dt;
      r.alpha = Math.max(0, r.life / r.maxLife);
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      s.radius += s.speed * dt;
      s.alpha = Math.max(0, s.life / s.maxLife);
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Draw ripples
    for (const r of this.ripples) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha * 0.7;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 2. Draw shockwaves
    for (const s of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = s.alpha * 0.8;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 3. Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.glow || 8;

      if (p.isConfetti) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Touch/click ripple
   */
  emitRipple(x, y, color = '#00f0ff') {
    this.ripples.push({
      x,
      y,
      radius: 6,
      growthRate: 110,
      color,
      life: 0.35,
      maxLife: 0.35,
      alpha: 1
    });
  }

  /**
   * Moving arrow trail mote
   */
  emitTrail(x, y, color = '#00f0ff') {
    if (Math.random() > 0.4) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      baseSize: 2 + Math.random() * 2.5,
      size: 3,
      friction: 0.9,
      color,
      glow: 6,
      life: 0.3,
      maxLife: 0.3,
      alpha: 1
    });
  }

  /**
   * Collision / bounce sparks
   */
  emitBounceSparks(x, y, angle) {
    // Sparks fly opposite to direction of travel
    const backAngle = angle + Math.PI;
    const count = 14;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.6;
      const speed = 70 + Math.random() * 120;
      const rad = backAngle + spread;
      this.particles.push({
        x,
        y,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        baseSize: 2.5 + Math.random() * 2,
        size: 3,
        friction: 0.92,
        color: Math.random() > 0.5 ? '#ffd166' : '#ff007f',
        glow: 10,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.5,
        alpha: 1
      });
    }
  }

  /**
   * Lock-in celebration burst
   */
  emitLockInBurst(x, y, color = '#00f0ff') {
    // Expanding neon shockwave
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      speed: 160,
      color,
      life: 0.45,
      maxLife: 0.45,
      alpha: 1
    });

    // Radial sparkle burst
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseSize: 3 + Math.random() * 3,
        size: 4,
        friction: 0.93,
        color: i % 2 === 0 ? color : '#ffd166',
        glow: 12,
        life: 0.5 + Math.random() * 0.25,
        maxLife: 0.75,
        alpha: 1
      });
    }
  }

  /**
   * Grand Victory confetti and firework display
   */
  emitVictoryConfetti(boardWidth, boardHeight) {
    const colors = ['#00f0ff', '#ff007f', '#ffd166', '#00f5d4', '#b5179e'];
    const count = 80;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * boardWidth;
      const y = Math.random() * (boardHeight * 0.3);
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 140,
        vy: -60 - Math.random() * 120,
        gravity: 240,
        friction: 0.98,
        baseSize: 5 + Math.random() * 4,
        size: 6,
        isConfetti: true,
        rotation: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        glow: 8,
        life: 1.8 + Math.random() * 1.2,
        maxLife: 3.0,
        alpha: 1
      });
    }
  }

  clear() {
    this.particles = [];
    this.ripples = [];
    this.shockwaves = [];
  }
}
