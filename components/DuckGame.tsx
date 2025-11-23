import React, { useEffect, useRef, useState } from 'react';
import kaplay, { KaplayCtx } from 'kaplay';
import { BREAD_SPRITE, DUCK_SPRITE, GAME_HEIGHT, GAME_WIDTH, GROUND_SPRITE, OBSTACLE_SPRITE, PRESS_START_FONT } from '../constants';
import { getDuckCommentary } from '../services/geminiService';

interface DuckGameProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number, commentary: string) => void;
  setGameActive: (active: boolean) => void;
}

const DuckGame: React.FC<DuckGameProps> = ({ onScoreUpdate, onGameOver, setGameActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const kRef = useRef<KaplayCtx | null>(null);
  const [isGameRunning, setIsGameRunning] = useState(false);

  useEffect(() => {
    if (kRef.current || !containerRef.current) return;

    // Initialize Kaplay
    const k = kaplay({
      root: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      letterbox: true,
      background: [135, 206, 235], // Sky blue
      debug: false,
      global: false, // Do not attach to window
      pixelDensity: 2, // Sharp pixels
    });

    kRef.current = k;

    // --- Asset Loading ---
    k.loadSprite("duck", DUCK_SPRITE);
    k.loadSprite("ground", GROUND_SPRITE);
    k.loadSprite("obstacle", OBSTACLE_SPRITE);
    k.loadSprite("bread", BREAD_SPRITE);

    // --- Scene Definitions ---

    // Start Screen
    k.scene("start", () => {
      setGameActive(false);
      
      // Animated background
      k.add([
        k.rect(GAME_WIDTH, GAME_HEIGHT),
        k.color(135, 206, 235),
      ]);

      k.add([
        k.text("DUCK 8-BIT DASH", { size: 32, font: "monospace" }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50),
        k.anchor("center"),
        k.color(255, 255, 0),
        k.outline(4, k.rgb(0, 0, 0)),
      ]);

      k.add([
        k.text("Press SPACE to Start", { size: 16, font: "monospace" }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.animate("opacity", [1, 0, 1], 1), // Blink effect manually simulated via loop usually, but here static for simplicity
      ]);
      
      // Simple blink loop
      const blinkText = k.add([
         k.text("Click or Tap", { size: 12, font: "monospace" }),
         k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80),
         k.anchor("center"),
         k.color(255, 255, 255),
         k.opacity(1),
      ]);
      
      k.loop(0.8, () => {
          blinkText.opacity = blinkText.opacity === 0 ? 1 : 0;
      });

      k.onKeyPress("space", () => k.go("game"));
      k.onClick(() => k.go("game"));
    });

    // Main Game Loop
    k.scene("game", () => {
      setGameActive(true);
      let score = 0;
      let speed = 400;

      // HUD
      const scoreLabel = k.add([
        k.text("Score: 0", { size: 16, font: "monospace" }),
        k.pos(24, 24),
        k.color(0, 0, 0),
        k.fixed(),
      ]);

      // Floor
      k.add([
        k.rect(GAME_WIDTH, 48),
        k.pos(0, GAME_HEIGHT - 48),
        k.area(),
        k.body({ isStatic: true }),
        k.color(34, 139, 34), // Forest Green
        "ground",
      ]);
      
      // Infinite Floor Scrolling Visuals (simulated with sprites)
      // We spawn ground tiles that move left
      
      // Player
      const player = k.add([
        k.sprite("duck"),
        k.pos(80, GAME_HEIGHT - 100),
        k.area(),
        k.body(),
        k.scale(4), // Make it chunky
        k.anchor("center"),
        "player",
      ]);

      // Jump Logic
      const jump = () => {
        if (player.isGrounded()) {
          player.jump(700);
          // Optional: Add dust effect here
        }
      };

      k.onKeyPress("space", jump);
      k.onClick(jump);

      // Object Spawning
      const spawnObstacle = () => {
        const type = k.randi(0, 3);
        const isAir = type === 2; // 1 in 3 chance for air obstacle or high bread
        
        // Spawn Ground Obstacle
        if (!isAir) {
            k.add([
            k.sprite("obstacle"),
            k.area(),
            k.scale(3),
            k.pos(GAME_WIDTH, GAME_HEIGHT - 48 - (16*3)/2), // Adjust for anchor
            k.anchor("botleft"),
            k.move(k.LEFT, speed),
            k.offscreen({ destroy: true }),
            "obstacle",
            ]);
        }
        
        // Spawn Bread (Collectible)
        // Can be in air or on ground
        const breadY = isAir ? GAME_HEIGHT - 180 : GAME_HEIGHT - 120;
        k.add([
            k.sprite("bread"),
            k.area(),
            k.scale(3),
            k.pos(GAME_WIDTH + (isAir ? 0 : 100), breadY),
            k.anchor("center"),
            k.move(k.LEFT, speed),
            k.offscreen({ destroy: true }),
            "bread",
        ]);

        // Recurse with randomized delay
        k.wait(k.rand(1.2, 2.5), spawnObstacle);
      };

      // Start spawning
      spawnObstacle();

      // Mechanics
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
        speed += 5; // Increase speed slightly
      });

      // Score increment over time
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
        k.text("GAME OVER", { size: 48, font: "monospace" }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60),
        k.anchor("center"),
        k.color(0, 0, 0),
      ]);

      k.add([
        k.text(`Score: ${finalScore}`, { size: 24, font: "monospace" }),
        k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2),
        k.anchor("center"),
        k.color(0, 0, 0),
      ]);
      
      const loadingText = k.add([
          k.text("Asking the Wise Duck...", { size: 16, font: "monospace" }),
          k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40),
          k.anchor("center"),
          k.color(50, 50, 50),
      ]);

      // Call Gemini for commentary
      const commentary = await getDuckCommentary(finalScore);
      
      // Update UI outside canvas via prop
      onGameOver(finalScore, commentary);

      // Update text in canvas
      loadingText.text = "Press SPACE to Restart";
      
      k.onKeyPress("space", () => k.go("game"));
      k.onClick(() => k.go("game"));
    });

    // Start initial scene
    k.go("start");

    return () => {
      // Cleanup if necessary, though Kaplay attached to a ref usually needs reload to clear nicely
      // In this setup, we rely on the ref check to avoid double-init
    };
  }, []); // Empty dependency array ensures run once

  return (
    <div className="relative border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-black">
        <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default DuckGame;
