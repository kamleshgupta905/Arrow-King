/**
 * CompleteModal.js
 * Grand Finale celebration screen shown after completing all 50 levels.
 */

import { soundManager } from '../audio/SoundManager.js';

export class CompleteModal {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    // { onLevelSelect, onRestartFromBeginning }

    this.render();
  }

  render() {
    this.container.insertAdjacentHTML('beforeend', `
      <div class="modal-backdrop" id="complete-modal" style="display: none;">
        <div class="modal-card complete-card">
          <div class="trophy-glow-icon">
            <svg viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="#ffd166" stroke-width="1.8">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
            </svg>
          </div>

          <div class="complete-ribbon">MASTER CONQUEROR</div>
          <h1 class="complete-title">ALL 50 LEVELS COMPLETE!</h1>
          <p class="complete-desc">
            You have mastered every maze, guided every arrow, and forged all 50 vector constellations!
          </p>

          <div class="complete-stats-row">
            <div class="complete-stat-pill">
              <span class="comp-stat-val" id="comp-total-stars">150</span>
              <span class="comp-stat-lbl">STARS EARNED</span>
            </div>
            <div class="complete-stat-pill">
              <span class="comp-stat-val">50 / 50</span>
              <span class="comp-stat-lbl">SHAPES BUILT</span>
            </div>
            <div class="complete-stat-pill">
              <span class="comp-stat-val" id="comp-rank-val">GRAND MASTER</span>
              <span class="comp-stat-lbl">PLAYER RANK</span>
            </div>
          </div>

          <div class="complete-actions">
            <button id="btn-comp-levels" class="btn btn-primary pulse-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              BROWSE ALL LEVELS
            </button>
          </div>
        </div>
      </div>
    `);

    this.modal = this.container.querySelector('#complete-modal');
    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#btn-comp-levels')?.addEventListener('click', () => {
      soundManager.playTap();
      this.hide();
      if (this.callbacks.onLevelSelect) this.callbacks.onLevelSelect();
    });
  }

  show(totalStars) {
    if (!this.modal) this.modal = this.container.querySelector('#complete-modal');
    if (this.modal) this.modal.style.display = 'flex';

    const starsEl = this.container.querySelector('#comp-total-stars');
    if (starsEl) starsEl.textContent = `${totalStars} / 150`;

    let rank = 'PUZZLE ADEPT';
    if (totalStars >= 140) rank = 'LEGENDARY MASTER';
    else if (totalStars >= 110) rank = 'GRAND MASTER';
    else if (totalStars >= 80) rank = 'EXPERT ARCHITECT';

    const rankEl = this.container.querySelector('#comp-rank-val');
    if (rankEl) rankEl.textContent = rank;
  }

  hide() {
    if (!this.modal) this.modal = this.container.querySelector('#complete-modal');
    if (this.modal) this.modal.style.display = 'none';
  }
}
