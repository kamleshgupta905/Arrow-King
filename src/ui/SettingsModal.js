/**
 * SettingsModal.js
 * In-game pause & settings modal with audio controls and instructions.
 */

import { soundManager } from '../audio/SoundManager.js';
import { updateManager, APP_VERSION, DIRECT_APK_URL } from '../services/UpdateManager.js';

export class SettingsModal {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    // { onResume, onRestart, onLevelSelect, onResetProgress }

    this.render();
  }

  render() {
    this.container.insertAdjacentHTML('beforeend', `
      <div class="modal-backdrop" id="settings-modal" style="display: none;">
        <div class="modal-card settings-card">
          <div class="settings-header">
            <h2 class="settings-title">GAME PAUSED</h2>
            <button id="btn-settings-close" class="icon-btn-small" aria-label="Close">✕</button>
          </div>

          <div class="settings-section">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Sound Effects</span>
                <span class="setting-desc">Taps, slides, bounces, and chimes</span>
              </div>
              <button id="toggle-sfx" class="toggle-btn ${soundManager.sfxEnabled ? 'on' : 'off'}">
                <span class="toggle-track">
                  <span class="toggle-thumb"></span>
                </span>
              </button>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-name">Royal Court Score</span>
                <span class="setting-desc">Choir, harp, and gold bells</span>
              </div>
              <button id="toggle-music" class="toggle-btn ${soundManager.musicEnabled ? 'on' : 'off'}">
                <span class="toggle-track">
                  <span class="toggle-thumb"></span>
                </span>
              </button>
            </div>
          </div>

          <div class="settings-guide">
            <div class="guide-title">HOW TO PLAY</div>
            <ul class="guide-list">
              <li>Tap arrows to glide them along the maze rails.</li>
              <li>Each arrow lands in its slot to build the target shape outline.</li>
              <li>If an arrow is blocked by another arrow, clear the blocker first!</li>
              <li>Use <strong>Hint</strong> or <strong>Undo</strong> whenever needed.</li>
            </ul>
          </div>

          <button id="btn-check-update" class="btn btn-secondary settings-update-btn">CHECK FOR UPDATE · v${APP_VERSION}</button>
          <button id="btn-direct-apk" class="btn btn-secondary settings-update-btn">DIRECT APK DOWNLOAD</button>
          <div id="update-status"></div>

          <div class="settings-actions">
            <button id="btn-settings-resume" class="btn btn-primary">RESUME</button>
            <button id="btn-settings-restart" class="btn btn-secondary">RESTART LEVEL</button>
            <button id="btn-settings-levels" class="btn btn-secondary">LEVEL SELECT</button>
          </div>
        </div>
      </div>
    `);

    this.modal = this.container.querySelector('#settings-modal');
    this.bindEvents();
  }

  bindEvents() {
    const sfxBtn = this.container.querySelector('#toggle-sfx');
    sfxBtn?.addEventListener('click', () => {
      const enabled = soundManager.toggleSfx();
      sfxBtn.className = `toggle-btn ${enabled ? 'on' : 'off'}`;
      soundManager.playTap();
    });

    const musicBtn = this.container.querySelector('#toggle-music');
    musicBtn?.addEventListener('click', () => {
      const enabled = soundManager.toggleMusic();
      musicBtn.className = `toggle-btn ${enabled ? 'on' : 'off'}`;
      soundManager.playTap();
    });

    this.container.querySelector('#btn-settings-close')?.addEventListener('click', () => {
      this.hide();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    this.container.querySelector('#btn-settings-resume')?.addEventListener('click', () => {
      soundManager.playTap();
      this.hide();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    this.container.querySelector('#btn-settings-restart')?.addEventListener('click', () => {
      soundManager.playTap();
      this.hide();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    this.container.querySelector('#btn-direct-apk')?.addEventListener('click', () => {
      soundManager.playTap();
      updateManager.openDirectDownload();
    });

    this.container.querySelector('#btn-check-update')?.addEventListener('click', () => {
      soundManager.playTap();
      const status = this.container.querySelector('#update-status');
      if (status) status.textContent = 'Asking the court…';
      updateManager.checkForUpdates({ manual: true }).finally(() => {
        if (status) status.textContent = '';
      });
    });

    this.container.querySelector('#btn-settings-levels')?.addEventListener('click', () => {
      soundManager.playTap();
      this.hide();
      if (this.callbacks.onLevelSelect) this.callbacks.onLevelSelect();
    });
  }

  show() {
    // Refresh toggle states
    const sfxBtn = this.container.querySelector('#toggle-sfx');
    const musicBtn = this.container.querySelector('#toggle-music');
    if (sfxBtn) sfxBtn.className = `toggle-btn ${soundManager.sfxEnabled ? 'on' : 'off'}`;
    if (musicBtn) musicBtn.className = `toggle-btn ${soundManager.musicEnabled ? 'on' : 'off'}`;

    if (!this.modal) this.modal = this.container.querySelector('#settings-modal');
    if (this.modal) this.modal.style.display = 'flex';
  }

  hide() {
    if (!this.modal) this.modal = this.container.querySelector('#settings-modal');
    if (this.modal) this.modal.style.display = 'none';
  }
}
