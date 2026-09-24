/**
 * UpdateManager.js
 * Phone auto-update for sideloaded Arrow King builds.
 *
 * On launch (and whenever the app returns to the foreground) the court
 * asks GitHub for the latest release. If the tag is newer than this build,
 * a premiere sheet appears. On Android the APK is downloaded natively and
 * the system installer opens — one tap, no browser hunt.
 */

import pkg from '../../package.json';
import { registerPlugin } from '@capacitor/core';

export const APP_VERSION = pkg.version || '2.0.0';

const REPO = 'kamleshgupta905/Arrow-King';
const RELEASES_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;
export const DIRECT_APK_URL = `https://github.com/${REPO}/releases/latest/download/Arrow-King.apk`;

const ApkUpdater = registerPlugin('ApkUpdater');

function parseVersion(tag) {
  const match = String(tag || '').match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return [0, 0, 0];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isNewerVersion(remote, local = APP_VERSION) {
  const next = parseVersion(remote);
  const current = parseVersion(local);
  for (let i = 0; i < 3; i += 1) {
    if (next[i] > current[i]) return true;
    if (next[i] < current[i]) return false;
  }
  return false;
}

function isNative() {
  return typeof window !== 'undefined'
    && window.Capacitor
    && typeof window.Capacitor.isNativePlatform === 'function'
    && window.Capacitor.isNativePlatform();
}

class UpdateManager {
  constructor() {
    this.currentVersion = APP_VERSION;
    this.latest = null;
    this.checking = false;
    this.downloading = false;
    this.dismissed = false;
    this.sheet = null;
  }

  async checkForUpdates({ manual = false } = {}) {
    if (this.checking || this.downloading) return;
    this.checking = true;
    try {
      const response = await fetch(RELEASES_URL, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ArrowKing-Updater'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (manual) this.showStatusSheet({ tone: 'quiet', title: 'Court is quiet', body: 'No release could be reached. Try again when the signal returns.' });
        return;
      }

      const data = await response.json();
      const tag = data.tag_name || '';
      const asset = this.pickAsset(data.assets || []);
      this.latest = {
        tag,
        version: tag.replace(/^v/i, ''),
        name: data.name || `Arrow King ${tag}`,
        notes: this.cleanNotes(data.body),
        url: asset?.browser_download_url || DIRECT_APK_URL,
        page: data.html_url || RELEASES_PAGE
      };

      if (isNewerVersion(tag, this.currentVersion)) {
        if (manual || !this.dismissed) this.showUpdateSheet(this.latest);
      } else if (manual) {
        this.showStatusSheet({
          tone: 'gold',
          title: 'You hold the latest crown',
          body: `Arrow King v${this.currentVersion} is the current royal build.`
        });
      }
    } catch (err) {
      if (manual) {
        this.showStatusSheet({
          tone: 'quiet',
          title: 'Update check paused',
          body: 'The court could not reach GitHub. Check the connection and try again.'
        });
      }
      console.log('[UpdateManager]', err?.message || err);
    } finally {
      this.checking = false;
    }
  }

  pickAsset(assets) {
    const apks = assets.filter((asset) => /\.apk$/i.test(asset.name || ''));
    return apks.find((asset) => asset.name === 'Arrow-King.apk') || apks[0] || null;
  }

  cleanNotes(body) {
    if (!body) return 'A newer royal build is ready for this phone.';
    return body
      .replace(/[#>*_`]/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join(' ');
  }

  ensureSheet() {
    let sheet = document.getElementById('royal-update-sheet');
    if (sheet) {
      this.sheet = sheet;
      return sheet;
    }

    sheet = document.createElement('div');
    sheet.id = 'royal-update-sheet';
    sheet.className = 'royal-update-sheet';
    sheet.innerHTML = `
      <div class="royal-update-card" role="dialog" aria-labelledby="royal-update-title">
        <div class="royal-update-seal" aria-hidden="true">
          <img src="/icon-512.png" alt="" />
        </div>
        <div class="royal-update-kicker" id="royal-update-kicker">NEW ROYAL BUILD</div>
        <h2 class="royal-update-title" id="royal-update-title">A new crown is ready</h2>
        <p class="royal-update-body" id="royal-update-body"></p>
        <div class="royal-update-progress" id="royal-update-progress" hidden>
          <div class="royal-update-progress-bar" id="royal-update-bar"></div>
        </div>
        <div class="royal-update-actions">
          <button type="button" class="royal-update-later" id="royal-update-later">Later</button>
          <button type="button" class="royal-update-go" id="royal-update-go">Download APK</button>
          <button type="button" class="royal-update-later" id="royal-update-browser">Open in browser</button>
        </div>
      </div>
    `;
    document.body.appendChild(sheet);
    sheet.querySelector('#royal-update-later')?.addEventListener('click', () => this.hideSheet());
    sheet.querySelector('#royal-update-go')?.addEventListener('click', () => this.beginUpdate());
    sheet.querySelector('#royal-update-browser')?.addEventListener('click', () => this.openDirectDownload());
    this.sheet = sheet;
    return sheet;
  }

  showUpdateSheet(info) {
    const sheet = this.ensureSheet();
    sheet.dataset.mode = 'update';
    sheet.querySelector('#royal-update-kicker').textContent = `v${this.currentVersion}  →  v${info.version || info.tag}`;
    sheet.querySelector('#royal-update-title').textContent = 'A new crown is ready';
    sheet.querySelector('#royal-update-body').textContent = `${info.notes} If Android says the app already exists, uninstall Arrow King once, then install this file.`;
    const go = sheet.querySelector('#royal-update-go');
    go.hidden = false;
    go.disabled = false;
    go.textContent = 'Download APK';
    sheet.querySelector('#royal-update-progress').hidden = true;
    sheet.classList.add('is-open');
  }

  showStatusSheet({ title, body, tone }) {
    const sheet = this.ensureSheet();
    sheet.dataset.mode = tone || 'quiet';
    sheet.querySelector('#royal-update-kicker').textContent = `INSTALLED v${this.currentVersion}`;
    sheet.querySelector('#royal-update-title').textContent = title;
    sheet.querySelector('#royal-update-body').textContent = body;
    sheet.querySelector('#royal-update-go').hidden = true;
    sheet.querySelector('#royal-update-progress').hidden = true;
    sheet.classList.add('is-open');
  }

  openDirectDownload() {
    const url = this.latest?.url || DIRECT_APK_URL;
    if (isNative()) {
      ApkUpdater.openExternal({ url }).catch(() => {
        window.open(url, '_blank', 'noopener');
      });
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  hideSheet() {
    this.sheet?.classList.remove('is-open');
  }

  setProgress(value) {
    const wrap = this.sheet?.querySelector('#royal-update-progress');
    const bar = this.sheet?.querySelector('#royal-update-bar');
    const go = this.sheet?.querySelector('#royal-update-go');
    if (wrap) wrap.hidden = false;
    if (bar) bar.style.width = `${Math.max(4, Math.min(100, value))}%`;
    if (go) go.textContent = value >= 100 ? 'Opening installer…' : `Downloading ${Math.round(value)}%`;
  }

  async beginUpdate() {
    const info = this.latest;
    if (!info || this.downloading) return;

    const apkUrl = info.url || DIRECT_APK_URL;
    if (!isNative()) {
      window.open(apkUrl, '_blank', 'noopener');
      return;
    }

    const go = this.sheet?.querySelector('#royal-update-go');
    this.downloading = true;
    if (go) {
      go.disabled = true;
      go.textContent = 'Preparing…';
    }

    try {
      const permission = await ApkUpdater.canInstall();
      if (permission && permission.allowed === false) {
        await ApkUpdater.openInstallSettings();
        if (go) {
          go.disabled = false;
          go.textContent = 'I allowed installs';
        }
        const body = this.sheet?.querySelector('#royal-update-body');
        if (body) {
          body.textContent = 'Allow Arrow King to install unknown apps, then return and tap the button again.';
        }
        this.downloading = false;
        return;
      }

      const handle = await ApkUpdater.addListener?.('progress', (event) => {
        if (typeof event?.progress === 'number') this.setProgress(event.progress);
      });

      this.setProgress(3);
      await ApkUpdater.downloadAndInstall({ url: apkUrl });
      this.setProgress(100);
      handle?.remove?.();
    } catch (err) {
      console.log('[UpdateManager] install failed', err);
      if (go) {
        go.disabled = false;
        go.textContent = 'Open download';
      }
      const body = this.sheet?.querySelector('#royal-update-body');
      if (body) body.textContent = 'In-app install failed. Opening the direct APK link in the browser.';
      try {
        await ApkUpdater.openExternal({ url: apkUrl });
      } catch (_) {
        window.open(apkUrl, '_blank', 'noopener');
      }
    } finally {
      this.downloading = false;
    }
  }
}

export const updateManager = new UpdateManager();
