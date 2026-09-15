/**
 * main.js
 * Game lifecycle manager, state transitions, progress persistence, and render loop.
 * Supports 6 categories (Beginner, Intermediate, Advanced, Expert, Master, Hacker) with 100 levels each.
 */

import { ParticleSystem } from './engine/ParticleSystem.js';
import { Renderer } from './engine/Renderer.js';
import { Board } from './engine/Board.js';
import { InputManager } from './engine/InputManager.js';
import { getLevel, CATEGORIES } from './levels/LevelData.js';
import { getLevelTheme } from './engine/LevelThemes.js';

import { IntroScreen } from './ui/IntroScreen.js';
import { ComplexitySelect } from './ui/ComplexitySelect.js';
import { LevelSelect } from './ui/LevelSelect.js';
import { HUD } from './ui/HUD.js';
import { VictoryModal } from './ui/VictoryModal.js';
import { CompleteModal } from './ui/CompleteModal.js';
import { SettingsModal } from './ui/SettingsModal.js';
import { soundManager } from './audio/SoundManager.js';

class GameApp {
  constructor() {
    this.currentCategory = 'beginner';
    this.currentLevelNum = 1;
    this.progress = this.loadProgress();

    // DOM containers
    this.canvas = document.getElementById('game-canvas');
    this.splashContainer = document.getElementById('splash-layer');
    this.introContainer = document.getElementById('intro-layer');
    this.complexityContainer = document.getElementById('complexity-select-layer');
    this.levelSelectContainer = document.getElementById('level-select-layer');
    this.hudContainer = document.getElementById('hud-layer');
    this.modalContainer = document.getElementById('modal-layer');

    // Engine subsystems
    this.particles = new ParticleSystem();
    this.renderer = new Renderer(this.canvas, this.particles);
    this.board = new Board(this.particles);
    this.input = new InputManager(this.canvas, this.board, this.renderer, this.particles);

    // Setup callbacks
    this.board.onVictoryCallback = (res) => this.handleVictory(res);
    this.board.onStarChangeCallback = (stars, lostStar) => this.hud.updateStars(stars, lostStar);
    this.board.onAvailablePathsCallback = (count) => this.hud.updateAvailablePaths(count);
    this.board.onRestartNotificationCallback = (msg) => this.hud.showRestartToast(msg);
    this.board.onTimerUpdateCallback = (timeRemaining, isTimed) => this.hud.updateTimer(timeRemaining, isTimed);
    this.board.onCollisionImpactCallback = (gx, gy, dir) => {
      const screen = this.renderer.gridToScreen(gx, gy);
      let angle = 0;
      if (dir === 'DOWN') angle = Math.PI / 2;
      else if (dir === 'LEFT') angle = Math.PI;
      else if (dir === 'UP') angle = -Math.PI / 2;
      this.particles.emitBounceSparks(screen.x, screen.y, angle);
    };

    // Initialize UI
    this.initUI();

    // Trigger Animated Opening Splash Screen with Royal Chime
    this.triggerSplashAnimation();

    // Start render loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  triggerSplashAnimation() {
    if (!this.splashContainer) return;

    // Play royal harmonic fanfare chime
    try {
      soundManager.playRoyalChime();
    } catch (_) {}

    // Allow user to tap to skip splash immediately
    const skipSplash = () => {
      if (this.splashDismissed) return;
      this.splashDismissed = true;
      this.splashContainer.classList.add('fade-out');
      setTimeout(() => {
        if (this.splashContainer) {
          this.splashContainer.style.display = 'none';
        }
      }, 850);
    };

    this.splashContainer.addEventListener('pointerdown', skipSplash, { once: true });

    // Smooth auto-dismiss after dramatic animated opening (1.8 seconds)
    setTimeout(() => {
      skipSplash();
    }, 1800);
  }

