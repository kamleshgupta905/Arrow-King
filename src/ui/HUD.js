/**
 * HUD.js
 * In-game top header showing Level, Shape name, 3 Lives/Stars,
 * and bottom controls (Undo, Hint, Restart, Pause).
 * Removed Moves and Left counters per user request.
 */

import { soundManager } from '../audio/SoundManager.js';

export class HUD {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="game-hud photo-hud">
        <header class="hud-top">
          <button id="btn-hud-back" class="hud-icon-btn" title="Level Select">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="hud-title-card">
            <div class="hud-level-label"><span id="hud-category-label">BEGINNER</span> • LEVEL <span id="hud-level-num">1</span></div>
            <div class="hud-shape-name" id="hud-shape-name">TRIANGLE</div>
          </div>

          <!-- Countdown Timer for Hacker Mode -->
          <div class="hud-timer-badge" id="hud-timer-badge" style="display: none;" title="Time Remaining">
            <span class="hud-timer-icon">⏱</span>
            <span class="hud-timer-val" id="hud-timer-val">00:30</span>
          </div>

          <!-- 3 Stars Display (1 wrong move = 1 star removed) -->
          <div class="hud-stars-box" id="hud-stars-box" title="Remaining Stars / Lives">
            <span class="hud-star active" id="hud-star-1">★</span>
            <span class="hud-star active" id="hud-star-2">★</span>
            <span class="hud-star active" id="hud-star-3">★</span>
          </div>

          <button id="btn-hud-pause" class="hud-icon-btn" title="Settings">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </header>

        <!-- Notification banner on out of stars / restart -->
        <div class="hud-toast-banner" id="hud-toast-banner" style="display: none;"></div>

        <footer class="hud-bottom-controls photo-controls">
          <button id="btn-hud-undo" class="photo-ctrl-btn" title="Undo Last Move">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M3 7v6h6"/>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
            <span>UNDO</span>
          </button>

          <button id="btn-hud-hint" class="photo-ctrl-btn hint-ctrl-btn" title="Show Hint">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M9 18h6"/>
              <path d="M10 22h4"/>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/>
            </svg>
            <span>HINT</span>
          </button>

          <button id="btn-hud-restart" class="photo-ctrl-btn" title="Restart Level">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M23 4v6h-6"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span>RESTART</span>
          </button>
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#btn-hud-back')?.addEventListener('click', () => {
      soundManager.playTap();
      if (this.callbacks.onBack) this.callbacks.onBack();
    });

    this.container.querySelector('#btn-hud-pause')?.addEventListener('click', () => {
      soundManager.playTap();
      if (this.callbacks.onPause) this.callbacks.onPause();
    });

    this.container.querySelector('#btn-hud-undo')?.addEventListener('click', () => {
      if (this.callbacks.onUndo) this.callbacks.onUndo();
    });

    this.container.querySelector('#btn-hud-hint')?.addEventListener('click', () => {
      if (this.callbacks.onHint) this.callbacks.onHint();
    });

    this.container.querySelector('#btn-hud-restart')?.addEventListener('click', () => {
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });
  }

  updateLevelInfo(levelNum, shapeName, categoryName = 'Beginner') {
    const lvlEl = this.container.querySelector('#hud-level-num');
    if (lvlEl) lvlEl.textContent = levelNum;
    const catEl = this.container.querySelector('#hud-category-label');
    if (catEl) catEl.textContent = (categoryName || 'Beginner').toUpperCase();
    const nameEl = this.container.querySelector('#hud-shape-name');
    if (nameEl) nameEl.textContent = shapeName.toUpperCase();

    this.updateStars(3, false);
  }

  /**
   * Updates countdown timer for Hacker mode.
   */
  updateTimer(timeRemaining, isTimed) {
    const badge = this.container.querySelector('#hud-timer-badge');
    if (!badge) return;

    if (!isTimed) {
      badge.style.display = 'none';
      return;
    }

    badge.style.display = 'inline-flex';
    const totalSecs = Math.max(0, Math.ceil(timeRemaining));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const valEl = this.container.querySelector('#hud-timer-val');
    if (valEl) valEl.textContent = timeStr;

    if (totalSecs <= 10) {
      badge.classList.add('urgent');
    } else {
      badge.classList.remove('urgent');
    }
  }

  /**
   * Updates HUD stars: 3 stars initially, 1 removed on each wrong move.
   */
  updateStars(starsCount, lostStar = false) {
    for (let i = 1; i <= 3; i++) {
      const starEl = this.container.querySelector(`#hud-star-${i}`);
      if (!starEl) continue;

      if (i <= starsCount) {
        starEl.className = 'hud-star active';
      } else {
        if (lostStar && i === starsCount + 1) {
          starEl.className = 'hud-star star-shatter';
          setTimeout(() => {
            starEl.className = 'hud-star lost';
          }, 450);
        } else {
          starEl.className = 'hud-star lost';
        }
      }
    }
  }

  showRestartToast(message) {
    const toast = this.container.querySelector('#hud-toast-banner');
    if (!toast) return;

    if (message) {
      toast.textContent = message;
      toast.style.display = 'block';
      toast.className = 'hud-toast-banner show';
    } else {
      toast.style.display = 'none';
      toast.className = 'hud-toast-banner';
    }
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }
}
