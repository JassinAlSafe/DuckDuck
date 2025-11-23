import React, { useEffect, useRef } from 'react';
import kaplay, { KAPLAYCtx } from 'kaplay';
import { BREAD_SPRITE, DUCK_SPRITE, GAME_FONT, GAME_HEIGHT, GAME_WIDTH, GROUND_SPRITE, OBSTACLE_SPRITE } from '../constants';
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
    });

    kRef.current = k;

    // --- Physics Setup ---
    k.setGravity(2400);

    // --- Asset Loading ---
    k.loadSprite("duck", DUCK_SPRITE);
    k.loadSprite("ground", GROUND_SPRITE);
    k.loadSprite("obstacle", OBSTACLE_SPRITE);
    k.loadSprite("bread", BREAD_SPRITE);

    // --- Scene Definitions ---

    // Start Screen
    k.scene("start", () => {
      setGameActive(false);
      
      // Title
      k.add([
        k.text("DUCK 8-BIT DASH", { size: 32, font: GAME_FONT }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60),
        k.anchor("center"),
        k.color(255, 223, 0), // Golden Yellow
        k.outline(4, k.rgb(0, 0, 0)),
        k.z(100),
      ]);

      // Subtitle
      k.add([
        k.text("Press SPACE to Start", { size: 16, font: GAME_FONT }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.z(100),
      ]);
      
      // Touch instruction
      const blinkText = k.add([
         k.text("Click or Tap Screen", { size: 12, font: GAME_FONT }),
         k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50),
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

      // HUD
      const scoreLabel = k.add([
        k.text("Score: 0", { size: 16, font: GAME_FONT }),
        k.pos(24, 24),
        k.color(0, 0, 0),
        k.fixed(),
        k.z(100),
      ]);

      // Physics Floor (Invisible)
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
          k.add([
             k.sprite("ground"),
             k.pos(x, GAME_HEIGHT - 48),
             k.scale(4), // 16x4 = 64
             k.move(k.LEFT, speed),
             k.offscreen({ destroy: true, distance: 100 }),
             k.z(0), // Layer 0 (Back)
             "ground-visual"
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
      
      // Player
      const player = k.add([
        k.sprite("duck"),
        k.pos(80, GAME_HEIGHT - 200),
        k.area({ scale: k.vec2(0.8, 0.8) }),
        k.body(),
        k.scale(4), 
        k.anchor("center"),
        k.z(20), // Layer 20 (Front of obstacles)
        "player",
      ]);

      // Jump Logic
      const jump = () => {
        if (player.isGrounded()) {
          player.jump(900);
        }
      };

      k.onKeyPress("space", jump);
      k.onMousePress(jump);

      // Obstacle & Item Spawner
      const spawnEverything = () => {
        const type = k.randi(0, 4); 
        const isAir = type === 3; // 1 in 4 chance for air bread
        
        // Spawn Ground Obstacle (Rock)
        if (!isAir) {
            k.add([
              k.sprite("obstacle"),
              k.area({ scale: k.vec2(0.8) }),
              k.scale(3), 
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
        k.add([
            k.sprite("bread"),
            k.area({ scale: k.vec2(1.2) }), // Easier to collect
            k.scale(4),
            k.pos(GAME_WIDTH + (isAir ? 0 : 150), breadY),
            k.anchor("center"),
            k.move(k.LEFT, speed),
            k.offscreen({ destroy: true, distance: 100 }),
            k.z(10), // Layer 10
            "bread",
        ]);

        const nextTime = k.rand(1.5, 2.5);
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
      });

      // Score Timer
      k.loop(0.1, () => {
          score += 1;
          scoreLabel.text = `Score: ${score}`;
          onScoreUpdate(score);
      });
    });

    // Game Over Scene
    k.scene("gameover", async (finalScore: number) => {
      setGameActive(false);
      
      k.add([
        k.text("GAME OVER", { size: 48, font: GAME_FONT }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.z(100),
      ]);

      k.add([
        k.text(`Score: ${finalScore}`, { size: 24, font: GAME_FONT }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.z(100),
      ]);
      
      const loadingText = k.add([
          k.text("Consulting the Wise Duck...", { size: 16, font: GAME_FONT }),
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

    // Ensure assets are loaded before starting
    k.onLoad(() => {
        k.go("start");
    });

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