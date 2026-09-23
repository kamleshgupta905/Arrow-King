/**
 * LevelSelect.js
 * Clean, flat, human-crafted level selection screen.
 * Supports all 6 categories (Beginner, Intermediate, Advanced, Expert, Master, Hacker)
 * with 100 levels each (600 levels total).
 * Zero gradients, flat solid surfaces, crisp typography, and responsive sub-range navigation.
 */

import { CATEGORIES, getCategoryLevelsMetadata, getLevel } from '../levels/LevelData.js';
import { soundManager } from '../audio/SoundManager.js';

export class LevelSelect {
  constructor(container, onSelectLevelCallback, onBackCallback) {
    this.container = container;
    this.onSelectLevel = onSelectLevelCallback;
    this.onBack = onBackCallback;

    this.activeCategory = 'beginner';
    this.activeRangeIndex = 0; // 0: 1-10, 1: 11-20, ... 9: 91-100
    this.ranges = [
      [1, 10],
      [11, 20],
      [21, 30],
      [31, 40],
      [41, 50],
      [51, 60],
      [61, 70],
      [71, 80],
      [81, 90],
      [91, 100]
    ];
  }

  render(progressData) {
    this.progressData = progressData || {};
    const unlockedMap = this.progressData.unlocked || {};
    const starsMap = this.progressData.stars || {};

    const cat = CATEGORIES.find(c => c.id === this.activeCategory) || CATEGORIES[0];
    const catStars = this.calculateCategoryStars(starsMap, this.activeCategory);
    const catMaxStars = (cat.levelsCount || 30) * 3;
    const catIcon = {
      beginner: '🟢',
      intermediate: '🟡',
      advanced: '🟠',
      expert: '🔴',
      master: '🟣',
      hacker: '⚡'
    }[cat.id] || '🔹';

    this.container.innerHTML = `
      <div class="level-select-screen royal-theme">
        <header class="level-select-header">
          <button id="btn-ls-back" class="icon-btn-royal" aria-label="Back to Difficulty">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="header-center-royal">
            <div class="ls-cat-badge">
              <span class="ls-cat-icon">${catIcon}</span>
              <h2 class="ls-title">${cat.name.toUpperCase()}</h2>
            </div>
            <div class="ls-progress-badge">
              <span class="star-icon">★</span>
              <span>${catStars} / ${catMaxStars} Stars</span>
            </div>
          </div>
          <div style="width: 42px;"></div>
        </header>

        <!-- Range Sub-Tabs (1-10, 11-20, 21-30) -->
        <div class="range-tabs-bar" id="range-tabs-bar">
          ${this.ranges.map((r, idx) => `
            <button class="range-tab-btn ${idx === this.activeRangeIndex ? 'active' : ''}" data-range="${idx}">
              ${r[0]} - ${r[1]}
            </button>
          `).join('')}
        </div>

        <!-- Levels Cards Grid Container -->
        <div class="levels-grid-container">
          <div class="levels-cards-grid" id="levels-grid-body">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>
    `;

    this.populateGrid();
    this.bindEvents();
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

  populateGrid() {
    const gridBody = this.container.querySelector('#levels-grid-body');
    if (!gridBody) return;

    const catId = this.activeCategory;
    const starsMap = this.progressData.stars || {};
    const totalStars = this.calculateTotalStars(starsMap);
    const catLockInfo = this.getCategoryLockInfo(catId, totalStars);

    // If tier is locked by star requirement (40 stars for Expert, 60 stars for Master)
    if (catLockInfo.isLocked) {
      this.cancelPreviewRendering();
      const catName = catId.charAt(0).toUpperCase() + catId.slice(1);
      const remainingStars = catLockInfo.requiredStars - totalStars;
      gridBody.innerHTML = `
        <div class="category-locked-view">
          <div class="cat-locked-card">
            <div class="cat-locked-icon">🔒</div>
            <h3 class="cat-locked-title">${catName.toUpperCase()} TIER LOCKED</h3>
            <p class="cat-locked-desc">
              Collect <strong>${catLockInfo.requiredStars} Stars</strong> across previous tiers to unlock <strong>${catName}</strong> levels.
            </p>
            <div class="cat-locked-progress-wrap">
              <div class="cat-locked-progress-bar" style="width: ${Math.min(100, Math.round((totalStars / catLockInfo.requiredStars) * 100))}%;"></div>
            </div>
            <div class="cat-locked-stat">
              <span class="stat-current">★ Current Stars: <strong>${totalStars}</strong></span>
              <span class="stat-needed">★ Needed: <strong>${remainingStars} more</strong></span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const [startLvl, endLvl] = this.ranges[this.activeRangeIndex];
    const unlockedMap = this.progressData.unlocked || {};
    const maxUnlocked = unlockedMap[catId] !== undefined ? unlockedMap[catId] : (catId === 'beginner' ? 1 : 1);

    const allMeta = getCategoryLevelsMetadata(catId);
    const rangeMeta = allMeta.slice(startLvl - 1, endLvl);

    gridBody.innerHTML = rangeMeta.map(lvl => {
      const isUnlocked = lvl.levelNumber <= maxUnlocked;
      const starKey = `${catId}_${lvl.levelNumber}`;
      // Also fallback to legacy single-number stars if beginner
      const stars = starsMap[starKey] !== undefined ? starsMap[starKey] : (catId === 'beginner' ? (starsMap[lvl.levelNumber] || 0) : 0);
      const isHacker = catId === 'hacker';

      return `
        <div class="level-card-flat ${isUnlocked ? 'unlocked' : 'locked'} ${isHacker ? 'hacker-card' : ''}" data-level="${lvl.levelNumber}">
          <div class="card-header-flat">
            <span class="card-shape-name">${lvl.shapeName}</span>
            <span class="card-level-pill">#${lvl.levelNumber}</span>
          </div>

          ${isHacker ? `<div class="card-timed-tag">⏱ TIMED</div>` : ''}

          <div class="card-preview-flat">
            <canvas class="card-preview-canvas" width="130" height="130" data-level="${lvl.levelNumber}"></canvas>
            ${!isUnlocked ? `
              <div class="card-locked-overlay">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#64748b" stroke-width="2.4">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>LOCKED</span>
              </div>
            ` : ''}
          </div>

          <div class="card-footer-flat">
            <div class="card-stars-flat">
              <span class="star ${stars >= 1 ? 'earned' : ''}">★</span>
              <span class="star ${stars >= 2 ? 'earned' : ''}">★</span>
              <span class="star ${stars >= 3 ? 'earned' : ''}">★</span>
            </div>
            ${isUnlocked ? `
              <button class="card-play-btn-flat">PLAY</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Cancel any previous preview rendering task
    this.cancelPreviewRendering();

    // Render previews progressively in small batches without blocking the UI thread
    this.renderCardPreviewsProgressively(rangeMeta);

    // Clean touch-friendly click listeners for unlocked cards
    let hasSelected = false;

    gridBody.querySelectorAll('.level-card-flat.unlocked').forEach(card => {
      const lvl = parseInt(card.dataset.level, 10);

      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasSelected) return;
        hasSelected = true;
        this.cancelPreviewRendering();
        soundManager.playTap();
        this.hide();
        if (this.onSelectLevel) {
          this.onSelectLevel(this.activeCategory, lvl);
        }
      });
    });
  }

  cancelPreviewRendering() {
    this.previewSessionId = (this.previewSessionId || 0) + 1;
    if (this.previewRafId) {
      cancelAnimationFrame(this.previewRafId);
      this.previewRafId = null;
    }
  }

  renderCardPreviewsProgressively(levelsMeta) {
    const currentSession = this.previewSessionId;
    const canvases = Array.from(this.container.querySelectorAll('.card-preview-canvas'));
    let index = 0;

    const renderNextBatch = () => {
      if (this.previewSessionId !== currentSession) return;

      const batchSize = 3;
      const end = Math.min(index + batchSize, canvases.length);

      for (; index < end; index++) {
        const canvas = canvases[index];
        const levelNum = parseInt(canvas.dataset.level, 10);
        try {
          const levelData = getLevel(this.activeCategory, levelNum);
          this.drawPreview(canvas, levelData);
        } catch (e) {
          console.warn('Error rendering card preview:', e);
        }
      }

      if (index < canvases.length) {
        this.previewRafId = requestAnimationFrame(renderNextBatch);
      } else {
        this.previewRafId = null;
      }
    };

    this.previewRafId = requestAnimationFrame(renderNextBatch);
  }

  drawPreview(canvas, levelData) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#080b18';
    ctx.fillRect(0, 0, w, h);

    const boardW = levelData.width;
    const boardH = levelData.height;
    const padding = 10;
    const cellSize = Math.min((w - padding * 2) / boardW, (h - padding * 2) / boardH);
    const offsetX = (w - boardW * cellSize) / 2;
    const offsetY = (h - boardH * cellSize) / 2;

    // Draw subtle grid dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let y = 1; y < boardH; y += 2) {
      for (let x = 1; x < boardW; x += 2) {
        ctx.beginPath();
        ctx.arc(offsetX + x * cellSize, offsetY + y * cellSize, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw solid sharp arrow lines
    ctx.lineWidth = Math.max(2.4, cellSize * 0.22);
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;

    for (const arrow of levelData.arrows) {
      if (arrow.points.length >= 2) {
        const col = arrow.color || (this.activeCategory === 'hacker' ? '#0f172a' : '#1e293b');
        ctx.strokeStyle = col;
        ctx.fillStyle = col;

        ctx.beginPath();
        const p0 = arrow.points[0];
        ctx.moveTo(offsetX + p0.x * cellSize, offsetY + p0.y * cellSize);
        for (let i = 1; i < arrow.points.length; i++) {
          const pi = arrow.points[i];
          ctx.lineTo(offsetX + pi.x * cellSize, offsetY + pi.y * cellSize);
        }
        ctx.stroke();

        // Arrowhead
        const head = arrow.points[arrow.points.length - 1];
        const hx = offsetX + head.x * cellSize;
        const hy = offsetY + head.y * cellSize;
        const headSize = Math.max(5, cellSize * 0.45);

        ctx.save();
        ctx.translate(hx, hy);
        if (arrow.dir === 'DOWN') ctx.rotate(Math.PI / 2);
        else if (arrow.dir === 'LEFT') ctx.rotate(Math.PI);
        else if (arrow.dir === 'UP') ctx.rotate(-Math.PI / 2);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headSize, -headSize * 0.44);
        ctx.lineTo(-headSize, headSize * 0.44);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  bindEvents() {
    const backBtn = this.container.querySelector('#btn-ls-back');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        soundManager.playTap();
        this.hide();
        if (this.onBack) this.onBack();
      });
    }

    // Range tabs
    const rangeBtns = this.container.querySelectorAll('.range-tab-btn');
    rangeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rIdx = parseInt(btn.dataset.range, 10);
        if (this.activeRangeIndex === rIdx) return;
        rangeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeRangeIndex = rIdx;
        soundManager.playTap();
        setTimeout(() => this.populateGrid(), 40);
      });
    });
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

  show(progressData, categoryId) {
    if (categoryId) this.activeCategory = categoryId;
    this.render(progressData);
    this.container.style.display = 'block';
  }

  hide() {
    this.cancelPreviewRendering();
    this.container.style.display = 'none';
  }
}
