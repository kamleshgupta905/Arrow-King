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
        bars: 1,
        tag: 'CASUAL FLOW',
        tagline: 'Short paths. Learn which arrow can leave.',
        accent: '#16A34A',
        gradient: '#16A34A',
        glow: 'transparent',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21V10"/>
            <path d="M12 10c0-3 2-5 5-5-1 3-1 5-1 5"/>
            <path d="M12 13c0-2.5-2-4.5-5-5 1 3 1 5 1 5"/>
          </svg>
        `
      },
      intermediate: {
        num: '02',
        bars: 2,
        tag: 'BALANCED BENDS',
        tagline: 'Longer bends. Clear the blocker first.',
        accent: '#D97706',
        gradient: '#D97706',
        glow: 'transparent',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 16h6V8h6"/>
            <polyline points="13 5 16 8 13 11"/>
          </svg>
        `
      },
      advanced: {
        num: '03',
        bars: 3,
        tag: 'MEGA LABYRINTH',
        tagline: 'Dense boards. Every tap has to be in order.',
        accent: '#EA580C',
        gradient: '#EA580C',
        glow: 'transparent',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="6" height="6" rx="1"/>
            <rect x="14" y="4" width="6" height="6" rx="1"/>
            <rect x="4" y="14" width="6" height="6" rx="1"/>
            <rect x="14" y="14" width="6" height="6" rx="1"/>
          </svg>
        `
      },
      expert: {
        num: '04',
        bars: 4,
        tag: 'HARDCORE LOGIC',
        tagline: 'Few open exits. Plan three moves ahead.',
        accent: '#DC2626',
        gradient: '#DC2626',
        glow: 'transparent',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="8"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        `
      },
      master: {
        num: '05',
        bars: 5,
        tag: 'GRANDMASTER',
        tagline: 'The quiet boards. No extra free arrows.',
        accent: '#4F46E5',
        gradient: '#4F46E5',
        glow: 'transparent',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="9" r="5"/>
            <path d="M8.5 13.5 7 21l5-2 5 2-1.5-7.5"/>
          </svg>
        `
      },
      hacker: {
        num: '06',
        bars: 6,
        tag: 'SPEEDRUN BLITZ',
        tagline: 'Same puzzles, with a countdown.',
        accent: '#0891B2',
        gradient: '#0891B2',
        glow: 'transparent',
        svgIcon: `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="13" r="7"/>
            <path d="M12 10v4l2 1"/>
            <path d="M9 3h6"/>
          </svg>
        `
      }
    };

    const lastCat = this.progressData.lastCategory;
    const recommendedId = CATEGORIES.some((c) => c.id === lastCat) ? lastCat : 'beginner';

    this.container.innerHTML = `
      <div class="mode-screen">
        <header class="mode-nav">
          <button id="btn-complexity-back" class="mode-icon-btn" aria-label="Back">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="mode-nav-copy">
            <p class="mode-kicker">Difficulty</p>
            <h1>Choose a mode</h1>
          </div>
          <div class="mode-stars" title="Stars collected">${totalStars}</div>
        </header>

        <div class="mode-list">
          ${CATEGORIES.map((cat) => {
            const meta = categoryMeta[cat.id] || categoryMeta.beginner;
            const lockInfo = this.getCategoryLockInfo(cat.id, totalStars);
            const totalLevels = cat.levelsCount || 30;
            const currentUnlocked = lockInfo.isLocked ? 0 : Math.min(totalLevels, unlockedMap[cat.id] || 1);
            const progressPercent = lockInfo.isLocked ? 0 : Math.min(100, Math.round(((currentUnlocked - 1) / totalLevels) * 100));
            return `
              <div class="mode-row ${lockInfo.isLocked ? 'is-locked' : 'is-unlocked'}" data-cat="${cat.id}">
                <div class="mode-ico" style="background:${meta.accent}">${meta.svgIcon}</div>
                <div class="mode-copy">
                  <div class="mode-name-row">
                    <h2>${cat.name}</h2>
                    <span>${lockInfo.isLocked ? 'Locked' : totalLevels + ' levels'}</span>
                  </div>
                  <p>${meta.tagline}</p>
                  <div class="mode-track"><i style="width:${progressPercent}%; background:${meta.accent}"></i></div>
                </div>
                ${lockInfo.isLocked
                  ? `<div class="mode-lock">${lockInfo.requiredStars}★</div>`
                  : `<button class="mode-play" type="button">Play</button>`}
              </div>
            `;
          }).join('')}
        </div>
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

    const cards = this.container.querySelectorAll('.mode-row.is-unlocked');
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