  loadProgress() {
    try {
      const dataStr = localStorage.getItem('arrow_shape_puzzle_save');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        return {
          unlocked: {
            beginner: 1,
            intermediate: 1,
            advanced: 1,
            expert: 1,
            master: 1,
            hacker: 1,
            ...(data.unlocked || {})
          },
          stars: data.stars || {},
          bestMoves: data.bestMoves || {}
        };
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
    return {
      unlocked: {
        beginner: 1,
        intermediate: 1,
        advanced: 1,
        expert: 1,
        master: 1,
        hacker: 1
      },
      stars: {},
      bestMoves: {}
    };
  }

  saveProgress() {
    try {
      localStorage.setItem('arrow_shape_puzzle_save', JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  initUI() {
    // 1. Intro Screen
    this.intro = new IntroScreen(
      this.introContainer,
      () => this.showComplexitySelect(),
      () => this.showComplexitySelect(),
      () => this.settingsModal.show()
    );

    // 2. Dedicated Complexity / Difficulty Select Screen
    this.complexitySelect = new ComplexitySelect(
      this.complexityContainer,
      (catId) => this.showLevelSelect(catId),
      () => this.showIntro()
    );

    // 3. Level Select Screen
    this.levelSelect = new LevelSelect(
      this.levelSelectContainer,
      (cat, lvl) => this.startLevel(cat, lvl),
      () => this.showComplexitySelect()
    );

    // 4. In-Game HUD
    this.hud = new HUD(this.hudContainer, {
      onBack: () => this.showLevelSelect(this.currentCategory),
      onPause: () => this.settingsModal.show(),
      onUndo: () => this.board.undo(),
      onHint: () => this.board.getHint(),
      onRestart: () => this.board.restart()
    });

    // 5. Modals
    this.victoryModal = new VictoryModal(this.modalContainer, {
      onNextLevel: () => this.handleNextLevel(),
      onReplay: () => this.board.restart(),
      onLevelSelect: () => this.showLevelSelect(this.currentCategory)
    });

    this.completeModal = new CompleteModal(this.modalContainer, {
      onLevelSelect: () => this.showComplexitySelect()
    });

    this.settingsModal = new SettingsModal(this.modalContainer, {
      onResume: () => {},
      onRestart: () => this.board.restart(),
      onLevelSelect: () => this.showLevelSelect(this.currentCategory)
    });

    // Initial state: show Intro
    this.showIntro();
  }

  showIntro() {
    soundManager.stopMusic();
    this.intro.show();
    this.complexitySelect.hide();
    this.levelSelect.hide();
    this.hud.hide();
    this.victoryModal.hide();
    this.completeModal.hide();
    this.settingsModal.hide();
    this.canvas.style.display = 'none';
  }

  showComplexitySelect() {
    soundManager.stopMusic();
    this.intro.hide();
    this.levelSelect.hide();
    this.hud.hide();
    this.victoryModal.hide();
    this.completeModal.hide();
    this.settingsModal.hide();
    this.canvas.style.display = 'none';
    this.complexitySelect.show(this.progress);
  }

  showLevelSelect(categoryOrNum) {
    soundManager.stopMusic();
    const cat = (typeof categoryOrNum === 'string') ? categoryOrNum : (this.currentCategory || 'beginner');
    this.currentCategory = cat;
    this.intro.hide();
    this.complexitySelect.hide();
    this.hud.hide();
    this.victoryModal.hide();
    this.completeModal.hide();
    this.settingsModal.hide();
    this.canvas.style.display = 'none';
    this.levelSelect.show(this.progress, cat);
  }

  startLevel(categoryOrNum = 'beginner', levelNum = 1) {
    let cat = 'beginner';
    let num = 1;

    if (typeof categoryOrNum === 'number') {
      cat = this.currentCategory || 'beginner';
      num = categoryOrNum;
    } else {
      cat = categoryOrNum;
      num = levelNum;
    }

    // Star requirement check: Expert (25★), Master (45★)
    const totalStars = Object.values(this.progress.stars || {}).reduce((sum, s) => sum + (typeof s === 'number' ? s : 0), 0);
    if (cat === 'expert' && totalStars < 25) {
      console.warn(`Expert level locked: requires 25 stars (currently ${totalStars})`);
      this.showComplexitySelect();
      return;
    }
    if (cat === 'master' && totalStars < 45) {
      console.warn(`Master level locked: requires 45 stars (currently ${totalStars})`);
      this.showComplexitySelect();
      return;
    }

    this.currentCategory = cat;
    this.currentLevelNum = Math.max(1, Math.min(100, num));

    this.intro.hide();
    this.complexitySelect.hide();
    this.levelSelect.hide();
    this.victoryModal.hide();
    this.completeModal.hide();
    this.settingsModal.hide();
    this.canvas.style.display = 'block';
    this.hud.show();

    soundManager.startMusic();

    this.renderer.resize();
    this.renderer.resetZoom();
    const levelData = getLevel(this.currentCategory, this.currentLevelNum);
    this.board.loadLevel(levelData);

    const theme = getLevelTheme(this.currentCategory, this.currentLevelNum);
    this.hud.updateLevelInfo(
      levelData.levelNumber,
      levelData.shapeName,
      levelData.categoryName,
      theme
    );
    this.hud.updateTimer(this.board.timeRemaining, this.board.isTimed);
    this.hud.updateAvailablePaths(this.board.currentlyUnblockedCount);
  }

  handleVictory(result) {
    // 1. Update progress
    const cat = result.category || this.currentCategory || 'beginner';
    const lvl = result.levelNumber;
    const starKey = `${cat}_${lvl}`;
    const prevStars = this.progress.stars[starKey] || 0;
    if (result.stars > prevStars) {
      this.progress.stars[starKey] = result.stars;
    }

    const prevBest = this.progress.bestMoves[starKey] || 999;
    if (result.moves < prevBest) {
      this.progress.bestMoves[starKey] = result.moves;
    }

    // Unlock next level in this category (up to 100)
    if (!this.progress.unlocked) this.progress.unlocked = {};
    const currentUnlocked = this.progress.unlocked[cat] || 1;
    if (lvl < 100 && currentUnlocked <= lvl) {
      this.progress.unlocked[cat] = lvl + 1;
    }
    this.saveProgress();

    // 2. Confetti explosion
    this.particles.emitVictoryConfetti(this.renderer.width, this.renderer.height);

    // 3. Show victory modal
    this.victoryModal.show(result);
  }

  handleNextLevel() {
    if (this.currentLevelNum >= 100) {
      // Completed all 100 levels in this category!
      const totalStars = Object.values(this.progress.stars).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
      this.completeModal.show(totalStars);
    } else {
      this.startLevel(this.currentCategory, this.currentLevelNum + 1);
    }
  }

  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Update game logic and particles
    this.particles.update(dt);
    this.board.update(dt);

    // Render frame
    this.renderer.render(this.board, dt);

    requestAnimationFrame(this.loop);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});

// Pause/stop audio when app is minimized, locked, or backgrounded
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    soundManager.stopMusic();
    if (soundManager.ctx && soundManager.ctx.state === 'running') {
      soundManager.ctx.suspend().catch(() => {});
    }
  }
});
