/**
 * ComplexitySelect.js
 * Apple-grade Luxury Glassmorphic Difficulty Selection Screen.
 * Features:
 * - Cupertino-inspired liquid frosted glass with specular reflections & neon ambient glow.
 * - Custom handcrafted vector SVG icons (zero childish emojis).
 * - Tactile spring interactions & mobile haptic vibration feedback.
 * - Elegant status pill badges, star trackers, and progressive unlocks.
 */

import { CATEGORIES } from '../levels/ShapeGenerator.js';
import { soundManager } from '../audio/SoundManager.js';

export class ComplexitySelect {
  constructor(container, onSelectCategoryCallback, onBackCallback) {
    this.container = container;
    this.onSelectCategory = onSelectCategoryCallback;
    this.onBack = onBackCallback;
    this.progressData = {};
  }

  show(progressData) {
    this.progressData = progressData || {};
    this.render();
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }

  calculateTotalStars(starsMap) {
    return Object.values(starsMap || {}).reduce((sum, s) => sum + (typeof s === 'number' ? s : 0), 0);
  }

  calculateCategoryStars(starsMap, catId) {
    let sum = 0;
    const prefix = `${catId}_`;
    for (const [key, val] of Object.entries(starsMap || {})) {
      if (key.startsWith(prefix) && typeof val === 'number') {
        sum += val;
      }
    }
    return sum;
  }

  getCategoryLockInfo(catId, totalStars) {
    if (catId === 'intermediate' && totalStars < 15) {
      return { isLocked: true, requiredStars: 15, label: '15★' };
    }
    if (catId === 'advanced' && totalStars < 20) {
      return { isLocked: true, requiredStars: 20, label: '20★' };
    }
    if (catId === 'expert' && totalStars < 30) {
      return { isLocked: true, requiredStars: 30, label: '30★' };
    }
    if (catId === 'master' && totalStars < 45) {
      return { isLocked: true, requiredStars: 45, label: '45★' };
    }
    if (catId === 'hacker' && totalStars < 60) {
      return { isLocked: true, requiredStars: 60, label: '60★' };
    }
    return { isLocked: false, requiredStars: 0, label: '' };
  }

