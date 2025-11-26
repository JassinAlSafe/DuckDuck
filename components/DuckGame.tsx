import React, { useEffect, useRef } from 'react';
import kaplay, { KAPLAYCtx } from 'kaplay';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { getDuckCommentary } from '../services/geminiService';

interface DuckGameProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number, commentary: string) => void;
  setGameActive: (active: boolean) => void;
}

const DuckGame: React.FC<DuckGameProps> = ({ onScoreUpdate, onGameOver, setGameActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const kRef = useRef<KAPLAYCtx | null>(null);

  useEffect(() => {
    // Safety check: If the container is missing, abort.
    if (!containerRef.current) return;

    // Cleanup existing game if it exists (Strict Mode handling)
    if (kRef.current) {
      kRef.current.quit();
      kRef.current = null;
    }
    // Ensure container is empty before appending new canvas
    containerRef.current.innerHTML = '';

    // Initialize Kaplay
    const k = kaplay({
      root: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      letterbox: true, // Scales game to fit container
      background: [135, 206, 235], // Sky blue
      debug: false,
      global: false, // Do not bind to window global
      touchToMouse: true, // Ensure mobile taps register as clicks
      pixelDensity: 2, // Retain sharpness
    });

    kRef.current = k;

    // --- Physics Setup ---
    k.setGravity(2400);

    // --- Scene Definitions ---

    // Start Screen
    k.scene("start", () => {
      setGameActive(false);
      
      // Title
      k.add([
        k.text("DUCK 8-BIT DASH", { size: 48 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60),
        k.anchor("center"),
        k.color(255, 223, 0), // Golden Yellow
        k.outline(4, k.rgb(0, 0, 0)),
        k.z(100),
      ]);

      // Subtitle
      k.add([
        k.text("Press SPACE to Start", { size: 24 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.z(100),
      ]);
      
      // Touch instruction
      const blinkText = k.add([
         k.text("Click or Tap Screen", { size: 16 }),
         k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60),
         k.anchor("center"),
         k.color(200, 200, 200),
         k.opacity(1),
         k.z(100),
      ]);
      
      k.loop(0.8, () => {
          blinkText.opacity = blinkText.opacity === 0 ? 1 : 0;
      });

      // Input Handling
      const startGame = () => {
          k.go("game");
      };

      k.onKeyPress("space", startGame);
      k.onMousePress(startGame);
    });

    // Main Game Loop
    k.scene("game", () => {
      setGameActive(true);
      let score = 0;
      let speed = 400;
      let canDoubleJump = false;

      // HUD
      const scoreLabel = k.add([
        k.text("Score: 0", { size: 24 }),
        k.pos(24, 24),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(100),
      ]);

      // --- Cloud Spawner (Parallax) ---
      const spawnCloud = () => {
        k.add([
            k.rect(k.rand(40, 80), k.rand(20, 30)),
            k.pos(GAME_WIDTH, k.rand(20, 200)),
            k.move(k.LEFT, speed * 0.2), // Move slower than foreground
            k.color(255, 255, 255),
            k.opacity(0.6),
            k.offscreen({ destroy: true, distance: 200 }),
            k.z(-10), // Behind everything
            "cloud"
        ]);
        k.wait(k.rand(1, 3), spawnCloud);
      };
      spawnCloud();


      // Physics Floor (Invisible) - Keeps the player from falling
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
          // Main Ground Block
          const ground = k.add([
             k.rect(16, 16),
             k.color(34, 139, 34), // Forest Green
             k.pos(x, GAME_HEIGHT - 48),
             k.scale(4), // 16x4 = 64
             k.move(k.LEFT, speed),
             k.offscreen({ destroy: true, distance: 100 }),
             k.z(0), // Layer 0 (Back)
             "ground-visual"
         ]);
         
         // Add some grass detail (lighter green strip at top)
         ground.add([
             k.rect(16, 4),
             k.pos(0, 0),
             k.color(50, 205, 50) // Lime Green
         ]);
      };

      // Initial Ground Fill
      for (let i = 0; i < GAME_WIDTH / 64 + 2; i++) {
         spawnGround(i * 64);
      }
      
      // Continuous Ground Loop
      k.loop(64 / speed, () => {
          spawnGround(GAME_WIDTH);
      });
      
      // --- Player (Duck) ---
      const player = k.add([
        k.rect(16, 16),
        k.color(255, 215, 0), // Gold/Yellow
        k.pos(80, GAME_HEIGHT - 200),
        k.area(),
        k.body(),
        k.scale(4), 
        k.anchor("center"),
        k.z(20), // Layer 20 (Front)
        "player",
      ]);
      
      // Duck Eye
      player.add([
          k.rect(2, 2),
          k.pos(2, -4), // Relative to center
          k.color(0, 0, 0),
          k.anchor("center")
      ]);
      
      // Duck Beak
      player.add([
          k.rect(4, 2),
          k.pos(6, 0), // Stick out right
          k.color(255, 69, 0), // Red-Orange
          k.anchor("center")
      ]);
      
      // Duck Wing (Saved to variable for animation)
      const wing = player.add([
          k.rect(4, 3),
          k.pos(-2, 2), 
          k.color(218, 165, 32), // Darker Goldenrod
          k.anchor("center")
      ]);

      // --- Particle Effects ---
      const spawnDust = (pos: any) => {
          for (let i = 0; i < 4; i++) {
              k.add([
                  k.rect(4, 4),
                  k.pos(pos),
                  k.color(200, 200, 200),
                  k.move(k.choose([k.LEFT, k.RIGHT, k.UP]), k.rand(20, 60)),
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
                  k.color(255, 165, 0), // Orange
                  k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(60, 100)),
                  k.lifespan(0.4, { fade: 0.1 }),
                  k.z(25)
              ]);
          }
      };

      const showFloatingText = (txt: string, pos: any) => {
          k.add([
              k.text(txt, { size: 20 }),
              k.pos(pos),
              k.color(255, 255, 0),
              k.move(k.UP, 50),
              k.lifespan(0.8, { fade: 0.5 }),
              k.z(100)
          ]);
      };


      // --- Logic ---

      // Jump Logic (Double Jump)
      const jump = () => {
        if (player.isGrounded()) {
          player.jump(900);
          canDoubleJump = true;
          // Squash effect
          player.scale = k.vec2(4.5, 3.5); 
          k.wait(0.1, () => player.scale = k.vec2(4, 4));
        } else if (canDoubleJump) {
            player.jump(700);
            canDoubleJump = false;
            // Spin effect for double jump
            k.tween(0, 360, 0.3, (val) => player.angle = val, k.easings.easeOutQuad);
        }
      };

      k.onKeyPress("space", jump);
      k.onMousePress(jump);

      // Animation Loop
      let time = 0;
      k.onUpdate(() => {
          time += k.dt();
          // Running Animation (only when grounded)
          if (player.isGrounded()) {
              player.angle = 0; // Reset angle logic from double jump
              // Bob body
              player.pos.y += Math.sin(time * 20) * 0.5;
              // Flap wing
              wing.pos.y = 2 + Math.sin(time * 30) * 1;
          } else {
              // Air pose
              wing.pos.y = -2; // Wing up
          }
      });
      
      // Ground Impact
      player.onCollide("ground-physics", () => {
          spawnDust(player.pos.add(0, 32)); // Spawn dust at feet
          k.shake(2);
      });

      // Obstacle & Item Spawner
      const spawnEverything = () => {
        const type = k.randi(0, 4); 
        const isAir = type === 3; // 1 in 4 chance for air bread
        
        // Spawn Ground Obstacle (Rock)
        if (!isAir) {
            k.add([
              k.rect(12, 12),
              k.color(105, 105, 105), // Dim Gray
              k.area(),
              k.scale(4), 
              k.pos(GAME_WIDTH, GAME_HEIGHT - 48),
              k.anchor("botleft"),
              k.move(k.LEFT, speed),
              k.offscreen({ destroy: true, distance: 100 }),
              k.z(10), // Layer 10
              "obstacle",
            ]);
        }
        
        // Spawn Bread
        const breadY = isAir ? GAME_HEIGHT - 200 : GAME_HEIGHT - 130;
        const bread = k.add([
            k.rect(10, 10),
            k.color(255, 165, 0), // Orange Bread
            k.outline(2, k.rgb(139, 69, 19)), // Brown crust outline
            k.area(), 
            k.scale(3),
            k.pos(GAME_WIDTH + (isAir ? 0 : 150), breadY),
            k.anchor("center"),
            k.move(k.LEFT, speed),
            k.offscreen({ destroy: true, distance: 100 }),
            k.z(10), // Layer 10
            "bread",
        ]);
        
        // Make bread bob up and down
        k.loop(1, () => {
           // Simple manual tween simulation or just logic in update
           // For simplicity in spawner, we leave it static movement
        });

        const nextTime = k.rand(1.2, 2.0); // Slightly faster spawn rate for fun
        k.wait(nextTime, spawnEverything);
      };

      spawnEverything();

      // Collisions
      player.onCollide("obstacle", () => {
        k.shake(20);
        k.go("gameover", score);
      });

      player.onCollide("bread", (b) => {
        k.destroy(b);
        score += 100;
        scoreLabel.text = `Score: ${score}`;
        onScoreUpdate(score);
        k.shake(2);
        
        // Juice: Particles & Text
        spawnCrumbs(b.pos);
        showFloatingText("+100", b.pos);
      });

      // Score Timer
      k.loop(0.1, () => {
          score += 1;
          scoreLabel.text = `Score: ${score}`;
          onScoreUpdate(score);
      });
      
      // Speed up over time
      k.loop(5, () => {
          speed += 20;
      });
    });

    // Game Over Scene
    k.scene("gameover", async (finalScore: number) => {
      setGameActive(false);
      
      k.add([
        k.text("GAME OVER", { size: 48 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.z(100),
      ]);

      k.add([
        k.text(`Score: ${finalScore}`, { size: 32 }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.z(100),
      ]);
      
      const loadingText = k.add([
          k.text("Consulting the Wise Duck...", { size: 16 }),
          k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50),
          k.anchor("center"),
          k.color(80, 80, 80),
          k.z(100),
      ]);

      const commentary = await getDuckCommentary(finalScore);
      onGameOver(finalScore, commentary);

      loadingText.text = "Press SPACE to Restart";
      
      const restart = () => k.go("game");
      k.onKeyPress("space", restart);
      k.onMousePress(restart);
    });

    // Start game immediately since we have no assets to load
    k.go("start");

    // Cleanup function for React useEffect
    return () => {
        k.quit();
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