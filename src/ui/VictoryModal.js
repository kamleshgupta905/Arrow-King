/**
 * VictoryModal.js
 * Clean animated victory celebration modal.
 * Prominently displays remaining stars directly above the Next Level button.
 */

import { soundManager } from '../audio/SoundManager.js';

export class VictoryModal {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.render();
  }

  render() {
    this.container.insertAdjacentHTML('beforeend', `
      <div class="modal-backdrop" id="victory-modal" style="display: none;">
        <div class="modal-card victory-card">
          <div class="victory-ribbon">LEVEL COMPLETED!</div>
          
          <div class="victory-shape-title">
            <span class="shape-badge">SHAPE CLEARED</span>
            <h2 class="victory-shape-name" id="vic-shape-name">TRIANGLE</h2>
          </div>

          <!-- Stars displayed directly above the Next button per user request -->
          <div class="victory-stars-section">
            <div class="vic-stars-title">STARS EARNED</div>
            <div class="victory-stars-container" id="vic-stars">
              <span class="vic-star" id="vic-star-1">★</span>
              <span class="vic-star" id="vic-star-2">★</span>
              <span class="vic-star" id="vic-star-3">★</span>
            </div>
            <div class="vic-stars-count-text" id="vic-stars-count-text">3 of 3 Stars</div>
          </div>

          <div class="victory-buttons">
            <button id="btn-vic-replay" class="btn btn-secondary">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              REPLAY
            </button>
            <button id="btn-vic-next" class="btn btn-primary pulse-btn">
              <span>NEXT LEVEL</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <button id="btn-vic-levels" class="text-link-btn">Back to Level Select</button>
        </div>
      </div>
    `);

    this.modal = this.container.querySelector('#victory-modal');
    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#btn-vic-next')?.addEventListener('click', () => {
      soundManager.playTap();
      this.hide();
      if (this.callbacks.onNextLevel) this.callbacks.onNextLevel();
    });

    this.container.querySelector('#btn-vic-replay')?.addEventListener('click', () => {
      soundManager.playTap();
      this.hide();
      if (this.callbacks.onReplay) this.callbacks.onReplay();
    });

    this.container.querySelector('#btn-vic-levels')?.addEventListener('click', () => {
      soundManager.playTap();
      this.hide();
      if (this.callbacks.onLevelSelect) this.callbacks.onLevelSelect();
    });
  }

  show(result) {
    if (!this.modal) this.modal = this.container.querySelector('#victory-modal');
    if (this.modal) this.modal.style.display = 'flex';

    const shapeNameEl = this.container.querySelector('#vic-shape-name');
    if (shapeNameEl) shapeNameEl.textContent = result.shapeName.toUpperCase();

    const countTextEl = this.container.querySelector('#vic-stars-count-text');
    if (countTextEl) countTextEl.textContent = `${result.stars} of 3 Stars`;

    // Reset stars
    const stars = [
      this.container.querySelector('#vic-star-1'),
      this.container.querySelector('#vic-star-2'),
      this.container.querySelector('#vic-star-3')
    ];
    stars.forEach(s => s && (s.className = 'vic-star'));

    // Animate remaining stars popping in with musical chimes
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (stars[i]) {
          if (i < result.stars) {
            stars[i].className = 'vic-star active pop-in';
            soundManager.playStar(i);
          } else {
            stars[i].className = 'vic-star dimmed';
          }
        }
      }, 250 + i * 260);
    }

    // If level 50, update next button text to "GRAND FINALE"
    const nextBtn = this.container.querySelector('#btn-vic-next span');
    if (nextBtn) {
      if (result.levelNumber >= 50) {
        nextBtn.textContent = 'GRAND FINALE!';
      } else {
        nextBtn.textContent = 'NEXT LEVEL';
      }
    }
  }

  hide() {
    if (!this.modal) this.modal = this.container.querySelector('#victory-modal');
    if (this.modal) this.modal.style.display = 'none';
  }
}