  render() {
    const starsMap = this.progressData.stars || {};
    const unlockedMap = this.progressData.unlocked || {};
    const totalStars = this.calculateTotalStars(starsMap);
    const maxStars = CATEGORIES.reduce((sum, c) => sum + (c.levelsCount || 30) * 3, 0);

    const categoryMeta = {
      beginner: {
        num: '01',
        tag: 'CASUAL FLOW',
        tagline: 'Gentle starter labyrinths & serene vector puzzles',
        accent: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        glow: 'rgba(16, 185, 129, 0.45)',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.35"/>
            <path d="M12 6v6l4 2"/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
        `
      },
      intermediate: {
        num: '02',
        tag: 'BALANCED BENDS',
        tagline: 'Intersecting curves, tricky turns & branching pathways',
        accent: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        glow: 'rgba(245, 158, 11, 0.45)',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 18V9a3 3 0 0 1 3-3h13"/>
            <polyline points="16 2 20 6 16 10"/>
            <path d="M20 6v9a3 3 0 0 1-3 3H4"/>
            <polyline points="8 22 4 18 8 14"/>
          </svg>
        `
      },
      advanced: {
        num: '03',
        tag: 'MEGA LABYRINTH',
        tagline: 'High-density vector mazes • 800+ arrow sequences',
        accent: '#f97316',
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        glow: 'rgba(249, 115, 22, 0.45)',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        `
      },
      expert: {
        num: '04',
        tag: 'HARDCORE LOGIC',
        tagline: 'Master complex topological mazes & precision escapes',
        accent: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        glow: 'rgba(239, 68, 68, 0.45)',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
            <line x1="2" y1="9" x2="22" y2="9"/>
            <line x1="12" y1="21" x2="7.5" y2="9"/>
            <line x1="12" y1="21" x2="16.5" y2="9"/>
          </svg>
        `
      },
      master: {
        num: '05',
        tag: 'GRANDMASTER',
        tagline: 'The ultimate royal vector conquest for true puzzle elites',
        accent: '#a855f7',
        gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
        glow: 'rgba(168, 85, 247, 0.55)',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 19h20v2H2z"/>
            <path d="m2 17 3-11 5 6 4-9 4 9 5-6 3 11z"/>
            <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="19" cy="5" r="1.5" fill="currentColor"/>
          </svg>
        `
      },
      hacker: {
        num: '06',
        tag: 'SPEEDRUN BLITZ',
        tagline: 'Adrenaline rush • 850 arrows with strict countdown timer',
        accent: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #ec4899 100%)',
        glow: 'rgba(6, 182, 212, 0.55)',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        `
      }
    };

    this.container.innerHTML = `
      <div class="apple-complexity-screen">
        <!-- Ambient Liquid Glow Backdrop -->
        <div class="apple-screen-glow"></div>

        <!-- Sleek iOS Navigation Header -->
        <header class="apple-nav-header">
          <button id="btn-complexity-back" class="apple-back-btn" aria-label="Back to Home">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="apple-header-title-wrap">
            <span class="apple-header-eyebrow">MISSION SELECT</span>
            <h1 class="apple-header-title">CHOOSE DIFFICULTY</h1>
          </div>

          <div class="apple-stars-pill">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span class="apple-stars-text"><strong>${totalStars}</strong> / ${maxStars}</span>
          </div>
        </header>

        <!-- Complexity Cards Scrollable List -->
        <main class="apple-cards-viewport">
          <div class="apple-cards-container">
            ${CATEGORIES.map((cat, idx) => {
              const meta = categoryMeta[cat.id] || categoryMeta.beginner;
              const lockInfo = this.getCategoryLockInfo(cat.id, totalStars);
              const totalLevels = cat.levelsCount || 30;
              const currentUnlocked = lockInfo.isLocked ? 0 : Math.min(totalLevels, unlockedMap[cat.id] || 1);
              const catStars = this.calculateCategoryStars(starsMap, cat.id);
              const catMaxStars = totalLevels * 3;
              const progressPercent = lockInfo.isLocked ? 0 : Math.min(100, Math.round(((currentUnlocked - 1) / totalLevels) * 100));

              return `
                <div class="apple-glass-card ${lockInfo.isLocked ? 'is-locked' : 'is-unlocked'} ${cat.id === 'hacker' ? 'card-hacker-style' : ''}"
                     data-cat="${cat.id}"
                     style="--card-accent: ${meta.accent}; --card-glow: ${meta.glow}; --card-idx: ${idx};">

                  <!-- Card Specular Highlight Edge -->
                  <div class="apple-card-specular"></div>

                  <div class="apple-card-main-content">
                    <!-- Top Info Row: Icon Jewel + Title Stack + Badge -->
                    <div class="apple-card-row-top">
                      <div class="apple-card-lead">
                        <div class="apple-icon-jewel" style="background: ${meta.gradient}; box-shadow: 0 4px 18px ${meta.glow};">
                          ${meta.svgIcon}
                        </div>

                        <div class="apple-title-stack">
                          <div class="apple-mode-meta-row">
                            <span class="apple-mode-index">${meta.num}</span>
                            <span class="apple-mode-dot">•</span>
                            <span class="apple-mode-subtag">${meta.tag}</span>
                          </div>
                          <h2 class="apple-mode-heading">${cat.name.toUpperCase()}</h2>
                        </div>
                      </div>

                      ${lockInfo.isLocked ? `
                        <div class="apple-lock-badge">
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <span>${lockInfo.requiredStars}★</span>
                        </div>
                      ` : `
                        <div class="apple-count-badge">
                          <span>${totalLevels} LEVELS</span>
                        </div>
                      `}
                    </div>

                    <!-- Tagline Description -->
                    <p class="apple-card-tagline">${meta.tagline}</p>

                    <!-- Progress Section with Slim Track -->
                    <div class="apple-card-progress-box">
                      <div class="apple-prog-labels">
                        <span class="apple-prog-status">
                          ${lockInfo.isLocked
                            ? `<span class="apple-status-locked-text">Locked • Collect ${lockInfo.requiredStars - totalStars} more stars</span>`
                            : `Unlocked: <strong>${currentUnlocked}</strong> of ${totalLevels}`
                          }
                        </span>
                        <span class="apple-prog-stars">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="#fbbf24" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          ${catStars}/${catMaxStars}
                        </span>
                      </div>

                      <div class="apple-progress-track">
                        <div class="apple-progress-bar" style="width: ${progressPercent}%; background: ${meta.gradient};">
                          <div class="apple-progress-glow-tip"></div>
                        </div>
                      </div>
                    </div>

                    <!-- Action Bar -->
                    <div class="apple-action-bar">
                      ${lockInfo.isLocked ? `
                        <div class="apple-locked-action">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          <span>Requires ${lockInfo.requiredStars} Total Stars</span>
                        </div>
                      ` : `
                        <button class="apple-play-btn" style="--btn-color: ${meta.accent};">
                          <span>PLAY ${cat.name.toUpperCase()}</span>
                          <div class="apple-btn-arrow-circle">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </div>
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </main>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const backBtn = this.container.querySelector('#btn-complexity-back');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (navigator.vibrate) navigator.vibrate(10);
        } catch (_) {}
        soundManager.playTap();
        this.hide();
        if (this.onBack) this.onBack();
      });
    }

    const cards = this.container.querySelectorAll('.apple-glass-card.is-unlocked');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const catId = card.dataset.cat;
        try {
          if (navigator.vibrate) navigator.vibrate([15]);
        } catch (_) {}
        soundManager.playTap();
        this.hide();
        if (this.onSelectCategory) {
          this.onSelectCategory(catId);
        }
      });
    });
  }
}
