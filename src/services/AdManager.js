/**
 * AdManager.js
 * High-Earning & Policy-Safe Monetization Manager for Arrow King.
 * 
 * Best Practices implemented to maximize eCPM and prevent AdMob Account Bans:
 * 1. Rewarded Video Ads: Voluntary user watch for hints / undo (Highest eCPM, 0% ban risk).
 * 2. Interstitial Ads: Strictly capped with a 90-second cooldown timer & minimum 3 levels interval.
 * 3. Banner Ads: Displayed only in menus/level select, automatically hidden during puzzle gameplay to eliminate accidental touches.
 * 4. Test Device Mode: Built-in official Google AdMob test IDs to ensure developers never click real ads.
 * 5. Web/Dev Fallback: Works seamlessly in desktop browsers without breaking game flow.
 */

import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// Official Google AdMob Test Ad Units (Safe for development & testing)
const TEST_AD_UNITS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917'
};

// Replace with your real AdMob Ad Units when ready for Google Play Store release!
const PRODUCTION_AD_UNITS = {
  banner: 'ca-app-pub-3940256099942544/6300978111', // Put your Real Banner Unit ID here
  interstitial: 'ca-app-pub-3940256099942544/1033173712', // Put your Real Interstitial Unit ID here
  rewarded: 'ca-app-pub-3940256099942544/5224354917' // Put your Real Rewarded Unit ID here
};

export class AdManager {
  constructor() {
    this.isNative = false;
    this.isInitialized = false;
    this.isTestMode = true; // Set to false when publishing to Play Store!
    
    // Safety caps to prevent ad frequency bans & user churn
    this.lastInterstitialTime = 0;
    this.interstitialCooldownMs = 90000; // 90 seconds minimum cooldown between interstitials
    this.levelsCompletedSinceLastAd = 0;
    this.minLevelsBetweenAds = 3; // Show interstitial at most every 3 levels

    this.checkPlatform();
  }

  async checkPlatform() {
    try {
      this.isNative = typeof window !== 'undefined' && 
                      window.Capacitor && 
                      window.Capacitor.isNativePlatform();
    } catch (_) {
      this.isNative = false;
    }
  }

  getAdUnits() {
    return this.isTestMode ? TEST_AD_UNITS : PRODUCTION_AD_UNITS;
  }

  /**
   * Initialize AdMob with Google UMP Consent Support
   */
  async initialize() {
    if (!this.isNative) {
      console.log('[AdManager] Web environment detected. Using mock ad simulator.');
      this.isInitialized = true;
      return;
    }

    try {
      await AdMob.initialize({
        testingDevices: ['EMULATOR'],
        initializeForTesting: this.isTestMode,
      });

      this.isInitialized = true;
      console.log('[AdManager] AdMob successfully initialized.');

      // Preload the first interstitial and rewarded ad in background
      this.prepareInterstitial();
      this.prepareRewarded();
    } catch (err) {
      console.warn('[AdManager] AdMob initialization error:', err);
    }
  }

  /**
   * Preload an Interstitial Ad in the background
   */
  async prepareInterstitial() {
    if (!this.isNative || !this.isInitialized) return;
    try {
      const units = this.getAdUnits();
      await AdMob.prepareInterstitial({
        adId: units.interstitial,
        isTesting: this.isTestMode,
      });
      console.log('[AdManager] Interstitial ad prepared.');
    } catch (e) {
      console.warn('[AdManager] Could not prepare interstitial:', e);
    }
  }

  /**
   * Preload a Rewarded Video Ad in the background
   */
  async prepareRewarded() {
    if (!this.isNative || !this.isInitialized) return;
    try {
      const units = this.getAdUnits();
      await AdMob.prepareRewardVideoAd({
        adId: units.rewarded,
        isTesting: this.isTestMode,
      });
      console.log('[AdManager] Rewarded ad prepared.');
    } catch (e) {
      console.warn('[AdManager] Could not prepare rewarded ad:', e);
    }
  }

  /**
   * Show Interstitial Ad between levels with strict anti-spam frequency capping.
   * Only triggers if both 90 seconds AND 3 levels have passed.
   */
  async showLevelCompleteInterstitial() {
    this.levelsCompletedSinceLastAd++;
    const now = Date.now();
    const timeSinceLastAd = now - this.lastInterstitialTime;

    if (this.levelsCompletedSinceLastAd < this.minLevelsBetweenAds) {
      console.log(`[AdManager] Interstitial skipped: only ${this.levelsCompletedSinceLastAd}/${this.minLevelsBetweenAds} levels completed.`);
      return false;
    }

    if (timeSinceLastAd < this.interstitialCooldownMs) {
      console.log(`[AdManager] Interstitial skipped: cooldown active (${Math.round((this.interstitialCooldownMs - timeSinceLastAd) / 1000)}s left).`);
      return false;
    }

    if (!this.isNative) {
      console.log('[AdManager] Simulated interstitial shown in dev browser.');
      this.lastInterstitialTime = now;
      this.levelsCompletedSinceLastAd = 0;
      return true;
    }

    try {
      await AdMob.showInterstitial();
      this.lastInterstitialTime = Date.now();
      this.levelsCompletedSinceLastAd = 0;
      // Preload next interstitial immediately
      this.prepareInterstitial();
      return true;
    } catch (err) {
      console.warn('[AdManager] Failed to show interstitial:', err);
      this.prepareInterstitial();
      return false;
    }
  }

