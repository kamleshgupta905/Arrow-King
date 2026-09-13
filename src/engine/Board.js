/**
 * Board.js
 * Core Arrow Maze engine: raycast exit checks, collision detection,
 * smooth slither escapes, forward-to-obstacle collision & recoil,
 * 3-star lives system with automatic restart on 0 stars, undo, and hints.
 */

import { soundManager } from '../audio/SoundManager.js';

export class Board {
  constructor(particleSystem) {
    this.particles = particleSystem;
    this.level = null;
    this.arrows = [];
    this.width = 16;
    this.height = 16;
    this.moveCount = 0;
    this.moveHistory = [];
    this.isVictory = false;
    this.isRestarting = false;
    this.hintArrowId = null;
    this.hoveredArrowId = null;

    this.stars = 3;
    this.wrongMoves = 0;

    // Timed mode (e.g. Hacker category)
    this.isTimed = false;
    this.timeLimit = 0;
    this.timeRemaining = 0;

    this.onVictoryCallback = null;
    this.onMoveCallback = null;
    this.onArrowsRemainingCallback = null;
    this.onAvailablePathsCallback = null;
    this.onStarChangeCallback = null;
    this.onRestartNotificationCallback = null;
    this.onCollisionImpactCallback = null;
    this.onTimerUpdateCallback = null;
  }

  loadLevel(levelData) {
    this.level = levelData;
    this.width = levelData.width || 18;
    this.height = levelData.height || 18;
    this.shapePoints = levelData.shapePoints || [];

    this.arrows = levelData.arrows.map(a => ({
      ...a,
      palette: a.palette || null,
      color: a.color || (a.palette ? a.palette.body : '#0084ff'),
      isEscaped: false,
      isEscaping: false,
      escapeProgress: 0,
      isColliding: false,
      collisionProgress: 0,
      collisionDist: 0,
      collisionDuration: 0.52,
      hasImpacted: false,
      impactShudder: 0,
      isHighlighted: false,
      highlightDuration: 0,
      blockerId: null
    }));

    this.moveCount = 0;
    this.moveHistory = [];
    this.isVictory = false;
    this.isRestarting = false;
    this.hintArrowId = null;
    this.hoveredArrowId = null;
    this.stars = 3;
    this.wrongMoves = 0;
    this.isTimed = !!levelData.isTimed;
    this.timeLimit = levelData.timeLimit || 0;
    this.timeRemaining = this.timeLimit;
    soundManager.resetCombo();

    if (this.onMoveCallback) {
      this.onMoveCallback(this.moveCount);
    }
    if (this.onStarChangeCallback) {
      this.onStarChangeCallback(this.stars, false);
    }
    if (this.onRestartNotificationCallback) {
      this.onRestartNotificationCallback(null);
    }
    if (this.onTimerUpdateCallback) {
      this.onTimerUpdateCallback(this.timeRemaining, this.isTimed);
    }
    this.notifyRemaining();
  }

  get remainingCount() {
    return this.arrows.filter(a => !a.isEscaped && !a.isEscaping).length;
  }

  get currentlyUnblockedCount() {
    const active = this.arrows.filter(a => !a.isEscaped);
    return active.filter(a => this.checkArrowCanEscape(a).canEscape).length;
  }

  notifyRemaining() {
    if (this.onArrowsRemainingCallback) {
      this.onArrowsRemainingCallback(this.remainingCount, this.arrows.length);
    }
    if (this.onAvailablePathsCallback) {
      this.onAvailablePathsCallback(this.currentlyUnblockedCount);
    }
  }

  restart() {
    if (!this.level) return;
    this.loadLevel(this.level);
    soundManager.playTap();
  }

