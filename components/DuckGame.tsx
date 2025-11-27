
import React, { useEffect, useRef } from 'react';
import kaplay, { KAPLAYCtx } from 'kaplay';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { getDuckCommentary } from '../services/geminiService';
import { 
  playJumpSound, 
  playCollectSound, 
  playDashSound, 
  playShieldSound, 
  playCrashSound, 
  playSmashSound,
  playPauseSound,
  resumeAudioContext 
} from '../services/audioService';

interface DuckGameProps {
  onScoreUpdate: (score: number) => void;
  onHealthUpdate: (health: number) => void;
  onGameOver: (score: number, commentary: string) => void;
}

const DuckGame: React.FC<DuckGameProps> = ({ onScoreUpdate, onHealthUpdate, onGameOver }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const kRef = useRef<KAPLAYCtx | null>(null);

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

    // --- Cleanup Phase ---
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
      background: [135, 206, 235], // Initial Sky Blue
      debug: false,
      global: false,
      touchToMouse: true,
      pixelDensity: 2,
    });

    kRef.current = k;

    k.setGravity(2400);

    // Focus canvas to ensure keyboard inputs work immediately
    k.canvas.focus();

    resumeAudioContext();
    k.canvas.addEventListener('click', resumeAudioContext);

    // --- Scene: Game ---
    k.scene("game", () => {
      let score = 0;
      let speed = 400;
      let lives = 3;
      let canDoubleJump = false;
      let isGameRunning = false; 
      let isPaused = false;
      let isInvulnerable = false;

      // Dash State
      let isDashing = false;
      let canDash = true;
      const DASH_DURATION = 0.3;
      const DASH_COOLDOWN = 2.0;
      let dashTimer = 0;

      // Shield State
      let hasShield = false;

      // Magnet State
      let hasMagnet = false;
      let magnetTimer = 0;

      // Biome Colors
      const biomes = [
          { score: 0, sky: [135, 206, 235], ground: [34, 139, 34], name: "FOREST" },
          { score: 1000, sky: [255, 200, 100], ground: [210, 180, 140], name: "DESERT" },
          { score: 2000, sky: [200, 200, 220], ground: [240, 250, 250], name: "SNOW" },
          { score: 3000, sky: [40, 0, 40], ground: [100, 20, 20], name: "VOLCANO" }
      ];
      let currentBiomeIndex = 0;

      // HUD Labels
      const scoreLabel = k.add([
        k.text("Score: 0", { size: 24 }),
        k.pos(24, 24),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(100),
      ]);

      // Pause UI Group
      const pauseGroup = k.add([
        k.fixed(),
        k.z(200),
        k.opacity(0) // Initially hidden
      ]);
      
      // Dark overlay
      pauseGroup.add([
        k.rect(GAME_WIDTH, GAME_HEIGHT),
        k.color(0,0,0),
        k.opacity(0.5),
      ]);
      
      // Pause Text
      pauseGroup.add([
        k.text("PAUSED", { size: 48 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.outline(4, k.rgb(0,0,0)),
      ]);
      
      // Subtext
      pauseGroup.add([
        k.text("Press P to Resume", { size: 24 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40),
        k.anchor("center"),
        k.color(200, 200, 200),
        k.outline(2, k.rgb(0,0,0)),
      ]);

      // Dash Bar UI
      k.add([
        k.rect(104, 14),
        k.pos(22, 60),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(99),
      ]);

      const dashBar = k.add([
        k.rect(100, 10),
        k.pos(24, 62),
        k.color(0, 255, 255),
        k.fixed(),
        k.z(100),
      ]);
      
      k.add([
          k.text("DASH", { size: 10 }),
          k.pos(24, 50),
          k.color(0,0,0),
          k.z(100)
      ]);

      // --- Countdown ---
      const startCountdown = async () => {
          const center = k.vec2(GAME_WIDTH / 2, GAME_HEIGHT / 2);
          const t3 = k.add([k.text("3", { size: 64 }), k.pos(center), k.anchor("center"), k.color(255,0,0), k.z(200)]);
          playCollectSound(); 
          await k.wait(0.6);
          k.destroy(t3);
          const t2 = k.add([k.text("2", { size: 64 }), k.pos(center), k.anchor("center"), k.color(255,165,0), k.z(200)]);
          playCollectSound();
          await k.wait(0.6);
          k.destroy(t2);
          const t1 = k.add([k.text("1", { size: 64 }), k.pos(center), k.anchor("center"), k.color(255,255,0), k.z(200)]);
          playCollectSound();
          await k.wait(0.6);
          k.destroy(t1);
          const go = k.add([k.text("GO!", { size: 80 }), k.pos(center), k.anchor("center"), k.color(0,255,0), k.z(200)]);
          playShieldSound(); 
          await k.wait(0.4);
          k.destroy(go);
          isGameRunning = true;
      };
      
      startCountdown();

      // --- Environment ---
      
      // Stars
      const stars: any[] = [];
      for(let i=0; i<50; i++) {
        const star = k.add([
            k.rect(2, 2),
            k.pos(k.rand(0, GAME_WIDTH), k.rand(0, GAME_HEIGHT - 50)),
            k.color(255, 255, 255),
            k.opacity(0), 
            k.fixed(),
            k.z(-20)
        ]);
        stars.push(star);
      }

      // Clouds
      const spawnCloud = () => {
        if (!isGameRunning || isPaused) { k.wait(0.5, spawnCloud); return; }
        k.add([
            k.rect(k.rand(40, 80), k.rand(20, 30)),
            k.pos(GAME_WIDTH, k.rand(20, 200)),
            k.move(k.LEFT, speed * 0.2),
            k.color(255, 255, 255),
            k.opacity(0.6),
            k.offscreen({ destroy: true, distance: 200 }),
            k.z(-10),
            "cloud"
        ]);
        k.wait(k.rand(1, 3), spawnCloud);
      };
      spawnCloud();

      // Physics Floor
      k.add([
        k.rect(GAME_WIDTH, 48),
        k.pos(0, GAME_HEIGHT - 48),
        k.area(),
        k.body({ isStatic: true }),
        k.opacity(0),
        "ground-physics",
      ]);

      // Visual Floor Spawner
      const spawnGround = (x: number) => {
          const b = biomes[currentBiomeIndex];
          const groundColor = k.rgb(b.ground[0], b.ground[1], b.ground[2]);
          const grassColor = k.rgb(b.ground[0] + 20, b.ground[1] + 20, b.ground[2] + 20);

          const ground = k.add([
             k.rect(16, 16),
             k.color(groundColor),
             k.pos(x, GAME_HEIGHT - 48),
             k.scale(4),
             k.move(k.LEFT, speed),
             k.offscreen({ destroy: true, distance: 100 }),
             k.z(0),
             "ground-visual"
         ]);
         
         ground.add([
             k.rect(16, 4),
             k.pos(0, 0),
             k.color(grassColor)
         ]);
      };

      for (let i = 0; i < GAME_WIDTH / 64 + 2; i++) {
         spawnGround(i * 64);
      }
      
      k.loop(64 / speed, () => {
          if (isGameRunning && !isPaused) spawnGround(GAME_WIDTH);
      });
      
      // --- Player ---
      const player = k.add([
        k.rect(16, 16),
        k.color(255, 215, 0),
        k.pos(80, GAME_HEIGHT - 200),
        k.area(),
        k.body(),
        k.scale(4), 
        k.anchor("center"),
        k.z(20),
        "player",
      ]);
      
      player.add([k.rect(2, 2), k.pos(2, -4), k.color(0, 0, 0), k.anchor("center")]);
      player.add([k.rect(4, 2), k.pos(6, 0), k.color(255, 69, 0), k.anchor("center")]);
      const wing = player.add([k.rect(4, 3), k.pos(-2, 2), k.color(218, 165, 32), k.anchor("center")]);

      // Shield Visuals
      const shieldRing = player.add([
          k.rect(28, 28),
          k.pos(0, 0),
          k.color(0, 200, 255),
          k.opacity(0),
          k.anchor("center"),
          k.outline(2, k.rgb(255, 255, 255)), 
          k.z(-1),
      ]);

      const shieldParticles: any[] = [];
      for(let i = 0; i < 4; i++) {
        shieldParticles.push(player.add([
            k.rect(5, 5),
            k.pos(0,0),
            k.color(180, 255, 255),
            k.opacity(0),
            k.anchor("center"),
            k.z(1) 
        ]));
      }

      // Magnet Visual (Aura)
      const magnetAura = player.add([
          k.circle(30),
          k.pos(0,0),
          k.color(255, 50, 50),
          k.opacity(0),
          k.anchor("center"),
          k.z(-2)
      ]);

      // --- FX ---
      const spawnDust = (pos: any) => {
          for (let i = 0; i < 4; i++) {
              k.add([
                  k.rect(4, 4),
                  k.pos(pos),
                  k.color(200, 200, 200),
                  k.move(k.choose([k.LEFT, k.RIGHT, k.UP]), k.rand(20, 60)),
                  k.opacity(1),
                  k.lifespan(0.3, { fade: 0.1 }),
                  k.z(15)
              ]);
          }
      };

      const spawnCrumbs = (pos: any) => {
          for (let i = 0; i < 6; i++) {
              k.add([
                  k.rect(3, 3),
                  k.pos(pos),
                  k.color(255, 165, 0),
                  k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(60, 100)),
                  k.opacity(1),
                  k.lifespan(0.4, { fade: 0.1 }),
                  k.z(25)
              ]);
          }
      };

      const spawnExplosion = (pos: any) => {
        for (let i = 0; i < 8; i++) {
             k.add([
                k.rect(5, 5),
                k.pos(pos),
                k.color(255, 0, 0),
                k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(100, 200)),
                k.lifespan(0.5, { fade: 0.1 }),
                k.opacity(1),
                k.z(30)
             ]);
        }
      };

      const showFloatingText = (txt: string, pos: any, color = k.rgb(255, 255, 0)) => {
          k.add([
              k.text(txt, { size: 20 }),
              k.pos(pos),
              k.color(color),
              k.move(k.UP, 50),
              k.opacity(1),
              k.lifespan(0.8, { fade: 0.5 }),
              k.z(100)
          ]);
      };

      // --- Controls ---
      const jump = () => {
        if (!isGameRunning || isPaused) return;
        resumeAudioContext();
        if (player.isGrounded()) {
          playJumpSound();
          player.jump(900);
          canDoubleJump = true;
          k.tween(k.vec2(4, 4), k.vec2(3, 5), 0.1, (val) => player.scale = val, k.easings.easeOutQuad)
           .then(() => k.tween(player.scale, k.vec2(4, 4), 0.2, (val) => player.scale = val, k.easings.easeOutBounce));
        } else if (canDoubleJump) {
            playJumpSound();
            player.jump(700);
            canDoubleJump = false;
            k.tween(0, 360, 0.3, (val) => player.angle = val, k.easings.easeOutQuad);
        }
      };

      // Variable Jump Height: Cut velocity if key released early
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

              const boom = k.add([
                k.circle(10),
                k.pos(player.pos),
                k.anchor("center"),
                k.color(200, 255, 255),
                k.opacity(0.8),
                k.scale(1),
                k.z(18),
                k.outline(3, k.rgb(255,255,255))
              ]);
              k.tween(1, 6, 0.3, (val) => boom.scale = k.vec2(val), k.easings.easeOutExpo);
              k.tween(0.8, 0, 0.3, (val) => boom.opacity = val, k.easings.linear).then(() => k.destroy(boom));

              const dashTween = k.tween(player.pos.x, player.pos.x + 50, 0.1, (val) => player.pos.x = val, k.easings.easeOutQuad);
              k.wait(DASH_DURATION, () => {
                  isDashing = false;
                  // Note: Removed the forced lerp back to 80 here, handled in Update loop
              });
          }
      };

      const togglePause = () => {
        if (!isGameRunning) return;
        isPaused = !isPaused;
        playPauseSound();
        
        // Handle Game Time and Physics
        k.timeScale = isPaused ? 0 : 1;
        player.paused = isPaused;
        
        // Handle UI
        pauseGroup.opacity = isPaused ? 1 : 0;
      };

      k.onKeyPress("space", jump);
      k.onKeyPress("up", jump);
      k.onMousePress(jump);
      
      // Release listeners for variable jump height
      k.onKeyRelease("space", shortJump);
      k.onKeyRelease("up", shortJump);
      k.onMouseRelease(shortJump);

      // Dash is now D only to separate from movement
      k.onKeyPress("d", dash);
      k.onKeyPress("p", togglePause);

      // --- Main Loop ---
      let time = 0;
      k.onUpdate(() => {
          if (!isGameRunning || isPaused) return;
          time += k.dt();
          
          // Air/Ground Control & Movement
          if (!isDashing) {
              let moving = false;
              const moveSpeed = 300;

              if (k.isKeyDown("left")) {
                  player.move(-moveSpeed, 0);
                  moving = true;
              } else if (k.isKeyDown("right")) {
                  player.move(moveSpeed, 0);
                  moving = true;
              }

              // Clamp X position
              if (player.pos.x < 20) player.pos.x = 20;
              if (player.pos.x > GAME_WIDTH / 2) player.pos.x = GAME_WIDTH / 2;

              // Drift back to standard position if not moving
              if (!moving && player.pos.x !== 80) {
                  player.pos.x = k.lerp(player.pos.x, 80, k.dt() * 5);
              }
          }
          
          // Dash Cooldown
          if (!canDash) {
              dashTimer += k.dt();
              const progress = Math.min(dashTimer / DASH_COOLDOWN, 1);
              dashBar.width = 100 * progress;
              dashBar.color = progress >= 1 ? k.rgb(0, 255, 255) : k.rgb(100, 100, 100);
              if (progress >= 1) canDash = true;
          }

          // Invulnerability Flash
          if (isInvulnerable) {
              player.opacity = Math.sin(time * 30) > 0 ? 0.5 : 1;
          } else {
              player.opacity = 1;
          }

          // Dash Visuals
          if (isDashing) {
              if (time % 0.03 < 0.05) { 
                  k.add([
                      k.rect(16, 16),
                      k.pos(player.pos),
                      k.scale(player.scale),
                      k.anchor("center"),
                      k.color(0, 255, 255),
                      k.opacity(0.4),
                      k.lifespan(0.15, { fade: 0.15 }),
                      k.z(19)
                  ]);
                  k.add([
                    k.rect(k.rand(10,30), 2),
                    k.pos(player.pos.x - k.rand(10,30), player.pos.y + k.rand(-10,10)),
                    k.color(255,255,255),
                    k.move(k.LEFT, 800),
                    k.opacity(1),
                    k.lifespan(0.1, {fade: 0.1}),
                    k.z(18)
                  ]);
              }
          }

          // Magnet Logic
          if (hasMagnet) {
             magnetTimer -= k.dt();
             magnetAura.opacity = 0.3 + Math.sin(time * 10) * 0.1;
             
             // Attract Bread
             k.get("bread").forEach((b: any) => {
                 if (player.pos.dist(b.pos) < 400) {
                     const dir = player.pos.sub(b.pos).unit();
                     b.move(dir.scale(600)); // Pull towards player
                 }
             });

             if (magnetTimer <= 0) {
                 hasMagnet = false;
                 magnetAura.opacity = 0;
             }
          }
          
          // Shield Visuals
          if (hasShield) {
              shieldRing.opacity = 0.6 + Math.sin(time * 15) * 0.2; 
              shieldRing.angle += k.dt() * 120; 
              shieldParticles.forEach((p, idx) => {
                  p.opacity = 1;
                  const radius = 22 + Math.sin(time * 10) * 2; 
                  const angle = time * 4 + (idx * (Math.PI / 2));
                  p.pos.x = Math.cos(angle) * radius;
                  p.pos.y = Math.sin(angle) * radius;
                  p.angle = angle * (180 / Math.PI);
              });
          } else {
              shieldRing.opacity = 0;
              shieldParticles.forEach(p => p.opacity = 0);
          }

          // Biome Colors
          const b = biomes[currentBiomeIndex];
          const tr = b.sky[0], tg = b.sky[1], tb = b.sky[2];
          
          const cycle = Math.sin(time * 0.1); 
          const factor = k.map(cycle, -1, 1, 0.4, 1); // brightness factor
          
          k.setBackground(tr * factor, tg * factor, tb * factor);

          // Star opacity (night)
          const starOp = k.map(cycle, 0.2, -0.8, 0, 0.8);
          stars.forEach(s => s.opacity = Math.max(0, starOp));

          // Player Animation
          if (player.isGrounded()) {
              if (!isDashing) player.angle = 0; 
              player.pos.y += Math.sin(time * 20) * 0.5;
              wing.pos.y = 2 + Math.sin(time * 30) * 1;
          } else {
              wing.pos.y = -2;
          }
      });
      
      player.onCollide("ground-physics", () => {
          spawnDust(player.pos.add(0, 32));
          k.shake(2);
          k.tween(k.vec2(5, 3), k.vec2(4, 4), 0.15, (val) => player.scale = val, k.easings.easeOutElastic);
      });

      player.onCollide("platform", () => {
          if (player.isGrounded()) {
             spawnDust(player.pos.add(0, 32));
             k.tween(k.vec2(5, 3), k.vec2(4, 4), 0.15, (val) => player.scale = val, k.easings.easeOutElastic);
          }
      });

      // --- Spawners ---
      const spawnBat = () => {
        const bat = k.add([
            k.rect(12, 10),
            k.color(147, 112, 219),
            k.area(),
            k.scale(3),
            k.pos(GAME_WIDTH, GAME_HEIGHT - k.rand(100, 220)),
            k.anchor("center"),
            k.move(k.LEFT, speed * 1.3),
            k.offscreen({ destroy: true, distance: 100 }),
            k.z(20),
            "bat",
            "danger"
        ]);
        bat.add([k.rect(6, 4), k.pos(-8, -4), k.color(75, 0, 130)]);
        bat.add([k.rect(6, 4), k.pos(2, -4), k.color(75, 0, 130)]);
        let t = 0;
        bat.onUpdate(() => {
            if (isPaused) return;
            t += k.dt() * 10;
            bat.pos.y += Math.sin(t) * 2;
        });
      };

      const spawnSlime = () => {
          const slime = k.add([
             k.rect(14, 10),
             k.color(50, 205, 50),
             k.area(),
             k.body(),
             k.scale(3.5),
             k.pos(GAME_WIDTH, GAME_HEIGHT - 60),
             k.anchor("center"),
             k.move(k.LEFT, speed),
             k.offscreen({ destroy: true, distance: 100 }),
             k.z(20),
             "slime",
             "danger"
          ]);
          slime.add([k.rect(2, 2), k.pos(-3, -2), k.color(0,0,0)]);
          slime.add([k.rect(2, 2), k.pos(3, -2), k.color(0,0,0)]);
          k.loop(1.5, () => {
             if (isGameRunning && !isPaused && slime.isGrounded()) {
                 slime.jump(500);
             }
          });
      };

      const spawnPlatform = () => {
          const yPos = GAME_HEIGHT - k.rand(100, 180);
          const platform = k.add([
              k.rect(64, 16),
              k.color(139, 69, 19),
              k.area(),
              k.body({ isStatic: true }),
              k.scale(2),
              k.pos(GAME_WIDTH, yPos),
              k.anchor("center"),
              k.move(k.LEFT, speed),
              k.offscreen({ destroy: true, distance: 100 }),
              k.z(10),
              "platform"
          ]);
          platform.add([k.rect(2, 2), k.pos(-28, -6), k.color(160, 82, 45)]);
          platform.add([k.rect(2, 2), k.pos(26, -6), k.color(160, 82, 45)]);
          if (k.rand() > 0.3) {
              k.add([
                  k.rect(10, 10),
                  k.color(255, 165, 0),
                  k.outline(2, k.rgb(139, 69, 19)),
                  k.area(), 
                  k.scale(3),
                  k.pos(GAME_WIDTH, yPos - 40),
                  k.anchor("center"),
                  k.move(k.LEFT, speed),
                  k.offscreen({ destroy: true, distance: 100 }),
                  k.z(10), 
                  "bread",
              ]);
          }
      };

      const spawnMagnet = () => {
          const magnet = k.add([
              k.rect(10, 10),
              k.color(255, 0, 0),
              k.area(),
              k.scale(3),
              k.pos(GAME_WIDTH, GAME_HEIGHT - 120),
              k.anchor("center"),
              k.move(k.LEFT, speed),
              k.offscreen({ destroy: true, distance: 100 }),
              k.z(15),
              "magnet-item"
          ]);
          // Magnet Visuals (Horseshoe U)
          magnet.add([k.rect(4, 10), k.pos(-3, 0), k.color(200, 200, 200), k.anchor("center")]); // Grey tips
          magnet.add([k.rect(4, 10), k.pos(3, 0), k.color(200, 200, 200), k.anchor("center")]);
      };

      const spawnEverything = () => {
        if (!isGameRunning || isPaused) { k.wait(1, spawnEverything); return; }

        const type = k.randi(0, 100); 
        
        if (type <= 20) {
            k.add([
              k.rect(12, 12),
              k.color(105, 105, 105),
              k.area(),
              k.scale(4), 
              k.pos(GAME_WIDTH, GAME_HEIGHT - 48),
              k.anchor("botleft"),
              k.move(k.LEFT, speed),
              k.offscreen({ destroy: true, distance: 100 }),
              k.z(10), 
              "obstacle",
              "danger"
            ]);
        }
        else if (type <= 35) {
            spawnSlime();
        }
        else if (type <= 50) {
             const drone = k.add([
                k.rect(12, 8),
                k.color(220, 20, 60),
                k.area(),
                k.scale(4),
                k.pos(GAME_WIDTH, GAME_HEIGHT - k.rand(100, 180)),
                k.anchor("center"),
                k.move(k.LEFT, speed * 1.2),
                k.offscreen({ destroy: true, distance: 100 }),
                k.z(20),
                "enemy",
                "danger"
             ]);
             drone.add([k.rect(8, 2), k.pos(0, -6), k.color(200, 200, 200), k.anchor("center")]);
        }
        else if (type <= 65) {
            spawnBat();
        }
        else if (type <= 75) {
            spawnPlatform();
        }
        else if (type <= 80) {
             const shieldItem = k.add([
                k.rect(8, 8),
                k.color(0, 191, 255),
                k.area(),
                k.scale(3),
                k.pos(GAME_WIDTH, GAME_HEIGHT - 120),
                k.anchor("center"),
                k.move(k.LEFT, speed),
                k.offscreen({ destroy: true, distance: 100 }),
                k.z(15),
                "shield-item"
             ]);
             shieldItem.add([k.rect(12, 12), k.color(0, 191, 255), k.opacity(0.3), k.anchor("center")]);
        }
        else if (type <= 83) {
            spawnMagnet();
        }
        else {
            const isAir = k.rand() > 0.5;
            const breadY = isAir ? GAME_HEIGHT - 220 : GAME_HEIGHT - 130;
            k.add([
                k.rect(10, 10),
                k.color(255, 165, 0),
                k.outline(2, k.rgb(139, 69, 19)),
                k.area(), 
                k.scale(3),
                k.pos(GAME_WIDTH + (isAir ? 0 : 150), breadY),
                k.anchor("center"),
                k.move(k.LEFT, speed),
                k.offscreen({ destroy: true, distance: 100 }),
                k.z(10), 
                "bread",
            ]);
        }

        const nextTime = k.rand(0.8, 1.8); 
        k.wait(nextTime, spawnEverything);
      };

      spawnEverything();

      // --- Collision Handling ---
      const handleDanger = async (obj: any) => {
          if (isDashing) {
              playSmashSound();
              k.destroy(obj);
              k.shake(5);
              spawnExplosion(obj.pos);
              score += 50;
              showFloatingText("SMASH!", player.pos);
          } else if (hasShield) {
              playSmashSound();
              k.destroy(obj);
              hasShield = false;
              k.shake(5);
              spawnExplosion(obj.pos);
              showFloatingText("BLOCKED!", player.pos, k.rgb(0, 200, 255));
          } else if (!isInvulnerable) {
              // Take Damage
              playCrashSound();
              lives -= 1;
              onHealthUpdateRef.current(lives);
              k.shake(10);
              
              if (lives > 0) {
                  // Invulnerability
                  isInvulnerable = true;
                  showFloatingText("OUCH!", player.pos, k.rgb(255, 0, 0));
                  // Destroy obstacle so we don't hit it again instantly
                  k.destroy(obj);
                  
                  k.wait(2, () => {
                      isInvulnerable = false;
                  });
              } else {
                  // Game Over
                  isGameRunning = false;
                  player.color = k.rgb(100, 100, 100);
                  const commentary = await getDuckCommentary(score);
                  onGameOverRef.current(score, commentary);
              }
          }
      };

      player.onCollide("danger", handleDanger);

      player.onCollide("bread", (b) => {
        playCollectSound();
        k.destroy(b);
        score += 100;
        scoreLabel.text = `Score: ${score}`;
        onScoreUpdateRef.current(score);
        k.shake(2);
        spawnCrumbs(b.pos);
        showFloatingText("+100", b.pos);
      });
      
      player.onCollide("shield-item", (s) => {
          playShieldSound();
          k.destroy(s);
          hasShield = true;
          score += 50;
          showFloatingText("SHIELD UP!", player.pos, k.rgb(0, 255, 255));
          k.shake(2);
      });

      player.onCollide("magnet-item", (m) => {
          playCollectSound();
          k.destroy(m);
          hasMagnet = true;
          magnetTimer = 10; // 10 seconds
          score += 50;
          showFloatingText("MAGNET!", player.pos, k.rgb(255, 0, 0));
          k.shake(2);
      });

      // Score Loop
      k.loop(0.1, () => {
          if (isGameRunning && !isPaused) {
              score += 1;
              scoreLabel.text = `Score: ${score}`;
              onScoreUpdateRef.current(score);
              
              // Biome Check
              for(let i = 0; i < biomes.length; i++) {
                  if (score >= biomes[i].score) {
                      if (currentBiomeIndex !== i) {
                          currentBiomeIndex = i;
                          showFloatingText(biomes[i].name + " ZONE", k.vec2(GAME_WIDTH/2, 100), k.rgb(255, 255, 255));
                      }
                  }
              }
          }
      });
      
      // Speed Loop
      k.loop(5, () => {
          if (isGameRunning && !isPaused) {
            speed += 15;
            showFloatingText("SPEED UP!", player.pos.sub(0, 40), k.rgb(255, 50, 50));
          }
      });
    });

    k.go("game");

    return () => {
        if (kRef.current) {
            kRef.current.quit();
            kRef.current = null;
        }
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
    };
  }, []);

  return (
    <div className="relative border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-slate-900 w-full max-w-2xl mx-auto">
        <div ref={containerRef} style={{ width: '100%', aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }} />
    </div>
  );
};

export default DuckGame;
