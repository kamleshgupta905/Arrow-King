/**
 * IntroScreen.js - Arrow King
 * Faithful recreation of the luxurious royal neon-violet home screen:
 * - Top bar with Crown icon + "Arrow King" branding and sound/settings controls
 * - Hero glowing disc with the iconic 5-Arrow Royal Crown emblem & diamond jewel facet
 * - "ARROW KING" typography with "Master the sequence. Clear the board. Claim the crown."
 * - 3-column stats capsule: Vector Puzzle (Mode), 0 Collisions (Best), Hacker Mode (Special)
 * - Neon purple "PLAY GAME" button and frosted glass "LEVEL SELECT" button
 * - Footer with sound toggle and v1.0.0 • Offline Ready
 * - Atmospheric vector scenery with mountain peak, flagpole, pines, and layered hills
 */

import { soundManager } from '../audio/SoundManager.js';

export class IntroScreen {
  constructor(container, onPlayCallback, onLevelSelectCallback, onSettingsCallback) {
    this.container = container;
    this.onPlay = onPlayCallback;
    this.onLevelSelect = onLevelSelectCallback;
    this.onSettings = onSettingsCallback;
    this.animFrame = null;
    this.soundMuted = soundManager.isMuted();

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="intro-screen royal-theme">
        <!-- Background Ambient Sparkle Canvas -->
        <canvas id="intro-particles-canvas" class="intro-bg-canvas"></canvas>

        <!-- Top Header Navigation Bar -->
        <header class="intro-top-header">
          <div class="header-brand">
            <svg class="brand-crown-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M2 19h20v2H2zM3 7l4 6 5-8 5 8 4-6v10H3z"/>
            </svg>
            <div class="brand-title">
              <span class="brand-arrow">Arrow</span>
              <span class="brand-king">King</span>
            </div>
          </div>

          <div class="header-controls">
            <button id="btn-top-sound" class="header-icon-btn" title="Toggle Sound" aria-label="Toggle Sound">
              <svg class="sound-icon-on" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" style="${this.soundMuted ? 'display:none;' : 'display:block;'}">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <svg class="sound-icon-off" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" style="${this.soundMuted ? 'display:block;' : 'display:none;'}">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            </button>

            <button id="btn-top-settings" class="header-icon-btn" title="Settings" aria-label="Settings">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Main Center Content -->
        <main class="intro-main-body">
          <!-- The Glowing Crown Emblem Badge -->
          <div class="hero-emblem-wrapper">
            <div class="hero-disc-halo"></div>
            <div class="hero-disc-container">
              <img src="/icon-512.png" alt="Arrow King" class="hero-app-icon-img" />
            </div>
          </div>

          <!-- Hero Titles -->
          <div class="intro-titles-block">
            <h1 class="hero-game-title">
              <span class="title-arrow">ARROW</span>
              <span class="title-king">KING</span>
            </h1>
            <p class="hero-game-subtitle">Master the sequence. Clear the board.<br>Claim the crown.</p>
          </div>

          <!-- 3-Segment Capsule Strip -->
          <div class="features-capsule-strip">
            <div class="capsule-segment">
              <div class="capsule-icon icon-violet">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="12" r="9"/>
                  <circle cx="12" cy="12" r="5"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                </svg>
              </div>
              <div class="capsule-info">
                <span class="info-primary">Vector Puzzle</span>
                <span class="info-secondary">Mode</span>
              </div>
            </div>

            <div class="capsule-separator"></div>

            <div class="capsule-segment">
              <div class="capsule-icon icon-coral">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
                </svg>
              </div>
              <div class="capsule-info">
                <span class="info-primary">0 Collisions</span>
                <span class="info-secondary">Best</span>
              </div>
            </div>

            <div class="capsule-separator"></div>

            <div class="capsule-segment">
              <div class="capsule-icon icon-magenta">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div class="capsule-info">
                <span class="info-primary">Hacker Mode</span>
                <span class="info-secondary">Special</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons Group -->
          <div class="intro-actions-group">
            <button id="btn-intro-play" class="btn-hero-primary" aria-label="Play Game">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <polygon points="7 4 20 12 7 20 7 4"/>
              </svg>
              <span>PLAY GAME</span>
            </button>

            <button id="btn-intro-levels" class="btn-hero-secondary" aria-label="Choose Difficulty">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              </svg>
              <span>CHOOSE DIFFICULTY</span>
              <svg class="action-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <!-- Bottom Sound & Offline Ready Bar -->
          <div class="intro-footer-bar">
            <button id="btn-footer-sound" class="footer-sound-btn" title="Toggle Sound">
              <svg class="sound-icon-on" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="${this.soundMuted ? 'display:none;' : 'display:block;'}">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <svg class="sound-icon-off" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="${this.soundMuted ? 'display:block;' : 'display:none;'}">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            </button>
            <span class="footer-divider">|</span>
            <span class="footer-version-tag">v1.0.0 • Offline Ready</span>
          </div>
        </main>

        <!-- Mountain & Pine Tree Scenery Silhouettes at Bottom -->
        <div class="intro-bottom-scenery">
          <svg class="scenery-svg" viewBox="0 0 420 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sceneryAtmosphere" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="transparent"/>
                <stop offset="50%" stop-color="rgba(168, 85, 247, 0.08)"/>
                <stop offset="100%" stop-color="rgba(147, 51, 234, 0.18)"/>
              </linearGradient>
            </defs>

            <!-- Atmospheric Ambient Glow -->
            <rect x="0" y="0" width="420" height="160" fill="url(#sceneryAtmosphere)"/>

            <!-- Mountain Peak on Right with Flagpole -->
            <path d="M 285 160 L 366 52 L 435 160 Z" fill="#1d163a"/>
            <!-- Summit Flagpole & Flag -->
            <line x1="366" y1="52" x2="366" y2="34" stroke="#7e6c9e" stroke-width="1.6"/>
            <polygon points="366,36 382,43 366,50" fill="#c084fc"/>

            <!-- Mid Layer Mountain Slope & Hills -->
            <path d="M -20 160 Q 80 95 210 130 Q 305 92 440 160 Z" fill="#16112e"/>

            <!-- Silhouette Pine Trees on Ridges -->
            <polygon points="76,114 69,132 83,132" fill="#110d24"/>
            <polygon points="88,110 81,130 95,130" fill="#110d24"/>
            <polygon points="100,116 94,132 106,132" fill="#110d24"/>
            
            <polygon points="314,104 306,126 322,126" fill="#110d24"/>
            <polygon points="328,108 321,128 335,128" fill="#110d24"/>
            <polygon points="385,110 378,130 392,130" fill="#110d24"/>

            <!-- Foreground Rolling Ground Layers -->
            <path d="M -30 160 Q 150 115 450 160 Z" fill="#0d0a1b"/>
            <path d="M 0 160 Q 210 134 420 160 Z" fill="#070612"/>
          </svg>
          <div class="bottom-home-indicator"></div>
        </div>
      </div>
    `;

    this.initCanvasEffects();
    this.bindEvents();
  }

  bindEvents() {
    const playBtn = this.container.querySelector('#btn-intro-play');
    const levelsBtn = this.container.querySelector('#btn-intro-levels');
    const topSoundBtn = this.container.querySelector('#btn-top-sound');
    const footerSoundBtn = this.container.querySelector('#btn-footer-sound');
    const settingsBtn = this.container.querySelector('#btn-top-settings');

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
      this.hide();
      if (this.onLevelSelect) this.onLevelSelect();
    });

    const handleSoundToggle = () => {
      this.soundMuted = soundManager.toggleMute();
      this.updateSoundIcons();
    };

    topSoundBtn?.addEventListener('click', handleSoundToggle);
    footerSoundBtn?.addEventListener('click', handleSoundToggle);

    settingsBtn?.addEventListener('click', () => {
      soundManager.playTap();
      if (this.onSettings) this.onSettings();
    });
  }

  updateSoundIcons() {
    const onIcons = this.container.querySelectorAll('.sound-icon-on');
    const offIcons = this.container.querySelectorAll('.sound-icon-off');
    onIcons.forEach(icon => {
      icon.style.display = this.soundMuted ? 'none' : 'block';
    });
    offIcons.forEach(icon => {
      icon.style.display = this.soundMuted ? 'block' : 'none';
    });
  }

  initCanvasEffects() {
    const canvas = this.container.querySelector('#intro-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Subtle drifting stars/particles in the night sky
    const particles = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.7,
        radius: 0.8 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.6,
        speed: 0.15 + Math.random() * 0.35,
        pulseSpeed: 0.02 + Math.random() * 0.03
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.alpha += Math.sin(Date.now() * 0.002 * p.pulseSpeed) * 0.008;
        p.y -= p.speed * 0.25;

        if (p.y < 0) {
          p.y = canvas.height * 0.7;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 132, 252, ${Math.max(0.1, Math.min(0.85, p.alpha))})`;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      this.animFrame = requestAnimationFrame(this.animateLoop);
    };

    this.animateLoop = animate;
  }

  show() {
    this.soundMuted = soundManager.isMuted();
    this.updateSoundIcons();
    this.container.style.display = 'block';

    if (!this.animFrame && this.animateLoop) {
      this.animFrame = requestAnimationFrame(this.animateLoop);
    }
  }

  hide() {
    this.container.style.display = 'none';
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }
}