  /**
   * Raycasts from arrow head along its direction to test if an escape route is clear.
   */
  checkArrowCanEscape(arrow) {
    const head = arrow.points[arrow.points.length - 1];
    const dx = arrow.dir === 'RIGHT' ? 1 : arrow.dir === 'LEFT' ? -1 : 0;
    const dy = arrow.dir === 'DOWN' ? 1 : arrow.dir === 'UP' ? -1 : 0;

    const activeArrows = this.arrows.filter(a => a.id !== arrow.id && !a.isEscaped);

    let nearestDist = Infinity;
    let nearestBlocker = null;

    for (const other of activeArrows) {
      for (let i = 0; i < other.points.length; i++) {
        const p = other.points[i];
        if (dx !== 0 && p.y === head.y) {
          const dist = (p.x - head.x) * dx;
          if (dist > 0 && dist < nearestDist) {
            nearestDist = dist;
            nearestBlocker = other;
          }
        } else if (dy !== 0 && p.x === head.x) {
          const dist = (p.y - head.y) * dy;
          if (dist > 0 && dist < nearestDist) {
            nearestDist = dist;
            nearestBlocker = other;
          }
        }

        if (i > 0) {
          const p1 = other.points[i - 1];
          const p2 = other.points[i];

          if (dx !== 0) { // Horizontal ray along y = head.y
            if (p1.x === p2.x) { // Other has vertical segment
              const minY = Math.min(p1.y, p2.y);
              const maxY = Math.max(p1.y, p2.y);
              if (head.y >= minY && head.y <= maxY) {
                const dist = (p1.x - head.x) * dx;
                if (dist > 0 && dist < nearestDist) {
                  nearestDist = dist;
                  nearestBlocker = other;
                }
              }
            } else if (p1.y === p2.y && p1.y === head.y) { // Collinear segment
              const minX = Math.min(p1.x, p2.x);
              const maxX = Math.max(p1.x, p2.x);
              const segClosest = dx > 0 ? minX : maxX;
              const dist = (segClosest - head.x) * dx;
              if (dist > 0 && dist < nearestDist) {
                nearestDist = dist;
                nearestBlocker = other;
              }
            }
          } else if (dy !== 0) { // Vertical ray along x = head.x
            if (p1.y === p2.y) { // Other has horizontal segment
              const minX = Math.min(p1.x, p2.x);
              const maxX = Math.max(p1.x, p2.x);
              if (head.x >= minX && head.x <= maxX) {
                const dist = (p1.y - head.y) * dy;
                if (dist > 0 && dist < nearestDist) {
                  nearestDist = dist;
                  nearestBlocker = other;
                }
              }
            } else if (p1.x === p2.x && p1.x === head.x) { // Collinear segment
              const minY = Math.min(p1.y, p2.y);
              const maxY = Math.max(p1.y, p2.y);
              const segClosest = dy > 0 ? minY : maxY;
              const dist = (segClosest - head.y) * dy;
              if (dist > 0 && dist < nearestDist) {
                nearestDist = dist;
                nearestBlocker = other;
              }
            }
          }
        }
      }
    }

    if (nearestBlocker !== null) {
      return { canEscape: false, blocker: nearestBlocker, dist: nearestDist };
    }

    return { canEscape: true };
  }

  /**
   * Handles player tap on an arrow.
   */
  tapArrow(arrowId) {
    if (this.isVictory || this.isRestarting) return false;

    // Ignore tap if any arrow is currently escaping or colliding
    const anyBusy = this.arrows.some(a => a.isEscaping || a.isColliding);
    if (anyBusy) return false;

    const arrow = this.arrows.find(a => a.id === arrowId);
    if (!arrow || arrow.isEscaped || arrow.isEscaping || arrow.isColliding) {
      return false;
    }

    this.hintArrowId = null;
    this.moveCount++;
    if (this.onMoveCallback) {
      this.onMoveCallback(this.moveCount);
    }

    const result = this.checkArrowCanEscape(arrow);

    if (result.canEscape) {
      // CLEAR PATH: Start slithering escape animation!
      arrow.isEscaping = true;
      arrow.escapeProgress = 0;
      arrow.isHighlighted = false;

      soundManager.playSlide();
      soundManager.playLockIn();

      // Record for Undo
      this.moveHistory.push({ arrowId: arrow.id });

      this.notifyRemaining();
      return true;
    } else {
      // OBSTRUCTED: Arrow slithers forward to collide with obstacle, then recoils back!
      const prevStars = this.stars;
      this.wrongMoves++;
      this.stars = Math.max(0, 3 - this.wrongMoves);

      if (this.onStarChangeCallback) {
        this.onStarChangeCallback(this.stars, this.stars < prevStars);
      }

      // Set up forward collision motion
      arrow.isColliding = true;
      arrow.collisionProgress = 0;
      // Collision distance to obstacle arrow (clamped nicely between 0.6 and 6 cells)
      arrow.collisionDist = Math.max(0.6, Math.min(result.dist, 6));
      arrow.collisionDuration = 0.52;
      arrow.hasImpacted = false;
      arrow.isHighlighted = true;
      arrow.blockerId = result.blocker ? result.blocker.id : null;

      soundManager.playStarLoss();

      return false;
    }
  }

