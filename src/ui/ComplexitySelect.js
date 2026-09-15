/**
 * ComplexitySelect.js
 * Dedicated Difficulty / Complexity Selection Screen.
 * Matches the royal midnight home screen aesthetics:
 * - Deep midnight violet gradient, ambient glowing cards, glassmorphism.
 * - Shows all 6 complexity modes with arrow counts, progress bars, star counts, and locks.
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
    if (catId === 'expert' && totalStars < 25) {
      return { isLocked: true, requiredStars: 25, label: '25★' };
    }
    if (catId === 'master' && totalStars < 45) {
      return { isLocked: true, requiredStars: 45, label: '45★' };
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
        icon: '🟢',
        tag: 'CASUAL',
        tagline: 'Gentle starter puzzles • 100 Handcrafted Levels',
        glowColor: '#10b981',
        borderGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.45), rgba(5, 150, 105, 0.15))'
      },
      intermediate: {
        icon: '🟡',
        tag: 'BALANCED',
        tagline: 'Tricky bends & crossings • 20-30 Arrows',
        glowColor: '#f59e0b',
        borderGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.45), rgba(217, 119, 6, 0.15))'
      },
      advanced: {
        icon: '🟠',
        tag: 'CHALLENGING',
        tagline: 'Dense interlocking labyrinths • 28-40 Arrows',
        glowColor: '#f97316',
        borderGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.45), rgba(194, 65, 12, 0.15))'
      },
      expert: {
        icon: '🔴',
        tag: 'HARDCORE',
        tagline: 'Master topological mazes • 35-48 Arrows',
        glowColor: '#ef4444',
        borderGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.45), rgba(185, 28, 28, 0.15))'
      },
      master: {
        icon: '🟣',
        tag: 'GRANDMASTER',
        tagline: 'The ultimate vector conquest • 45-60 Arrows',
        glowColor: '#a855f7',
        borderGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.55), rgba(126, 34, 206, 0.2))'
      },
      hacker: {
        icon: '⚡',
        tag: 'SPEEDRUN',
        tagline: '60s Countdown Blitz • Fast-paced escape!',
        glowColor: '#06b6d4',
        borderGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.55), rgba(236, 72, 153, 0.3))'
      }
    };

    this.container.innerHTML = `
      <div class="complexity-screen royal-theme">
        <!-- Top Header Navigation -->
        <header class="complexity-header">
          <button id="btn-complexity-back" class="icon-btn-royal" aria-label="Back to Home">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="header-center-royal">
            <h2 class="complexity-title">CHOOSE DIFFICULTY</h2>
            <div class="complexity-stars-badge">
              <span class="star-gold">★</span>
              <span>${totalStars} / ${maxStars} Stars</span>
            </div>
          </div>

          <div style="width: 42px;"></div>
        </header>

        <!-- Complexity Cards Scrollable List -->
        <main class="complexity-cards-list">
          ${CATEGORIES.map(cat => {
            const meta = categoryMeta[cat.id] || categoryMeta.beginner;
            const lockInfo = this.getCategoryLockInfo(cat.id, totalStars);
            const totalLevels = cat.levelsCount || 30;
            const currentUnlocked = lockInfo.isLocked ? 0 : Math.min(totalLevels, unlockedMap[cat.id] || 1);
            const catStars = this.calculateCategoryStars(starsMap, cat.id);
            const catMaxStars = totalLevels * 3;
            const progressPercent = lockInfo.isLocked ? 0 : Math.min(100, Math.round(((currentUnlocked - 1) / totalLevels) * 100));

            return `
              <div class="complexity-card ${lockInfo.isLocked ? 'is-locked' : 'is-unlocked'} ${cat.id === 'hacker' ? 'card-hacker' : ''}"
                   data-cat="${cat.id}">
                <div class="card-glow-strip" style="background: ${meta.glowColor};"></div>

                <div class="card-body-content">
                  <!-- Header row: Icon, Category Name, Tag -->
                  <div class="card-top-row">
                    <div class="card-badge-left">
                      <span class="cat-icon-symbol">${meta.icon}</span>
                      <div class="cat-title-stack">
                        <span class="cat-name">${cat.name.toUpperCase()}</span>
                        <span class="cat-subtag">${meta.tag}</span>
                      </div>
                    </div>

                    ${lockInfo.isLocked ? `
                      <span class="lock-pill-badge">
                        <span>🔒 Need ${lockInfo.requiredStars}★</span>
                      </span>
                    ` : `
                      <span class="levels-pill-badge">${totalLevels} Levels</span>
                    `}
                  </div>

                  <!-- Tagline description -->
                  <p class="card-tagline">${meta.tagline}</p>

                  <!-- Progress Bar & Star counts -->
                  <div class="card-progress-section">
                    <div class="progress-info-row">
                      <span class="prog-label">${lockInfo.isLocked ? 'Locked' : `Unlocked: ${currentUnlocked}/${totalLevels}`}</span>
                      <span class="prog-stars"><span class="star-gold">★</span> ${catStars}/${catMaxStars}</span>
                    </div>
                    <div class="prog-track">
                      <div class="prog-fill" style="width: ${progressPercent}%; background: ${meta.glowColor};"></div>
                    </div>
                  </div>

                  <!-- Action button or Lock CTA -->
                  <div class="card-action-row">
                    ${lockInfo.isLocked ? `
                      <div class="locked-cta-banner">
                        <span>🔒 Collect ${lockInfo.requiredStars - totalStars} more stars to unlock</span>
                      </div>
                    ` : `
                      <button class="btn-select-complexity" style="--accent-glow: ${meta.glowColor};">
                        <span>SELECT ${cat.name.toUpperCase()}</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
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
        soundManager.playTap();
        this.hide();
        if (this.onBack) this.onBack();
      });
    }

    const cards = this.container.querySelectorAll('.complexity-card.is-unlocked');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const catId = card.dataset.cat;
        soundManager.playTap();
        this.hide();
        if (this.onSelectCategory) {
          this.onSelectCategory(catId);
        }
      });
    });
  }
}
