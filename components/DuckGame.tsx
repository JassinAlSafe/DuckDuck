import React, { useEffect, useRef } from 'react';
import kaplay, { KAPLAYCtx, GameObj } from 'kaplay';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER,
  DASH,
  SHIELD,
  MAGNET,
  HEALTH,
  DIFFICULTY,
  SCORING,
  SPAWNING,
  BIOMES,
  COLORS,
  Z_INDEX,
  ANIMATION,
  STARS,
} from '../constants';
import { DuckGameProps } from '../types';
import { getDuckCommentary } from '../services/geminiService';
import {
  playJumpSound,
  playCollectSound,
  playDashSound,
  playShieldSound,
  playCrashSound,
  playSmashSound,
  playPauseSound,
  resumeAudioContext,
  cleanupAudioContext
} from '../services/audioService';
import {
  spawnDust,
  spawnCrumbs,
  spawnExplosion,
  showFloatingText,
  createDashBoom,
  spawnDashTrail
} from '../game/effects';
import {
  spawnCloud,
  spawnGround,
  createPhysicsFloor,
  createStars,
  spawnRandomEntity,
  DifficultyContext
} from '../game/spawners';

// Global Kaplay instance tracker - persists across component remounts
let globalKaplayInstance: KAPLAYCtx | null = null;

