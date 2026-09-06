/**
 * IntroScreen.js - Arrow King
 * Ultra-professional home screen with a dynamic opening animation:
 * 5 precision vector arrows glide in and lock into an iconic Royal Arrow Crown emblem,
 * accompanied by subtle particle shimmer and sleek tactile controls.
 */

import { soundManager } from '../audio/SoundManager.js';

export class IntroScreen {
  constructor(container, onPlayCallback, onLevelSelectCallback) {
    this.container = container;
    this.onPlay = onPlayCallback;
    this.onLevelSelect = onLevelSelectCallback;
    this.animFrame = null;
    this.soundMuted = false;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="intro-screen king-intro">
        <div class="intro-animation-container">
          <canvas id="intro-canvas"></canvas>
          
          <div class="intro-content king-content">
            <div class="king-badge">
              <span class="badge-crown">👑</span>
              <span>ROYAL VECTOR PUZZLE</span>
            </div>

            <h1 class="king-title">
              <span class="text-white">ARROW</span>
              <span class="text-gold">KING</span>
            </h1>

            <p class="king-subtitle">Master the sequence. Clear the board. Claim the crown.</p>

            <div class="king-features-strip">
              <div class="feature-chip">
                <span class="chip-icon">🎯</span>
                <span>Vector Puzzle</span>
              </div>
              <div class="feature-chip">
                <span class="chip-icon">🛡️</span>
                <span>0 Collisions</span>
              </div>
              <div class="feature-chip chip-hacker">
                <span class="chip-icon">⚡</span>
                <span>Hacker Mode</span>
              </div>
            </div>

            <div class="intro-buttons king-buttons">
              <button id="btn-intro-play" class="btn btn-king-primary" aria-label="Start Game">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4"/>
                </svg>
                <span>PLAY GAME</span>
              </button>

              <button id="btn-intro-levels" class="btn btn-king-secondary" aria-label="Select Level">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                </svg>
                <span>LEVEL SELECT</span>
              </button>
            </div>

            <div class="king-footer-bar">
              <button id="btn-king-sound" class="icon-toggle-btn" title="Toggle Sound" aria-label="Sound Toggle">
                <svg id="sound-icon-on" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <svg id="sound-icon-off" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              </button>
              <span class="king-version-tag">v1.0.0 • Offline Ready</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.initCanvasAnimation();
    this.bindEvents();
  }

  bindEvents() {
    const playBtn = this.container.querySelector('#btn-intro-play');
    const levelsBtn = this.container.querySelector('#btn-intro-levels');
    const soundBtn = this.container.querySelector('#btn-king-sound');

    playBtn?.addEventListener('click', () => {
      soundManager.playTap();
      soundManager.initContext();
      soundManager.startMusic();
      this.hide();
      if (this.onPlay) this.onPlay();
    });

    levelsBtn?.addEventListener('click', () => {
      soundManager.playTap();
      soundManager.initContext();
      soundManager.startMusic();
      this.hide();
      if (this.onLevelSelect) this.onLevelSelect();
    });

    soundBtn?.addEventListener('click', () => {
      this.soundMuted = soundManager.toggleMute();
      const onIcon = this.container.querySelector('#sound-icon-on');
      const offIcon = this.container.querySelector('#sound-icon-off');
      if (onIcon && offIcon) {
        onIcon.style.display = this.soundMuted ? 'none' : 'block';
        offIcon.style.display = this.soundMuted ? 'block' : 'none';
      }
    });
  }

