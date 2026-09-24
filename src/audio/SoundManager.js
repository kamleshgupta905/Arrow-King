/**
 * SoundManager.js
 * Royal Court score + jewel-like effects.
 *
 * The old bed was four raw sine chords — it read as a ringtone.
 * This one is a slow C-major chamber loop: hummed choir pad, harp,
 * gold bell, and a soft root. No clicky metronome. Phone speakers
 * stay in the 180–2000 Hz pocket where the harmony can actually bloom.
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.sfxVolume = 0.62;
    this.musicVolume = 0.58;
    this.isMusicPlaying = false;
    this.musicMode = 'menu';
    this.musicGen = 0;
    this.consecutiveLockIns = 0;
    this.tempo = 72;
    this.graphReady = false;

    this.progression = [
      { root: 261.63, tones: [261.63, 329.63, 392.0, 493.88] },
      { root: 329.63, tones: [329.63, 392.0, 493.88, 587.33] },
      { root: 220.0, tones: [220.0, 261.63, 329.63, 392.0] },
      { root: 174.61, tones: [174.61, 220.0, 261.63, 329.63] }
    ];
    this.voiceShift = 1;
    this.levelVoices = [
      [{ root: 196.0, tones: [196.0, 246.94, 293.66, 392.0] }, { root: 220.0, tones: [220.0, 277.18, 329.63, 440.0] }, { root: 174.61, tones: [174.61, 220.0, 261.63, 349.23] }, { root: 146.83, tones: [146.83, 196.0, 220.0, 293.66] }],
      [{ root: 233.08, tones: [233.08, 293.66, 349.23, 466.16] }, { root: 196.0, tones: [196.0, 246.94, 311.13, 392.0] }, { root: 174.61, tones: [174.61, 233.08, 277.18, 349.23] }, { root: 155.56, tones: [155.56, 196.0, 233.08, 311.13] }],
      [{ root: 261.63, tones: [261.63, 311.13, 392.0, 466.16] }, { root: 293.66, tones: [293.66, 349.23, 440.0, 523.25] }, { root: 196.0, tones: [196.0, 246.94, 293.66, 392.0] }, { root: 174.61, tones: [174.61, 220.0, 261.63, 349.23] }],
      [{ root: 146.83, tones: [146.83, 185.0, 220.0, 293.66] }, { root: 164.81, tones: [164.81, 207.65, 246.94, 329.63] }, { root: 196.0, tones: [196.0, 246.94, 293.66, 392.0] }, { root: 130.81, tones: [130.81, 164.81, 196.0, 261.63] }],
      [{ root: 220.0, tones: [220.0, 277.18, 329.63, 415.3] }, { root: 246.94, tones: [246.94, 311.13, 369.99, 493.88] }, { root: 185.0, tones: [185.0, 233.08, 277.18, 369.99] }, { root: 164.81, tones: [164.81, 207.65, 246.94, 329.63] }],
      [{ root: 174.61, tones: [174.61, 220.0, 261.63, 349.23] }, { root: 196.0, tones: [196.0, 246.94, 293.66, 392.0] }, { root: 146.83, tones: [146.83, 196.0, 220.0, 293.66] }, { root: 130.81, tones: [130.81, 174.61, 196.0, 261.63] }],
      [{ root: 277.18, tones: [277.18, 349.23, 415.3, 554.37] }, { root: 233.08, tones: [233.08, 293.66, 349.23, 466.16] }, { root: 196.0, tones: [196.0, 246.94, 311.13, 392.0] }, { root: 155.56, tones: [155.56, 196.0, 233.08, 311.13] }],
      [{ root: 164.81, tones: [164.81, 207.65, 246.94, 329.63] }, { root: 185.0, tones: [185.0, 233.08, 277.18, 369.99] }, { root: 146.83, tones: [146.83, 185.0, 220.0, 293.66] }, { root: 123.47, tones: [123.47, 164.81, 185.0, 246.94] }]
    ];

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
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  ensureGraph() {
    if (this.graphReady || !this.ctx) return;

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;

    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.knee.value = 18;
    this.comp.ratio.value = 2.2;
    this.comp.attack.value = 0.03;
    this.comp.release.value = 0.28;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.84;

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 1;

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 1600;
    this.padFilter.Q.value = 0.45;

    this.reverb = this.makeReverb(2.8);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.46;

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.055;
    lfoGain.gain.value = 280;
    lfo.connect(lfoGain);
    lfoGain.connect(this.padFilter.frequency);
    lfo.start();
    this.filterLfo = lfo;

    this.padFilter.connect(this.musicBus);
    this.musicBus.connect(this.comp);
    this.musicBus.connect(this.reverb);
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.comp);
    this.comp.connect(this.analyser);
    this.analyser.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.graphReady = true;
  }

  makeReverb(seconds) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        const early = i % Math.floor(rate * 0.017) === 0 ? 0.35 : 0;
        data[i] = ((Math.random() * 2 - 1) * Math.pow(1 - t, 2.6) * 0.55) + early * (1 - t);
      }
    }
    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  getLevels(count = 16) {
    if (!this.analyser) return null;
    const bins = this.analyser.frequencyBinCount;
    if (!this.freq || this.freq.length !== bins) this.freq = new Uint8Array(bins);
    this.analyser.getByteFrequencyData(this.freq);
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const idx = Math.min(bins - 1, Math.floor((i / count) * bins));
      out.push(this.freq[idx] / 255);
    }
    return out;
  }

  tone({ freq, type = 'sine', start, dur, peak, attack = 0.02, dest, detune = 0 }) {
    if (!this.ctx || !dest || peak < 0.0002 || dur <= 0.02) return;
    const t = Math.max(start, this.ctx.currentTime + 0.004);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (detune) osc.detune.setValueAtTime(detune, t);
    const attackTime = Math.min(attack, dur * 0.45);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  voice(freq, start, dur, peak, dest) {
    if (!this.ctx || !dest) return;
    const t = Math.max(start, this.ctx.currentTime + 0.004);
    const osc = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const vib = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    harm.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    harm.frequency.setValueAtTime(freq * 2, t);
    vib.frequency.setValueAtTime(4.2 + Math.random() * 0.6, t);
    vibGain.gain.setValueAtTime(freq * 0.0035, t);
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);

    const harmGain = this.ctx.createGain();
    harmGain.gain.value = 0.22;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    harm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(dest);

    osc.start(t);
    harm.start(t);
    vib.start(t);
    const end = t + dur + 0.05;
    osc.stop(end);
    harm.stop(end);
    vib.stop(end);
  }

  // --- EFFECTS ---

  playTap() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({
      freq: 740,
      start: t,
      dur: 0.07,
      peak: this.sfxVolume * 0.16,
      attack: 0.005,
      dest: this.ctx.destination
    });
    this.tone({
      freq: 1180,
      start: t,
      dur: 0.045,
      peak: this.sfxVolume * 0.05,
      attack: 0.004,
      dest: this.ctx.destination
    });
  }

  playSlide() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.16);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.linearRampToValueAtTime(1800, t + 0.16);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(this.sfxVolume * 0.16, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  playBounce() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({
      freq: 196,
      start: t,
      dur: 0.16,
      peak: this.sfxVolume * 0.28,
      attack: 0.005,
      dest: this.ctx.destination
    });
    this.tone({
      freq: 98,
      start: t,
      dur: 0.2,
      peak: this.sfxVolume * 0.16,
      attack: 0.008,
      dest: this.ctx.destination
    });
  }

  playLockIn() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = scale[this.consecutiveLockIns % scale.length];
    this.consecutiveLockIns += 1;
    const t = this.ctx.currentTime;
    this.tone({
      freq,
      start: t,
      dur: 0.55,
      peak: this.sfxVolume * 0.2,
      attack: 0.008,
      dest: this.ctx.destination
    });
    this.tone({
      freq: freq * 2,
      start: t,
      dur: 0.38,
      peak: this.sfxVolume * 0.05,
      attack: 0.008,
      dest: this.ctx.destination
    });
  }

  resetCombo() {
    this.consecutiveLockIns = 0;
  }

  playStar(index = 0) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99];
    const freq = notes[index] || 523.25;
    const t = this.ctx.currentTime;
    this.tone({
      freq,
      start: t,
      dur: 0.48,
      peak: this.sfxVolume * 0.22,
      attack: 0.01,
      dest: this.ctx.destination
    });
    this.tone({
      freq: freq * 2,
      start: t + 0.02,
      dur: 0.32,
      peak: this.sfxVolume * 0.05,
      attack: 0.01,
      dest: this.ctx.destination
    });
  }

  playStarLoss() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392, t);
    osc.frequency.exponentialRampToValueAtTime(196, t + 0.22);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(this.sfxVolume * 0.22, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  playVictory() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      this.tone({
        freq,
        type: 'triangle',
        start: t + idx * 0.09,
        dur: 0.7,
        peak: this.sfxVolume * 0.16,
        attack: 0.015,
        dest: this.ctx.destination
      });
    });
    this.tone({
      freq: 130.81,
      start: t,
      dur: 1.4,
      peak: this.sfxVolume * 0.12,
      attack: 0.05,
      dest: this.ctx.destination
    });
  }

  playRoyalChime() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.tone({
        freq,
        start: t + idx * 0.12,
        dur: 1.7,
        peak: this.sfxVolume * 0.16,
        attack: 0.02,
        dest: this.ctx.destination
      });
      this.tone({
        freq: freq * 2.003,
        start: t + idx * 0.12,
        dur: 1.1,
        peak: this.sfxVolume * 0.035,
        attack: 0.02,
        dest: this.ctx.destination
      });
    });
    this.tone({
      freq: 196.0,
      start: t,
      dur: 2.3,
      peak: this.sfxVolume * 0.1,
      attack: 0.08,
      dest: this.ctx.destination
    });
  }

  // --- SCORE ---

  setLevelVoice(levelNumber = 1, shapeName = '', category = '') {
    const seed = Math.abs((Number(levelNumber) * 31) + (String(category).charCodeAt(0) || 1) * 13) % this.levelVoices.length;
    this.progression = this.levelVoices[seed];
    this.tempo = [66, 74, 82, 90, 70, 78, 62, 86][seed];
    this.voiceShift = 0.94 + ((Number(levelNumber) + seed) % 7) * 0.02;
    if (this.isMusicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
    this.speakLevel(shapeName, levelNumber, seed);
  }

  speakLevel(shapeName, levelNumber, seed) {
    if (!this.musicEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    const label = String(shapeName || 'Shape').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
    const utterance = new SpeechSynthesisUtterance(`${label}. Level ${levelNumber}.`);
    utterance.pitch = 0.82 + (seed % 5) * 0.07;
    utterance.rate = 0.88 + (seed % 3) * 0.05;
    utterance.volume = 0.85;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) utterance.voice = voices[(seed + Number(levelNumber)) % voices.length];
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  setMusicMode(mode) {
    this.musicMode = mode || 'menu';
  }

  startMenuMusic() {
    this.musicMode = 'menu';
    this._beginScore();
  }

  startMusic() {
    if (this.musicMode !== 'rush') this.musicMode = 'game';
    this._beginScore();
  }

  _beginScore() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.ensureGraph();
    this.isMusicPlaying = true;
    this.musicGen += 1;
    const gen = this.musicGen;

    this.scoreGain = this.ctx.createGain();
    this.harpGain = this.ctx.createGain();
    this.scoreGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.harpGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.scoreGain.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + 0.9);
    this.harpGain.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + 0.7);
    this.scoreGain.connect(this.padFilter);
    this.harpGain.connect(this.musicBus);
    this.startAir(this.scoreGain);

    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.12;

    const pump = () => {
      if (gen !== this.musicGen || !this.isMusicPlaying) return;
      try {
        this.pumpSchedule();
      } catch (err) {
        console.warn('Score step skipped', err);
      }
      this.ambientTimer = setTimeout(pump, 90);
    };
    pump();
  }

  startAir(dest) {
    if (!this.airBuffer) {
      const seconds = 2;
      this.airBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * seconds, this.ctx.sampleRate);
      const data = this.airBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.airBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.012;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start();
    this.airSource = src;
  }

  pumpSchedule() {
    if (!this.ctx) return;
    if (this.nextNoteTime < this.ctx.currentTime - 0.05) {
      this.nextNoteTime = this.ctx.currentTime + 0.06;
    }
    const horizon = this.ctx.currentTime + 0.28;
    const eighth = 60 / this.tempo / 2;
    while (this.nextNoteTime < horizon) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += eighth;
      this.step = (this.step + 1) % 64;
    }
  }

  scheduleStep(step, time) {
    const chord = this.progression[Math.floor(step / 16) % this.progression.length];
    const shift = this.voiceShift || 1;
    const local = step % 16;
    const level = this.musicVolume;

    if (local === 0) {
      chord.tones.forEach((freq) => {
        this.voice(freq * shift, time, eighthSpan(this.tempo, 17), level * 0.055, this.scoreGain);
      });
      this.tone({
        freq: (chord.root / 2) * shift,
        start: time,
        dur: 2.6,
        peak: level * 0.08,
        attack: 0.06,
        dest: this.scoreGain
      });
      this.tone({
        freq: chord.tones[2] * 2,
        start: time + 0.04,
        dur: 2.2,
        peak: level * 0.03,
        attack: 0.015,
        dest: this.harpGain
      });
      this.tone({
        freq: chord.tones[2] * 4.01,
        start: time + 0.04,
        dur: 1.3,
        peak: level * 0.006,
        attack: 0.01,
        dest: this.harpGain
      });
    }

    const rush = this.musicMode === 'rush';
    const harpOn = rush ? local % 2 === 0 : [0, 3, 6, 8, 11, 14].includes(local);
    if (harpOn) {
      const toneIndex = [0, 2, 1, 3, 2, 1, 0, 2][Math.floor(step / (rush ? 2 : 3)) % 8];
      const freq = chord.tones[toneIndex % chord.tones.length] * (local % 8 === 0 ? 2 : 1) * shift;
      this.tone({
        freq,
        start: time,
        dur: rush ? 0.42 : 0.95,
        peak: level * (rush ? 0.03 : 0.04),
        attack: 0.008,
        dest: this.harpGain
      });
      this.tone({
        freq: freq * 2,
        start: time,
        dur: 0.4,
        peak: level * 0.008,
        attack: 0.006,
        dest: this.harpGain
      });
    }
  }

  fadeNode(node) {
    if (!node || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(Math.max(0.0001, node.gain.value), now);
      node.gain.linearRampToValueAtTime(0.0001, now + 0.45);
    } catch (_) {}
    setTimeout(() => {
      try { node.disconnect(); } catch (_) {}
    }, 700);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    try { window.speechSynthesis?.cancel(); } catch (_) {}
    this.musicGen += 1;
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    this.fadeNode(this.scoreGain);
    this.fadeNode(this.harpGain);
    if (this.airSource) {
      try { this.airSource.stop(); } catch (_) {}
      this.airSource = null;
    }
    this.scoreGain = null;
    this.harpGain = null;
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
      if (this.musicMode === 'game' || this.musicMode === 'rush') this.startMusic();
      else this.startMenuMusic();
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
      if (this.musicMode === 'game' || this.musicMode === 'rush') this.startMusic();
      else this.startMenuMusic();
    } else {
      this.sfxEnabled = false;
      this.musicEnabled = false;
      this.stopMusic();
    }
    this.saveSettings();
    return !this.sfxEnabled;
  }

  isMuted() {
    return !this.sfxEnabled && !this.musicEnabled;
  }
}

function eighthSpan(tempo, eighths) {
  return (60 / tempo / 2) * eighths;
}

export const soundManager = new SoundManager();