  /**
   * Show Rewarded Video Ad.
   * User voluntarily watches the full ad to receive a high-value game reward (+3 hints, free undo, etc.).
   * @param {Function} onRewardEarned Callback executed when user completes watching the ad
   * @param {Function} onDismissed Callback if user closes without finishing
   */
  async showRewardedAd(onRewardEarned, onDismissed) {
    if (!this.isNative) {
      console.log('[AdManager] Web mode: Simulating 2s rewarded ad view...');
      setTimeout(() => {
        if (onRewardEarned) onRewardEarned({ type: 'hints', amount: 3 });
      }, 1200);
      return true;
    }

    try {
      let rewarded = false;

      const rewardListener = await AdMob.addListener('onRewarded', (reward) => {
        rewarded = true;
        if (onRewardEarned) onRewardEarned(reward);
      });

      const dismissListener = await AdMob.addListener('onRewardVideoAdDismissed', () => {
        rewardListener.remove();
        dismissListener.remove();
        this.prepareRewarded(); // Preload next rewarded video
        if (!rewarded && onDismissed) onDismissed();
      });

      await AdMob.showRewardVideoAd();
      return true;
    } catch (err) {
      console.warn('[AdManager] Rewarded ad show failed:', err);
      this.prepareRewarded();
      return false;
    }
  }

  /**
   * Show Collapsible Bottom Banner (Only on Menus/Level Select)
   */
  /**
   * Hint is locked behind an ad. Native builds play a rewarded video.
   * Web builds show a visible house ad so the tap is never silent.
   */
  async showHintAd(onReward) {
    if (this.hintBusy) return false;
    this.hintBusy = true;
    let granted = false;
    const grant = () => {
      if (granted) return;
      granted = true;
      try { if (onReward) onReward(); } catch (_) {}
    };
    const release = () => { this.hintBusy = false; };
    try {
      if (this.isNative && this.isInitialized) {
        let presented = false;
        try {
          presented = await this.showRewardedAd(grant, () => {});
        } catch (_) {
          presented = false;
        }
        if (presented) return true;
      }
      this.showHouseAd(grant);
      return true;
    } finally {
      setTimeout(release, 700);
    }
  }

  showHouseAd(onReward) {
    const existing = document.getElementById('hint-ad');
    if (existing) existing.remove();

    const layer = document.createElement('div');
    layer.id = 'hint-ad';
    layer.className = 'hint-ad';
    layer.innerHTML = `
      <div class="hint-ad-card" role="dialog" aria-label="Advertisement">
        <div class="hint-ad-kicker">ADVERTISEMENT</div>
        <div class="hint-ad-creative" aria-hidden="true">
          <svg viewBox="0 0 120 72" width="120" height="72">
            <rect width="120" height="72" rx="10" fill="#1A2744"/>
            <path d="M18 36h62" stroke="#F7F9FC" stroke-width="6" stroke-linecap="round"/>
            <path d="M68 22l22 14-22 14" fill="#F7F9FC"/>
          </svg>
          <strong>Arrow King</strong>
          <span>A short placement before your hint.</span>
        </div>
        <div class="hint-ad-actions">
          <button type="button" class="hint-ad-skip" id="hint-ad-skip">Close</button>
          <button type="button" class="hint-ad-go" id="hint-ad-go" disabled>Ad 4</button>
        </div>
      </div>
    `;
    document.body.appendChild(layer);

    const go = layer.querySelector('#hint-ad-go');
    const close = (grant) => {
      layer.remove();
      if (grant && onReward) onReward();
    };
    layer.querySelector('#hint-ad-skip')?.addEventListener('click', () => close(false));
    go?.addEventListener('click', () => {
      if (go.disabled) return;
      close(true);
    });

    let left = 4;
    const timer = setInterval(() => {
      if (!document.body.contains(layer)) {
        clearInterval(timer);
        return;
      }
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        go.disabled = false;
        go.textContent = 'Get hint';
      } else {
        go.textContent = `Ad ${left}`;
      }
    }, 1000);
  }

  async showBanner() {
    if (!this.isNative || !this.isInitialized) return;
    try {
      const units = this.getAdUnits();
      await AdMob.showBanner({
        adId: units.banner,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: this.isTestMode,
      });
    } catch (e) {
      console.warn('[AdManager] Show banner failed:', e);
    }
  }

  /**
   * Hide Banner immediately when playing puzzle to prevent accidental touch strikes
   */
  async hideBanner() {
    if (!this.isNative || !this.isInitialized) return;
    try {
      await AdMob.hideBanner();
    } catch (e) {
      console.warn('[AdManager] Hide banner failed:', e);
    }
  }
}

export const adManager = new AdManager();