  update(dt) {
    let anyEscaping = false;

    for (const arrow of this.arrows) {
      // 1. Escaping animation: smooth snake slither off board
      if (arrow.isEscaping) {
        anyEscaping = true;
        arrow.escapeProgress += dt / 0.55;

        if (arrow.escapeProgress >= 1.0) {
          arrow.escapeProgress = 1.0;
          arrow.isEscaping = false;
          arrow.isEscaped = true;
          this.checkVictory();
        } else {
          // Trail particles
          const head = arrow.points[arrow.points.length - 1];
          const dx = arrow.dir === 'RIGHT' ? 1 : arrow.dir === 'LEFT' ? -1 : 0;
          const dy = arrow.dir === 'DOWN' ? 1 : arrow.dir === 'UP' ? -1 : 0;
          const currentX = head.x + dx * arrow.escapeProgress * 6;
          const currentY = head.y + dy * arrow.escapeProgress * 6;
          if (this.particles) {
            this.particles.emitTrail(currentX, currentY);
          }
        }
      }

      // 2. Collision animation: slithers forward to obstacle, hits, and recoils back
      if (arrow.isColliding) {
        arrow.collisionProgress += dt / (arrow.collisionDuration || 0.52);

        // Impact moment at progress = 0.45
        if (arrow.collisionProgress >= 0.45 && !arrow.hasImpacted) {
          arrow.hasImpacted = true;
          soundManager.playBounce();

          // Trigger collision impact sparks at head + forward distance
          const head = arrow.points[arrow.points.length - 1];
          const dx = arrow.dir === 'RIGHT' ? 1 : arrow.dir === 'LEFT' ? -1 : 0;
          const dy = arrow.dir === 'DOWN' ? 1 : arrow.dir === 'UP' ? -1 : 0;
          const impactGridX = head.x + dx * arrow.collisionDist;
          const impactGridY = head.y + dy * arrow.collisionDist;

          if (this.onCollisionImpactCallback) {
            this.onCollisionImpactCallback(impactGridX, impactGridY, arrow.dir);
          }

          // Shudder the blocker arrow
          if (arrow.blockerId) {
            const blocker = this.arrows.find(a => a.id === arrow.blockerId);
            if (blocker) blocker.impactShudder = 0.2;
          }
        }

        // Finish collision return
        if (arrow.collisionProgress >= 1.0) {
          arrow.collisionProgress = 1.0;
          arrow.isColliding = false;
          arrow.isHighlighted = false;
          arrow.hasImpacted = false;
          arrow.blockerId = null;

          // Check if all 3 stars are exhausted: automatic restart!
          if (this.stars === 0 && !this.isRestarting) {
            this.triggerAutomaticRestart();
          }
        }
      }

      // 3. Shudder decay
      if (arrow.impactShudder > 0) {
        arrow.impactShudder = Math.max(0, arrow.impactShudder - dt);
      }
    }

    // 4. Timer Countdown for Hacker Mode
    if (this.isTimed && !this.isVictory && !this.isRestarting) {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.onTimerUpdateCallback) {
        this.onTimerUpdateCallback(this.timeRemaining, this.isTimed);
      }
      if (this.timeRemaining <= 0) {
        this.triggerTimeUpRestart();
      }
    }
  }

  /**
   * Automatic restart when 3 stars run out.
   */
  triggerAutomaticRestart() {
    if (this.isRestarting) return;
    this.isRestarting = true;

    if (this.onRestartNotificationCallback) {
      this.onRestartNotificationCallback('OUT OF STARS! RESTARTING LEVEL...');
    }

    setTimeout(() => {
      this.restart();
      this.isRestarting = false;
      if (this.onRestartNotificationCallback) {
        this.onRestartNotificationCallback(null);
      }
    }, 850);
  }

  /**
   * Automatic restart when Hacker timer expires.
   */
  triggerTimeUpRestart() {
    if (this.isRestarting) return;
    this.isRestarting = true;

    soundManager.playStarLoss();
    if (this.onRestartNotificationCallback) {
      this.onRestartNotificationCallback('TIME EXPIRED! RESTARTING LEVEL...');
    }

    setTimeout(() => {
      this.restart();
      this.isRestarting = false;
      if (this.onRestartNotificationCallback) {
        this.onRestartNotificationCallback(null);
      }
    }, 950);
  }

  undo() {
    if (this.isVictory || this.isRestarting || this.moveHistory.length === 0) return;

    const lastMove = this.moveHistory.pop();
    const arrow = this.arrows.find(a => a.id === lastMove.arrowId);

    if (arrow) {
      arrow.isEscaped = false;
      arrow.isEscaping = false;
      arrow.escapeProgress = 0;
      arrow.isColliding = false;
      arrow.isHighlighted = false;

      soundManager.playTap();
      soundManager.resetCombo();

      this.notifyRemaining();
      if (this.onMoveCallback) {
        this.onMoveCallback(this.moveCount);
      }
    }
  }

  getHint() {
    if (this.isVictory || this.isRestarting) return null;

    const active = this.arrows.filter(a => !a.isEscaped && !a.isEscaping && !a.isColliding);
    const candidate = active.find(a => this.checkArrowCanEscape(a).canEscape);

    if (candidate) {
      this.hintArrowId = candidate.id;
      candidate.isHighlighted = true;
      candidate.highlightDuration = 2.0;
      soundManager.playStar(0);
      return candidate.id;
    }
    return null;
  }

  checkVictory() {
    const allEscaped = this.arrows.every(a => a.isEscaped);
    if (allEscaped && !this.isVictory) {
      this.isVictory = true;
      soundManager.playVictory();

      setTimeout(() => {
        if (this.onVictoryCallback) {
          const stars = this.calculateStars();
          this.onVictoryCallback({
            category: this.level.category || 'beginner',
            levelNumber: this.level.levelNumber,
            shapeName: this.level.shapeName,
            tier: this.level.tier,
            moves: this.moveCount,
            stars,
            parMoves: this.level.parMoves
          });
        }
      }, 450);
    }
  }

  calculateStars() {
    return this.stars;
  }
}
