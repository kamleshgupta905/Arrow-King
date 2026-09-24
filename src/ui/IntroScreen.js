/**
 * IntroScreen.js
 * Opening court: gold header, orbiting emblem, earned rank, and a live score visualizer.
 */

import { soundManager } from '../audio/SoundManager.js';
const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>`;

export class IntroScreen {
  constructor(container, onPlayCallback, onLevelSelectCallback, onSettingsCallback) {
    this.container = container;
    this.onPlay = onPlayCallback;
    this.onLevelSelect = onLevelSelectCallback;
    this.onSettings = onSettingsCallback;
    this.animFrame = null;
    this.soundMuted = soundManager.isMuted();
    this.stats = {
      stars: 0,
      streak: 1,
      courts: 0,
      rank: { name: 'Squire', tier: 'I', title: 'RISING' }
    };

    this.render();
  }

  setStats(stats) {
    if (stats) this.stats = stats;
    const rank = this.container.querySelector('#prestige-rank');
    const streak = this.container.querySelector('#prestige-streak');
    const courts = this.container.querySelector('#prestige-courts');
    const chip = this.container.querySelector('#header-rank-name');
    const chipTier = this.container.querySelector('#header-rank-tier');
    if (rank) rank.textContent = this.stats.rank?.name || 'Squire';
    if (streak) streak.textContent = String(this.stats.streak || 1);
    if (courts) courts.textContent = String(this.stats.courts || 0);
    if (chip) chip.textContent = (this.stats.rank?.name || 'Squire').toUpperCase();
    if (chipTier) chipTier.textContent = `TIER ${this.stats.rank?.tier || 'I'}`;
  }

  render() {
    const rank = this.stats.rank || { name: 'Squire', tier: 'I' };
    this.container.innerHTML = `
      <div class="intro-screen royal-theme premiere">
        <canvas id="intro-particles-canvas" class="intro-bg-canvas"></canvas>
        <div class="premiere-aurora"></div>
        <div class="premiere-grain"></div>

        <header class="intro-top-header">
          <div class="header-brand">
            <div class="brand-mark">
              <img src="/icon-512.png" alt="" />
            </div>
            <div class="brand-lockup">
              <span class="brand-kicker">PUZZLE</span>
              <div class="brand-title">
                <span class="brand-arrow">Arrow</span>
                <span class="brand-king">King</span>
              </div>
            </div>
          </div>

          <div class="header-controls">
            <div class="rank-chip" title="Royal rank">
              <strong id="header-rank-name">${rank.name.toUpperCase()}</strong>
              <span id="header-rank-tier">TIER ${rank.tier}</span>
            </div>
            <button id="btn-top-sound" class="apple-control-btn" title="Toggle sound" aria-label="Toggle sound">
              <div class="control-btn-glow"></div>
              <svg class="sound-icon-on" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="${this.soundMuted ? 'display:none;' : 'display:block;'}">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <svg class="sound-icon-off" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="${this.soundMuted ? 'display:block;' : 'display:none;'}">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            </button>
            <button id="btn-top-settings" class="apple-control-btn btn-settings-control" title="Settings" aria-label="Settings">
              <div class="control-btn-glow"></div>
              <svg class="apple-gear-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3.2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </header>

        <main class="intro-main-body">
          <div class="hero-emblem-wrapper rise d1">
            <div class="orbit orbit-a"></div>
            <div class="orbit orbit-b"></div>
            <span class="orbit-arrow a1">${ARROW}</span>
            <span class="orbit-arrow a2">${ARROW}</span>
            <span class="orbit-arrow a3">${ARROW}</span>
            <div class="hero-disc-halo"></div>
            <div class="hero-disc-container">
              <img src="/icon-512.png" alt="Arrow King" class="hero-app-icon-img" />
              <div class="emblem-sheen"></div>
            </div>
          </div>

          <div class="intro-titles-block rise d2">
            <h1 class="hero-game-title">
              <span class="title-arrow">Arrow</span>
              <span class="title-king">King</span>
            </h1>
            <div class="gold-rule"></div>
            <p class="hero-game-subtitle">Tap the free arrow.<br>Clear the shape.</p>
          </div>

          <div class="jewel-row rise d3">
            <div class="jewel">
              <b id="prestige-rank">${rank.name}</b>
              <span>RANK</span>
            </div>
            <div class="jewel">
              <b id="prestige-streak">${this.stats.streak || 1}</b>
              <span>DAY STREAK</span>
            </div>
            <div class="jewel">
              <b id="prestige-courts">${this.stats.courts || 0}</b>
              <span>CLEARED</span>
            </div>
          </div>

          <div class="intro-actions-group rise d4">
            <button id="btn-intro-play" class="btn-hero-primary" aria-label="Enter the court">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <polygon points="7 4 20 12 7 20 7 4"/>
              </svg>
              <span>PLAY</span>
            </button>
            <button id="btn-intro-levels" class="btn-hero-secondary" aria-label="Select mode">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7h16M4 12h10M4 17h7"/>
              </svg>
              <span>SELECT MODE</span>
              <svg class="action-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div class="court-footer rise d5">
            <div class="viz-row" id="intro-viz" aria-hidden="true">
              ${Array.from({ length: 18 }, () => '<span></span>').join('')}
            </div>
            <div class="court-listening" id="court-listening">${this.soundMuted ? 'MUSIC SILENCED' : 'ROYAL COURT SCORE'}</div>
          </div>
        </main>

        <div class="intro-bottom-scenery" aria-hidden="true">
          <svg class="scenery-svg" viewBox="0 0 420 120" preserveAspectRatio="none">
            <path d="M285 120 L360 28 L450 120 Z" fill="#14101f"/>
            <line x1="360" y1="28" x2="360" y2="12" stroke="#c6a15a" stroke-width="1.4"/>
            <polygon points="360,14 378,20 360,26" fill="#f0d78c"/>
            <path d="M-20 120 Q90 70 210 96 Q320 62 450 120 Z" fill="#100e18"/>
            <path d="M0 120 Q200 88 420 120 Z" fill="#07080e"/>
          </svg>
          <div class="bottom-home-indicator"></div>
        </div>
      </div>
    `;

    this.initCanvasEffects();
    this.initMotionPhysics();
    this.bindEvents();
  }

  initMotionPhysics() {
    const emblem = this.container.querySelector('.hero-disc-container');
    if (!emblem) return;

    let targetRotX = 0;
    let targetRotY = 0;
    let currRotX = 0;
    let currRotY = 0;

    this.container.addEventListener('pointermove', (e) => {
      const rect = emblem.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
      targetRotY = Math.max(-12, Math.min(12, dx * 12));
      targetRotX = Math.max(-10, Math.min(10, -dy * 10));
    }, { passive: true });

    this.container.addEventListener('pointerleave', () => {
      targetRotX = 0;
      targetRotY = 0;
    }, { passive: true });

    const loop = () => {
      currRotX += (targetRotX - currRotX) * 0.08;
      currRotY += (targetRotY - currRotY) * 0.08;
      emblem.style.transform = `perspective(900px) rotateX(${currRotX.toFixed(2)}deg) rotateY(${currRotY.toFixed(2)}deg)`;
      if (this.container.style.display !== 'none') requestAnimationFrame(loop);
    };
    this.tiltLoop = loop;
    requestAnimationFrame(loop);
  }

  bindEvents() {
    this.container.querySelector('#btn-intro-play')?.addEventListener('click', () => {
      try { if (navigator.vibrate) navigator.vibrate([16]); } catch (_) {}
      soundManager.playTap();
      soundManager.initContext();
      soundManager.setMusicMode('game');
      soundManager.startMusic();
      this.hide();
      if (this.onPlay) this.onPlay();
    });

    this.container.querySelector('#btn-intro-levels')?.addEventListener('click', () => {
      try { if (navigator.vibrate) navigator.vibrate([12]); } catch (_) {}
      soundManager.playTap();
      soundManager.initContext();
      soundManager.startMenuMusic();
      this.hide();
      if (this.onLevelSelect) this.onLevelSelect();
    });

    this.container.querySelector('#btn-top-sound')?.addEventListener('click', () => {
      try { if (navigator.vibrate) navigator.vibrate(10); } catch (_) {}
      this.soundMuted = soundManager.toggleMute();
      this.updateSoundIcons();
      if (!this.soundMuted) soundManager.startMenuMusic();
    });

    this.container.querySelector('#btn-top-settings')?.addEventListener('click', () => {
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (_) {}
      soundManager.playTap();
      soundManager.initContext();
      if (this.onSettings) this.onSettings();
    });
  }

  updateSoundIcons() {
    this.container.querySelectorAll('.sound-icon-on').forEach((icon) => {
      icon.style.display = this.soundMuted ? 'none' : 'block';
    });
    this.container.querySelectorAll('.sound-icon-off').forEach((icon) => {
      icon.style.display = this.soundMuted ? 'block' : 'none';
    });
    const label = this.container.querySelector('#court-listening');
    if (label) label.textContent = this.soundMuted ? 'MUSIC SILENCED' : 'ROYAL COURT SCORE';
  }

  initCanvasEffects() {
    const canvas = this.container.querySelector('#intro-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    const bars = () => Array.from(this.container.querySelectorAll('#intro-viz span'));

    const resize = () => {
      canvas.width = host.clientWidth || window.innerWidth;
      canvas.height = host.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const dust = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.75,
      r: 0.6 + Math.random() * 1.6,
      s: 0.08 + Math.random() * 0.22,
      gold: Math.random() > 0.45
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of dust) {
        p.y -= p.s * 0.0018;
        if (p.y < 0) p.y = 0.78;
        const alpha = 0.15 + (Math.sin(Date.now() * 0.002 + p.x * 12) + 1) * 0.18;
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? `rgba(240, 215, 140, ${alpha})` : `rgba(192, 132, 252, ${alpha * 0.7})`;
        ctx.fill();
      }

      const levels = soundManager.getLevels(18);
      bars().forEach((bar, i) => {
        const idle = 0.18 + Math.abs(Math.sin(Date.now() / 520 + i * 0.45)) * 0.28;
        const level = levels ? Math.max(idle * 0.35, levels[i]) : idle;
        bar.style.height = `${Math.max(3, Math.round(level * 22))}px`;
      });

      this.animFrame = requestAnimationFrame(animate);
    };

    this.animateLoop = animate;
  }

  show() {
    this.soundMuted = soundManager.isMuted();
    this.updateSoundIcons();
    this.container.style.display = 'block';
    const screen = this.container.querySelector('.intro-screen');
    screen?.classList.remove('is-entering');
    if (screen) void screen.offsetWidth;
    screen?.classList.add('is-entering');

    if (!this.animFrame && this.animateLoop) {
      this.animFrame = requestAnimationFrame(this.animateLoop);
    }
    if (this.tiltLoop) requestAnimationFrame(this.tiltLoop);
  }

  hide() {
    this.container.style.display = 'none';
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }
}