const DuckGame: React.FC<DuckGameProps> = ({ onScoreUpdate, onHealthUpdate, onGameOver, skin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const kRef = useRef<KAPLAYCtx | null>(null);
  const initializedRef = useRef(false);
  const invulnerabilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for callbacks to avoid re-triggering useEffect when parent state changes
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onHealthUpdateRef = useRef(onHealthUpdate);
  const onGameOverRef = useRef(onGameOver);

  // Update refs whenever props change
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
    onHealthUpdateRef.current = onHealthUpdate;
    onGameOverRef.current = onGameOver;
  }, [onScoreUpdate, onHealthUpdate, onGameOver]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent multiple initializations within the same component instance
    if (initializedRef.current) return;
    initializedRef.current = true;

    // --- Cleanup Phase ---
    // Clean up any existing global Kaplay instance from previous component mounts
    if (globalKaplayInstance) {
      try {
        globalKaplayInstance.quit();
      } catch (e) {
        // Ignore errors during cleanup
      }
      globalKaplayInstance = null;
    }

    if (kRef.current) {
      kRef.current.quit();
      kRef.current = null;
    }
    containerRef.current.innerHTML = '';

    // --- Initialization Phase ---
    const k = kaplay({
      root: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      letterbox: true,
      background: [135, 206, 235],
      debug: false,
      global: false,
      touchToMouse: true,
      pixelDensity: 2,
    });

    kRef.current = k;
    globalKaplayInstance = k; // Store globally for cleanup on remount
    k.setGravity(PLAYER.GRAVITY);
    k.canvas.focus();

    resumeAudioContext();
    const audioClickHandler = () => resumeAudioContext();
    k.canvas.addEventListener('click', audioClickHandler);

    // Load sprites with error handling
    k.loadSprite("duck", "/assets/duck.png").catch(() => {
      console.warn("Failed to load duck sprite, sprite skins may not work correctly");
    });
    k.loadSprite("duck-flying", "/assets/duck-flying.png").catch(() => {
      console.warn("Failed to load duck-flying sprite, sprite skins may not work correctly");
    });
    k.loadSprite("frog", "/assets/frog.png").catch(() => {
      console.warn("Failed to load frog sprite, frog enemies will use fallback");
    });
    k.loadSprite("slime", "/assets/slime.png").catch(() => {
      console.warn("Failed to load slime sprite, slime enemies will use fallback");
    });

    // Track spawner cancellation
    let gameCleanedUp = false;

    // --- Scene: Game ---
    k.scene("game", () => {
      // =======================================================================
      // GAME STATE
      // =======================================================================
      let score = 0;
      let speed = DIFFICULTY.INITIAL_SPEED;
      let lives = HEALTH.MAX_LIVES;
      let canDoubleJump = false;
      let isGameRunning = false;
      let isPaused = false;
      let isInvulnerable = false;

      // Dash State
      let isDashing = false;
      let canDash = true;
      let dashTimer = 0;

      // Power-up State
      let hasShield = false;
      let hasMagnet = false;
      let magnetTimer = 0;

      // Spawner control
      let cloudSpawnerActive = true;
      let obstacleSpawnerActive = true;
      let spawnAccumulator = 0;
      let nextSpawnTime: number = k.rand(SPAWNING.MIN_INTERVAL, SPAWNING.MAX_INTERVAL);

      // Biome tracking
      let currentBiomeIndex = 0;

      // Animation time
      let time = 0;

      // =======================================================================
      // UI SETUP
      // =======================================================================
      const scoreLabel = k.add([
        k.text("Score: 0", { size: 24 }),
        k.pos(24, 24),
        k.color(COLORS.UI_TEXT[0], COLORS.UI_TEXT[1], COLORS.UI_TEXT[2]),
        k.fixed(),
        k.z(Z_INDEX.HUD),
      ]);

      // Pause UI - individual elements with their own opacity
      const pauseOverlay = k.add([
        k.rect(GAME_WIDTH, GAME_HEIGHT),
        k.pos(0, 0),
        k.color(COLORS.PAUSE_OVERLAY[0], COLORS.PAUSE_OVERLAY[1], COLORS.PAUSE_OVERLAY[2]),
        k.opacity(0),
        k.fixed(),
        k.z(Z_INDEX.PAUSE_OVERLAY),
      ]);

      const pauseText = k.add([
        k.text("PAUSED", { size: 48 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20),
        k.anchor("center"),
        k.color(COLORS.PAUSE_TEXT[0], COLORS.PAUSE_TEXT[1], COLORS.PAUSE_TEXT[2]),
        k.outline(4, k.rgb(0, 0, 0)),
        k.opacity(0),
        k.fixed(),
        k.z(Z_INDEX.PAUSE_OVERLAY + 1),
      ]);

      const pauseSubtext = k.add([
        k.text("Press P to Resume", { size: 24 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40),
        k.anchor("center"),
        k.color(200, 200, 200),
        k.outline(2, k.rgb(0, 0, 0)),
        k.opacity(0),
        k.fixed(),
        k.z(Z_INDEX.PAUSE_OVERLAY + 1),
      ]);

      // Dash Bar UI
      k.add([
        k.rect(104, 14),
        k.pos(22, 60),
        k.color(COLORS.UI_BACKGROUND[0], COLORS.UI_BACKGROUND[1], COLORS.UI_BACKGROUND[2]),
        k.fixed(),
        k.z(Z_INDEX.HUD - 1),
      ]);

      const dashBar = k.add([
        k.rect(100, 10),
        k.pos(24, 62),
        k.color(DASH.TRAIL_COLOR[0], DASH.TRAIL_COLOR[1], DASH.TRAIL_COLOR[2]),
        k.fixed(),
        k.z(Z_INDEX.HUD),
      ]);

      k.add([
        k.text("DASH", { size: 10 }),
        k.pos(24, 50),
        k.color(COLORS.UI_TEXT[0], COLORS.UI_TEXT[1], COLORS.UI_TEXT[2]),
        k.z(Z_INDEX.HUD)
      ]);

      // =======================================================================
      // COUNTDOWN
      // =======================================================================
      const startCountdown = async () => {
        const center = k.vec2(GAME_WIDTH / 2, GAME_HEIGHT / 2);

        const t3 = k.add([k.text("3", { size: 64 }), k.pos(center), k.anchor("center"), k.color(255, 0, 0), k.z(Z_INDEX.PAUSE_OVERLAY)]);
        playCollectSound();
        await k.wait(ANIMATION.COUNTDOWN_STEP);
        k.destroy(t3);

        const t2 = k.add([k.text("2", { size: 64 }), k.pos(center), k.anchor("center"), k.color(255, 165, 0), k.z(Z_INDEX.PAUSE_OVERLAY)]);
        playCollectSound();
        await k.wait(ANIMATION.COUNTDOWN_STEP);
        k.destroy(t2);

        const t1 = k.add([k.text("1", { size: 64 }), k.pos(center), k.anchor("center"), k.color(255, 255, 0), k.z(Z_INDEX.PAUSE_OVERLAY)]);
        playCollectSound();
        await k.wait(ANIMATION.COUNTDOWN_STEP);
        k.destroy(t1);

        const go = k.add([k.text("GO!", { size: 80 }), k.pos(center), k.anchor("center"), k.color(0, 255, 0), k.z(Z_INDEX.PAUSE_OVERLAY)]);
        playShieldSound();
        await k.wait(ANIMATION.COUNTDOWN_GO);
        k.destroy(go);

        isGameRunning = true;
      };

      startCountdown();

      // =======================================================================
      // ENVIRONMENT SETUP
      // =======================================================================
      const stars = createStars(k, STARS.COUNT);

      // Cloud spawning - use accumulator for dynamic intervals
      let cloudSpawnAccumulator = 0;
      let nextCloudSpawnTime = k.rand(SPAWNING.CLOUD_MIN_INTERVAL, SPAWNING.CLOUD_MAX_INTERVAL);
      k.onUpdate(() => {
        if (gameCleanedUp || !cloudSpawnerActive || !isGameRunning || isPaused) return;
        cloudSpawnAccumulator += k.dt();
        if (cloudSpawnAccumulator >= nextCloudSpawnTime) {
          cloudSpawnAccumulator = 0;
          nextCloudSpawnTime = k.rand(SPAWNING.CLOUD_MIN_INTERVAL, SPAWNING.CLOUD_MAX_INTERVAL);
          spawnCloud(k, speed);
        }
      });

      // Physics floor
      createPhysicsFloor(k);

      // Initial ground tiles
      for (let i = 0; i < GAME_WIDTH / 64 + 2; i++) {
        spawnGround(k, i * 64, speed, BIOMES[currentBiomeIndex]);
      }

      // Ground spawning - use accumulator to adapt to changing speed
      let groundSpawnAccumulator = 0;
      k.onUpdate(() => {
        if (!isGameRunning || isPaused) return;
        groundSpawnAccumulator += k.dt();
        // Calculate interval based on current speed (distance / speed = time)
        const groundSpawnInterval = 64 / speed;
        if (groundSpawnAccumulator >= groundSpawnInterval) {
          groundSpawnAccumulator = 0;
          spawnGround(k, GAME_WIDTH, speed, BIOMES[currentBiomeIndex]);
        }
      });

      // =======================================================================
      // PLAYER SETUP
      // =======================================================================
      // Check if using sprite skin or color-based skin
      const useSprite = skin.isSprite === true;
      const baseScale = useSprite ? 0.15 : PLAYER.SCALE;

      const player = k.add([
        useSprite ? k.sprite("duck") : k.rect(PLAYER.SIZE, PLAYER.SIZE),
        ...(useSprite ? [] : [k.color(skin.bodyColor[0], skin.bodyColor[1], skin.bodyColor[2])]),
        k.pos(PLAYER.START_X, PLAYER.START_Y),
        k.area({ scale: 0.8 }), // Slightly smaller hitbox for sprite
        k.body(),
        k.scale(baseScale),
        k.anchor("center"),
        k.rotate(0),
        k.opacity(1),
        k.z(Z_INDEX.PLAYER),
        "player",
      ]);

      // Track current sprite state for animation
      let currentSpriteState: 'idle' | 'flying' = 'idle';

      // Player features - only add for non-sprite skins
      if (!useSprite) {
        player.add([k.rect(2, 2), k.pos(2, -4), k.color(skin.eyeColor[0], skin.eyeColor[1], skin.eyeColor[2]), k.anchor("center")]);
        player.add([k.rect(4, 2), k.pos(6, 0), k.color(skin.beakColor[0], skin.beakColor[1], skin.beakColor[2]), k.anchor("center")]);
      }
      const wing = useSprite ? null : player.add([k.rect(4, 3), k.pos(-2, 2), k.color(skin.wingColor[0], skin.wingColor[1], skin.wingColor[2]), k.anchor("center")]);

      // Shield visuals
      const shieldRing = player.add([
        k.rect(SHIELD.RING_SIZE, SHIELD.RING_SIZE),
        k.pos(0, 0),
        k.color(SHIELD.COLOR[0], SHIELD.COLOR[1], SHIELD.COLOR[2]),
        k.opacity(0),
        k.anchor("center"),
        k.outline(2, k.rgb(255, 255, 255)),
        k.rotate(0),
        k.z(-1),
      ]);

      const shieldParticles: GameObj[] = [];
      for (let i = 0; i < SHIELD.PARTICLE_COUNT; i++) {
        shieldParticles.push(player.add([
          k.rect(5, 5),
          k.pos(0, 0),
          k.color(SHIELD.PARTICLE_COLOR[0], SHIELD.PARTICLE_COLOR[1], SHIELD.PARTICLE_COLOR[2]),
          k.opacity(0),
          k.anchor("center"),
          k.rotate(0),
          k.z(1)
        ]));
      }

      // Magnet visual
      const magnetAura = player.add([
        k.circle(MAGNET.AURA_RADIUS),
        k.pos(0, 0),
        k.color(MAGNET.AURA_COLOR[0], MAGNET.AURA_COLOR[1], MAGNET.AURA_COLOR[2]),
        k.opacity(0),
        k.anchor("center"),
        k.z(-2)
      ]);

      // =======================================================================
      // CONTROLS
      // =======================================================================
      const jump = () => {
        if (!isGameRunning || isPaused) return;
        resumeAudioContext();

        if (player.isGrounded()) {
          playJumpSound();
          player.jump(PLAYER.JUMP_FORCE);
          canDoubleJump = true;
          if (useSprite) {
            k.tween(k.vec2(baseScale, baseScale), k.vec2(baseScale * 0.8, baseScale * 1.2), ANIMATION.JUMP_SQUASH_DURATION, (val) => player.scale = val, k.easings.easeOutQuad)
              .then(() => k.tween(player.scale, k.vec2(baseScale, baseScale), ANIMATION.JUMP_STRETCH_DURATION, (val) => player.scale = val, k.easings.easeOutBounce));
          } else {
            k.tween(k.vec2(4, 4), k.vec2(3, 5), ANIMATION.JUMP_SQUASH_DURATION, (val) => player.scale = val, k.easings.easeOutQuad)
              .then(() => k.tween(player.scale, k.vec2(4, 4), ANIMATION.JUMP_STRETCH_DURATION, (val) => player.scale = val, k.easings.easeOutBounce));
          }
        } else if (canDoubleJump) {
          playJumpSound();
          player.jump(PLAYER.DOUBLE_JUMP_FORCE);
          canDoubleJump = false;
          k.tween(0, 360, ANIMATION.DOUBLE_JUMP_SPIN_DURATION, (val) => player.angle = val, k.easings.easeOutQuad);
        }
      };

      const shortJump = () => {
        if (!isGameRunning || isPaused) return;
        if (player.vel.y < 0) {
          player.vel.y *= 0.5;
        }
      };

      const dash = () => {
        if (!isGameRunning || isPaused) return;
        resumeAudioContext();

        if (canDash && !isDashing) {
          playDashSound();
          isDashing = true;
          canDash = false;
          dashTimer = 0;
          k.shake(5);

          createDashBoom(k, player.pos);
          // Clamp dash destination to MAX_X boundary
          const dashTarget = Math.min(player.pos.x + DASH.DISTANCE, PLAYER.MAX_X);
          k.tween(player.pos.x, dashTarget, 0.1, (val) => player.pos.x = val, k.easings.easeOutQuad);

          k.wait(DASH.DURATION, () => {
            isDashing = false;
          });
        }
      };

      // Tags for pauseable game objects
      const PAUSEABLE_TAGS = ["ground-visual", "cloud", "obstacle", "danger", "bread", "platform", "shield-item", "magnet-item", "heart-item", "frog"] as const;

      const togglePause = () => {
        if (!isGameRunning) return;
        isPaused = !isPaused;
        playPauseSound();

        // Pause/unpause player
        player.paused = isPaused;

        // Pause/unpause all moving game objects in a single iteration
        PAUSEABLE_TAGS.forEach(tag => {
          k.get(tag).forEach((obj: GameObj) => obj.paused = isPaused);
        });

        // Handle UI - set opacity for all pause elements
        pauseOverlay.opacity = isPaused ? 0.5 : 0;
        pauseText.opacity = isPaused ? 1 : 0;
        pauseSubtext.opacity = isPaused ? 1 : 0;
      };

      // Key bindings
      k.onKeyPress("space", jump);
      k.onKeyPress("up", jump);
      k.onMousePress(jump);
      k.onKeyRelease("space", shortJump);
      k.onKeyRelease("up", shortJump);
      k.onMouseRelease(shortJump);
      k.onKeyPress("d", dash);
      k.onKeyPress("p", togglePause);

      // =======================================================================
      // MAIN UPDATE LOOP
      // =======================================================================
      k.onUpdate(() => {
        if (!isGameRunning || isPaused) return;

        time += k.dt();
        if (time > ANIMATION.TIME_WRAP) time -= ANIMATION.TIME_WRAP;

        // Movement
        if (!isDashing) {
          let moving = false;

          if (k.isKeyDown("left")) {
            player.move(-PLAYER.MOVE_SPEED, 0);
            moving = true;
          } else if (k.isKeyDown("right")) {
            player.move(PLAYER.MOVE_SPEED, 0);
            moving = true;
          }

          // Clamp position
          if (player.pos.x < PLAYER.MIN_X) player.pos.x = PLAYER.MIN_X;
          if (player.pos.x > PLAYER.MAX_X) player.pos.x = PLAYER.MAX_X;

          // Drift back to default position
          if (!moving && player.pos.x !== PLAYER.START_X) {
            player.pos.x = k.lerp(player.pos.x, PLAYER.START_X, k.dt() * 5);
          }
        }

        // Dash cooldown
        if (!canDash) {
          dashTimer += k.dt();
          const progress = Math.min(dashTimer / DASH.COOLDOWN, 1);
          dashBar.width = 100 * progress;
          dashBar.color = progress >= 1 ? k.rgb(DASH.TRAIL_COLOR[0], DASH.TRAIL_COLOR[1], DASH.TRAIL_COLOR[2]) : k.rgb(100, 100, 100);
          if (progress >= 1) canDash = true;
        }

        // Invulnerability flash
        player.opacity = isInvulnerable ? (Math.sin(time * ANIMATION.INVULNERABILITY_FLASH_SPEED) > 0 ? 0.5 : 1) : 1;

        // Dash visuals
        if (isDashing && time % 0.03 < 0.05) {
          spawnDashTrail(k, player.pos, player.scale);
        }

        // Magnet logic
        if (hasMagnet) {
          magnetTimer = Math.max(0, magnetTimer - k.dt());
          magnetAura.opacity = 0.3 + Math.sin(time * ANIMATION.MAGNET_PULSE_SPEED) * 0.1;

          k.get("bread").forEach((b: GameObj) => {
            const dist = player.pos.dist(b.pos);
            if (dist < MAGNET.RANGE) {
              const dir = player.pos.sub(b.pos).unit();
              // Pull strength increases as bread gets closer (stronger pull at close range)
              const pullStrength = MAGNET.PULL_SPEED * (1 - dist / MAGNET.RANGE) + 200;
              b.move(dir.scale(pullStrength * k.dt() * 60));
            }
          });

          if (magnetTimer === 0) {
            hasMagnet = false;
            magnetAura.opacity = 0;
          }
        }

        // Shield visuals
        if (hasShield) {
          shieldRing.opacity = 0.6 + Math.sin(time * ANIMATION.SHIELD_PULSE_SPEED) * 0.2;
          shieldRing.angle += k.dt() * ANIMATION.SHIELD_ROTATION_SPEED;
          shieldParticles.forEach((p, idx) => {
            p.opacity = 1;
            const radius = SHIELD.ORBIT_RADIUS + Math.sin(time * ANIMATION.MAGNET_PULSE_SPEED) * 2;
            const angle = time * ANIMATION.SHIELD_ORBIT_SPEED + (idx * (Math.PI / 2));
            p.pos.x = Math.cos(angle) * radius;
            p.pos.y = Math.sin(angle) * radius;
            p.angle = angle * (180 / Math.PI);
          });
        } else {
          shieldRing.opacity = 0;
          shieldParticles.forEach(p => p.opacity = 0);
        }

        // Biome colors
        const biome = BIOMES[currentBiomeIndex];
        const cycle = Math.sin(time * ANIMATION.BIOME_CYCLE_SPEED);
        const factor = k.map(cycle, -1, 1, 0.4, 1);
        k.setBackground(biome.sky[0] * factor, biome.sky[1] * factor, biome.sky[2] * factor);

        // Star opacity
        const starOp = k.map(cycle, 0.2, -0.8, 0, 0.8);
        stars.forEach(s => s.opacity = Math.max(0, starOp));

        // Player animation
        if (player.isGrounded()) {
          if (!isDashing) player.angle = 0;
          player.pos.y += Math.sin(time * ANIMATION.GROUND_BOB_SPEED) * ANIMATION.GROUND_BOB_AMPLITUDE;

          // Switch to idle sprite when grounded
          if (useSprite && currentSpriteState !== 'idle') {
            player.use(k.sprite("duck"));
            currentSpriteState = 'idle';
          }

          if (wing) {
            wing.pos.y = 2 + Math.sin(time * ANIMATION.WING_FLAP_SPEED) * ANIMATION.WING_FLAP_AMPLITUDE;
          }
        } else {
          // Switch to flying sprite when in air
          if (useSprite && currentSpriteState !== 'flying') {
            player.use(k.sprite("duck-flying"));
            currentSpriteState = 'flying';
          }

          if (wing) {
            wing.pos.y = -2;
          }
        }
      });

      // =======================================================================
      // COLLISION HANDLERS
      // =======================================================================
      player.onCollide("ground-physics", () => {
        spawnDust(k, player.pos.add(0, 32));
        k.shake(2);
        if (useSprite) {
          // Subtle squash for sprite
          k.tween(k.vec2(baseScale * 1.2, baseScale * 0.8), k.vec2(baseScale, baseScale), ANIMATION.LAND_SQUASH_DURATION, (val) => player.scale = val, k.easings.easeOutElastic);
        } else {
          k.tween(k.vec2(5, 3), k.vec2(4, 4), ANIMATION.LAND_SQUASH_DURATION, (val) => player.scale = val, k.easings.easeOutElastic);
        }
      });

      player.onCollide("platform", () => {
        if (player.isGrounded()) {
          spawnDust(k, player.pos.add(0, 32));
          if (useSprite) {
            k.tween(k.vec2(baseScale * 1.2, baseScale * 0.8), k.vec2(baseScale, baseScale), ANIMATION.LAND_SQUASH_DURATION, (val) => player.scale = val, k.easings.easeOutElastic);
          } else {
            k.tween(k.vec2(5, 3), k.vec2(4, 4), ANIMATION.LAND_SQUASH_DURATION, (val) => player.scale = val, k.easings.easeOutElastic);
          }
        }
      });

      const handleDanger = async (obj: GameObj) => {
        if (isDashing) {
          playSmashSound();
          k.destroy(obj);
          k.shake(5);
          spawnExplosion(k, obj.pos);
          score += SCORING.ENEMY_SMASH;
          showFloatingText(k, "SMASH!", player.pos);
        } else if (hasShield) {
          playSmashSound();
          k.destroy(obj);
          hasShield = false;
          k.shake(5);
          spawnExplosion(k, obj.pos);
          showFloatingText(k, "BLOCKED!", player.pos, k.rgb(0, 200, 255));
        } else if (!isInvulnerable) {
          playCrashSound();
          lives = Math.max(0, lives - 1) as number;
          onHealthUpdateRef.current(lives);
          k.shake(10);

          if (lives > 0) {
            if (invulnerabilityTimerRef.current) clearTimeout(invulnerabilityTimerRef.current);

            isInvulnerable = true;
            showFloatingText(k, "OUCH!", player.pos, k.rgb(255, 0, 0));
            k.destroy(obj);

            invulnerabilityTimerRef.current = setTimeout(() => {
              isInvulnerable = false;
              invulnerabilityTimerRef.current = null;
            }, HEALTH.INVULNERABILITY_DURATION * 1000);
          } else {
            // Clear invulnerability timer on game over
            if (invulnerabilityTimerRef.current) {
              clearTimeout(invulnerabilityTimerRef.current);
              invulnerabilityTimerRef.current = null;
            }
            isGameRunning = false;
            obstacleSpawnerActive = false;
            cloudSpawnerActive = false;
            // Use opacity for death visual instead of color (works for both sprites and shapes)
            player.opacity = 0.5;
            const commentary = await getDuckCommentary(score);
            onGameOverRef.current(score, commentary);
          }
        }
      };

      player.onCollide("danger", handleDanger);

      player.onCollide("bread", (b) => {
        playCollectSound();
        k.destroy(b);
        score += SCORING.BREAD_COLLECT;
        scoreLabel.text = `Score: ${score}`;
        onScoreUpdateRef.current(score);
        k.shake(2);
        spawnCrumbs(k, b.pos);
        showFloatingText(k, "+100", b.pos);
      });

      player.onCollide("shield-item", (s) => {
        playShieldSound();
        k.destroy(s);
        hasShield = true;
        score += SCORING.SHIELD_COLLECT;
        scoreLabel.text = `Score: ${score}`;
        onScoreUpdateRef.current(score);
        showFloatingText(k, "SHIELD UP!", player.pos, k.rgb(0, 255, 255));
        k.shake(2);
      });

      player.onCollide("magnet-item", (m) => {
        playCollectSound();
        k.destroy(m);
        hasMagnet = true;
        magnetTimer = MAGNET.DURATION;
        score += SCORING.MAGNET_COLLECT;
        scoreLabel.text = `Score: ${score}`;
        onScoreUpdateRef.current(score);
        showFloatingText(k, "MAGNET!", player.pos, k.rgb(255, 0, 0));
        k.shake(2);
      });

      player.onCollide("heart-item", (h) => {
        if (lives < HEALTH.MAX_LIVES) {
          playShieldSound();
          k.destroy(h);
          lives = Math.min(lives + 1, HEALTH.MAX_LIVES) as number;
          onHealthUpdateRef.current(lives);
          showFloatingText(k, "+1 LIFE!", player.pos, k.rgb(255, 80, 120));
          k.shake(3);
        } else {
          // Already at max health, convert to points
          playCollectSound();
          k.destroy(h);
          score += 200;
          scoreLabel.text = `Score: ${score}`;
          onScoreUpdateRef.current(score);
          showFloatingText(k, "+200", player.pos, k.rgb(255, 80, 120));
          k.shake(2);
        }
      });

      // =======================================================================
      // DIFFICULTY CALCULATION
      // =======================================================================
      const getDifficultyProgress = (): number => {
        // Returns 0-1 based on score progress toward max difficulty
        return Math.min(score / DIFFICULTY.DIFFICULTY_SCALE_SCORE, 1);
      };

      const getDifficultyContext = (): DifficultyContext => {
        const progress = getDifficultyProgress();
        return {
          // Enemy speed scales from 1.0 to ENEMY_SPEED_MULTIPLIER_MAX
          enemySpeedMultiplier: 1 + progress * (DIFFICULTY.ENEMY_SPEED_MULTIPLIER_MAX - 1),
          // Power-up spawn chance scales from 1.0 down to POWERUP_REDUCTION_MAX
          powerupSpawnChance: 1 - progress * (1 - DIFFICULTY.POWERUP_REDUCTION_MAX),
        };
      };

      const getSpawnInterval = (): number => {
        const progress = getDifficultyProgress();
        // Spawn interval decreases (faster spawning) as difficulty increases
        const minInterval = SPAWNING.MIN_INTERVAL / DIFFICULTY.SPAWN_RATE_MULTIPLIER_MAX;
        const maxInterval = SPAWNING.MAX_INTERVAL / DIFFICULTY.SPAWN_RATE_MULTIPLIER_MAX;
        const baseMin = k.lerp(SPAWNING.MIN_INTERVAL, minInterval, progress);
        const baseMax = k.lerp(SPAWNING.MAX_INTERVAL, maxInterval, progress);
        return k.rand(baseMin, baseMax);
      };

      // =======================================================================
      // SPAWNING LOOP
      // =======================================================================
      k.onUpdate(() => {
        if (!isGameRunning || isPaused || gameCleanedUp) return;

        spawnAccumulator += k.dt();
        if (spawnAccumulator >= nextSpawnTime) {
          spawnRandomEntity(
            k,
            speed,
            () => isGameRunning,
            () => isPaused,
            getDifficultyContext()
          );
          spawnAccumulator = 0;
          nextSpawnTime = getSpawnInterval();
        }
      });

      // =======================================================================
      // SCORE & DIFFICULTY LOOPS
      // =======================================================================
      let scoreAccumulator = 0;
      let lastDifficultyMilestone = 0;
      k.onUpdate(() => {
        if (!isGameRunning || isPaused) return;

        scoreAccumulator += k.dt();
        if (scoreAccumulator >= SCORING.UPDATE_INTERVAL) {
          score += SCORING.POINTS_PER_INTERVAL;
          scoreLabel.text = `Score: ${score}`;
          onScoreUpdateRef.current(score);
          scoreAccumulator = 0;

          // Biome check
          for (let i = 0; i < BIOMES.length; i++) {
            if (score >= BIOMES[i].score && currentBiomeIndex !== i) {
              currentBiomeIndex = i;
              showFloatingText(k, BIOMES[i].name + " ZONE", k.vec2(GAME_WIDTH / 2, 100), k.rgb(255, 255, 255));
            }
          }

          // Difficulty milestone notifications (every 1000 points)
          const currentMilestone = Math.floor(score / 1000);
          if (currentMilestone > lastDifficultyMilestone && currentMilestone <= 5) {
            lastDifficultyMilestone = currentMilestone;
            const diffPercent = Math.round(getDifficultyProgress() * 100);
            if (diffPercent < 100) {
              showFloatingText(k, `HARDER! ${diffPercent}%`, k.vec2(GAME_WIDTH / 2, 140), k.rgb(255, 100, 100));
            } else {
              showFloatingText(k, "MAX DIFFICULTY!", k.vec2(GAME_WIDTH / 2, 140), k.rgb(255, 0, 0));
            }
          }
        }
      });

      k.loop(DIFFICULTY.SPEED_INCREASE_INTERVAL, () => {
        if (gameCleanedUp) return;
        if (isGameRunning && !isPaused && speed < DIFFICULTY.MAX_SPEED) {
          speed = Math.min(speed + DIFFICULTY.SPEED_INCREMENT, DIFFICULTY.MAX_SPEED) as number;
          showFloatingText(k, "SPEED UP!", player.pos.sub(0, 40), k.rgb(COLORS.SPEED_UP_TEXT[0], COLORS.SPEED_UP_TEXT[1], COLORS.SPEED_UP_TEXT[2]));
        }
      });
    });

    k.go("game");

    // =======================================================================
    // CLEANUP
    // =======================================================================
    return () => {
      gameCleanedUp = true;
      k.canvas.removeEventListener('click', audioClickHandler);
      cleanupAudioContext();

      // Clear invulnerability timer
      if (invulnerabilityTimerRef.current) {
        clearTimeout(invulnerabilityTimerRef.current);
        invulnerabilityTimerRef.current = null;
      }

      // Quit the Kaplay instance
      try {
        k.quit();
      } catch (e) {
        // Ignore errors during cleanup
      }

      // Clear all references
      kRef.current = null;
      globalKaplayInstance = null;

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      // Reset initialized flag so the game can be restarted
      initializedRef.current = false;
    };
  }, []);

  return (
    <div className="relative border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-slate-900 w-full max-w-4xl mx-auto">
      <div ref={containerRef} style={{ width: '100%', aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }} />
    </div>
  );
};

export default DuckGame;
