/**
 * SoundManager.js
 * High-quality procedural Web Audio API sound generator.
 * Zero external audio assets required. Fully responsive, offline-ready.
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.35;
    this.musicNode = null;
    this.isMusicPlaying = false;
    this.consecutiveLockIns = 0;

    this.loadSettings();
  }

  loadSettings() {
    try {
      const savedSfx = localStorage.getItem('arrow_puzzle_sfx');
      const savedMusic = localStorage.getItem('arrow_puzzle_music');
      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
      if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('arrow_puzzle_sfx', this.sfxEnabled);
      localStorage.setItem('arrow_puzzle_music', this.musicEnabled);
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SOUND EFFECTS ---

  /**
   * Crisp UI tap / button pop
   */
  playTap() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  /**
   * Arrow slide whoosh
   */
  playSlide() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1400, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, this.ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  /**
   * Arrow blocked / bounce thud
   */
  playBounce() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * Arrow locked into shape slot: pentatonic harmonic chime
   */
  playLockIn() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Pentatonic scale frequencies: C4, D4, E4, G4, A4, C5, D5, E5
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const freq = scale[this.consecutiveLockIns % scale.length];
    this.consecutiveLockIns++;

    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    oscHarmonic.start();
    osc.stop(this.ctx.currentTime + 0.45);
    oscHarmonic.stop(this.ctx.currentTime + 0.45);
  }

  resetCombo() {
    this.consecutiveLockIns = 0;
  }

  /**
   * Star chime pop
   */
  playStar(index = 0) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const freq = notes[index] || 523.25;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  /**
   * Star lost on wrong move / collision
   */
  playStarLoss() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  /**
   * Level Victory triumphant fanfare
   */
  playVictory() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Fast arpeggio: C4, G4, C5, E5, G5, C6
    const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.45, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  // --- AMBIENT NEON SYNTH MUSIC ---

  startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.scheduleAmbientMusic();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }

    // Instantly silence and disconnect all active chords
    if (this.activeMusicGains) {
      this.activeMusicGains.forEach(gain => {
        try {
          if (this.ctx) {
            gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);
          }
          setTimeout(() => gain.disconnect(), 80);
        } catch (_) {}
      });
      this.activeMusicGains = [];
    }

    if (this.activeMusicOscs) {
      this.activeMusicOscs.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (_) {}
      });
      this.activeMusicOscs = [];
    }
  }

  scheduleAmbientMusic() {
    if (!this.isMusicPlaying || !this.musicEnabled) return;

    this.activeMusicGains = this.activeMusicGains || [];
    this.activeMusicOscs = this.activeMusicOscs || [];

    // Relaxing dream chords: Am9 -> Fmaj7 -> Cmaj7 -> Gsus4
    const chords = [
      [220, 261.63, 329.63, 493.88], // Am9
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [196.0, 261.63, 293.66, 392.0]  // Gsus4
    ];

    let chordIdx = 0;
    const playChord = () => {
      if (!this.isMusicPlaying || !this.musicEnabled) return;
      this.initContext();
      if (!this.ctx) return;

      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      const chordGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(700, this.ctx.currentTime + 2.0);
      filter.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 4.0);

      chordGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      chordGain.gain.linearRampToValueAtTime(this.musicVolume * 0.25, this.ctx.currentTime + 1.2);
      chordGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.5);

      chordGain.connect(this.ctx.destination);
      filter.connect(chordGain);

      const currentOscs = [];
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(filter);
        osc.start();
        osc.stop(this.ctx.currentTime + 4.5);
        this.activeMusicOscs.push(osc);
        currentOscs.push(osc);
      });

      setTimeout(() => {
        if (this.activeMusicGains) {
          const gIdx = this.activeMusicGains.indexOf(chordGain);
          if (gIdx !== -1) this.activeMusicGains.splice(gIdx, 1);
        }
        if (this.activeMusicOscs) {
          currentOscs.forEach(o => {
            const oIdx = this.activeMusicOscs.indexOf(o);
            if (oIdx !== -1) this.activeMusicOscs.splice(oIdx, 1);
          });
        }
      }, 5000);

      this.ambientTimer = setTimeout(playChord, 4200);
    };

    playChord();
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    this.saveSettings();
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    this.saveSettings();
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleMute() {
    const isCurrentlyMuted = !this.sfxEnabled && !this.musicEnabled;
    if (isCurrentlyMuted) {
      this.sfxEnabled = true;
      this.musicEnabled = true;
      this.startMusic();
    } else {
      this.sfxEnabled = false;
      this.musicEnabled = false;
      this.stopMusic();
    }
    this.saveSettings();
    return !this.sfxEnabled; // true if muted
  }

  isMuted() {
    return !this.sfxEnabled && !this.musicEnabled;
  }
}

export const soundManager = new SoundManager();