  /**
   * Opening Royal Crown animation:
   * 5 precision arrows glide inward, locking into an interlocking Crown formation.
   * Subtle golden shimmer particles disperse when the crown locks.
   */
  initCanvasAnimation() {
    const canvas = this.container.querySelector('#intro-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 5 Arrows forming the 5 Crown peaks
    // Crown target relative offsets from center:
    const crownPeaks = [
      { x: -54, y: -8,  angle: -0.35, length: 34, color: '#f59e0b' },
      { x: -28, y: -26, angle: -0.18, length: 44, color: '#f59e0b' },
      { x: 0,   y: -44, angle: 0,     length: 52, color: '#fbbf24' }, // Central highest peak
      { x: 28,  y: -26, angle: 0.18,  length: 44, color: '#f59e0b' },
      { x: 54,  y: -8,  angle: 0.35,  length: 34, color: '#f59e0b' }
    ];

    // Initial state: arrows start far away from different angles
    const arrows = crownPeaks.map((peak, idx) => {
      const spawnAngle = (idx - 2) * 0.7 - Math.PI / 2;
      const spawnDist = 280 + idx * 30;
      return {
        ...peak,
        currentX: Math.cos(spawnAngle) * spawnDist,
        currentY: Math.sin(spawnAngle) * spawnDist,
        progress: 0,
        delay: idx * 0.12,
        locked: false
      };
    });

    // Shimmer particles emitted upon crown lock
    const particles = [];
    let hasEmittedSparks = false;
    let animTime = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.26; // Crown center anchor

      animTime += 0.016;

      // Draw subtle background dot grid
      ctx.fillStyle = '#334155';
      const gridSize = 28;
      const startX = cx - 140;
      const startY = cy - 90;
      for (let x = startX; x <= startX + 280; x += gridSize) {
        for (let y = startY; y <= startY + 160; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Idle crown gentle hovering after locked
      const hoverY = Math.sin(animTime * 2.2) * 4;

      // Draw Crown Base Arc
      const baseAlpha = Math.min(1, Math.max(0, (animTime - 0.8) * 2));
      if (baseAlpha > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(245, 158, 11, ${baseAlpha * 0.85})`;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Slightly curved crown base
        ctx.moveTo(cx - 62, cy + 18 + hoverY);
        ctx.quadraticCurveTo(cx, cy + 24 + hoverY, cx + 62, cy + 18 + hoverY);
        ctx.stroke();

        // 3 Base Jewels
        ctx.fillStyle = `rgba(56, 189, 248, ${baseAlpha})`;
        for (const jx of [-36, 0, 36]) {
          ctx.beginPath();
          ctx.arc(cx + jx, cy + 21 + hoverY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      let allLocked = true;

      // Animate and draw each crown arrow
      for (let i = 0; i < arrows.length; i++) {
        const a = arrows[i];
        if (animTime > a.delay) {
          a.progress = Math.min(1, a.progress + 0.035);
        } else {
          allLocked = false;
        }

        // Cubic ease out
        const ease = 1 - Math.pow(1 - a.progress, 3);

        const targetX = a.x;
        const targetY = a.y + hoverY;

        const curX = cx + a.currentX * (1 - ease) + targetX * ease;
        const curY = cy + a.currentY * (1 - ease) + targetY * ease;
        const curAngle = a.angle * ease + (1 - ease) * (a.angle - 0.8);

        if (a.progress < 1) allLocked = false;

        // Render arrow body
        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(curAngle);

        ctx.strokeStyle = a.color;
        ctx.fillStyle = a.color;
        ctx.lineWidth = i === 2 ? 4.5 : 3.8; // Central arrow is thicker
        ctx.lineCap = 'round';

        // Stem
        ctx.beginPath();
        ctx.moveTo(0, a.length / 2);
        ctx.lineTo(0, -a.length / 2);
        ctx.stroke();

        // Sharp Royal Arrowhead
        const headSize = i === 2 ? 14 : 11;
        ctx.beginPath();
        ctx.moveTo(0, -a.length / 2 - 4);
        ctx.lineTo(-headSize * 0.65, -a.length / 2 + headSize * 0.7);
        ctx.lineTo(0, -a.length / 2 + headSize * 0.35);
        ctx.lineTo(headSize * 0.65, -a.length / 2 + headSize * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Trigger sparkle burst once crown locks
      if (allLocked && !hasEmittedSparks) {
        hasEmittedSparks = true;
        for (let i = 0; i < 28; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 3.5;
          particles.push({
            x: cx + (Math.random() - 0.5) * 80,
            y: cy + (Math.random() - 0.5) * 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.8,
            life: 1.0,
            color: Math.random() > 0.4 ? '#f59e0b' : '#38bdf8',
            size: 2 + Math.random() * 2.5
          });
        }
      }

      // Draw and update sparkle particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life -= 0.02;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      this.animFrame = requestAnimationFrame(animate);
    };

    this.animFrame = requestAnimationFrame(animate);
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }
}
