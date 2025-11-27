import { KAPLAYCtx, GameObj } from 'kaplay';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  Z_INDEX,
  ENEMIES,
  COLLECTIBLES,
  PLATFORM,
  GROUND,
  SPAWNING,
  BIOMES,
  Biome,
  ENTITY_PIXEL,
  COLLECTIBLE_PIXEL
} from '../constants';

type K = KAPLAYCtx<{}, never>;

// =============================================================================
// ENVIRONMENT SPAWNERS
// =============================================================================

/**
 * Spawns a cloud in the background
 */
export function spawnCloud(k: K, speed: number): void {
  k.add([
    k.rect(k.rand(40, 80), k.rand(20, 30)),
    k.pos(GAME_WIDTH, k.rand(20, 200)),
    k.move(k.LEFT, speed * 0.2),
    k.color(COLORS.CLOUD[0], COLORS.CLOUD[1], COLORS.CLOUD[2]),
    k.opacity(0.6),
    k.offscreen({ destroy: true, distance: 200 }),
    k.z(Z_INDEX.CLOUDS),
    "cloud"
  ]);
}

/**
 * Spawns an optimized 8-bit style ground tile
 * Uses fewer draw calls by combining similar colored regions
 */
export function spawnGround(k: K, x: number, speed: number, biome: Biome): void {
  const tileVariant = Math.abs(Math.floor(x / 64)) % 6;
  const baseR = biome.ground[0];
  const baseG = biome.ground[1];
  const baseB = biome.ground[2];

  const ground = k.add([
    k.pos(x, GAME_HEIGHT - GROUND.HEIGHT),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.GROUND),
    "ground-visual"
  ]);

  // Optimized: Use 3 horizontal strips instead of 192 individual pixels
  // Strip 1: Top grass surface (bright)
  ground.add([
    k.rect(64, 16),
    k.pos(0, 0),
    k.color(
      Math.min(255, baseR + 40),
      Math.min(255, baseG + 50),
      Math.min(255, baseB + 30)
    )
  ]);

  // Strip 2: Mid layer (base color)
  ground.add([
    k.rect(64, 16),
    k.pos(0, 16),
    k.color(baseR, baseG, baseB)
  ]);

  // Strip 3: Bottom dirt (darker)
  ground.add([
    k.rect(64, 16),
    k.pos(0, 32),
    k.color(
      Math.max(0, baseR - 30),
      Math.max(0, baseG - 30),
      Math.max(0, baseB - 30)
    )
  ]);

  // Add only a few key decorative elements per biome (max 4-6 children total)
  const px = 4; // pixel size

  switch (biome.name) {
    case "FOREST":
      // Grass blades (2-3)
      if (tileVariant % 2 === 0) {
        ground.add([k.rect(px, px * 2), k.pos(8, -px * 2), k.color(baseR + 50, baseG + 60, baseB + 30)]);
        ground.add([k.rect(px, px * 3), k.pos(24, -px * 3), k.color(baseR + 40, baseG + 55, baseB + 25)]);
      }
      if (tileVariant % 3 === 1) {
        ground.add([k.rect(px, px * 2), k.pos(48, -px * 2), k.color(baseR + 45, baseG + 58, baseB + 28)]);
      }
      // Rock detail
      if (tileVariant % 2 === 1) {
        ground.add([k.rect(px * 2, px), k.pos(36, 20), k.color(baseR - 40, baseG - 40, baseB - 30)]);
      }
      break;

    case "DESERT":
      // Sand ripple highlights
      ground.add([k.rect(px * 3, px), k.pos(12, 4), k.color(baseR + 20, baseG + 15, baseB + 10)]);
      if (tileVariant % 2 === 0) {
        ground.add([k.rect(px * 2, px), k.pos(40, 8), k.color(baseR + 25, baseG + 20, baseB + 15)]);
      }
      // Small stone
      if (tileVariant % 3 === 1) {
        ground.add([k.rect(px * 2, px * 2), k.pos(52, 24), k.color(baseR - 50, baseG - 50, baseB - 40)]);
      }
      break;

    case "SNOW":
      // Ice shine highlights
      ground.add([k.rect(px * 2, px), k.pos(16, 2), k.color(255, 255, 255)]);
      if (tileVariant % 2 === 0) {
        ground.add([k.rect(px * 3, px), k.pos(36, 6), k.color(240, 248, 255)]);
      }
      // Frozen patch
      if (tileVariant % 3 === 1) {
        ground.add([k.rect(px * 2, px * 2), k.pos(8, 20), k.color(baseR - 20, baseG - 15, baseB - 10)]);
      }
      break;

    case "VOLCANO":
      // Lava cracks (glowing orange)
      ground.add([k.rect(px, px * 2), k.pos(20, 28), k.color(255, 100, 0)]);
      if (tileVariant % 2 === 0) {
        ground.add([k.rect(px * 2, px), k.pos(44, 32), k.color(255, 150, 0)]);
        ground.add([k.rect(px, px), k.pos(45, 36), k.color(255, 80, 0)]);
      }
      // Ember glow
      if (tileVariant % 3 === 1) {
        ground.add([k.rect(px, px), k.pos(12, 8), k.color(255, 200, 50)]);
      }
      break;
  }

  // Top edge highlight line
  ground.add([
    k.rect(64, 2),
    k.pos(0, 0),
    k.color(
      Math.min(255, baseR + 60),
      Math.min(255, baseG + 65),
      Math.min(255, baseB + 50)
    )
  ]);
}

/**
 * Creates the physics floor (invisible)
 */
export function createPhysicsFloor(k: K): GameObj {
  return k.add([
    k.rect(GAME_WIDTH, GROUND.HEIGHT),
    k.pos(0, GAME_HEIGHT - GROUND.HEIGHT),
    k.area(),
    k.body({ isStatic: true }),
    k.opacity(0),
    "ground-physics",
  ]);
}

/**
 * Creates background stars
 */
export function createStars(k: K, count: number): GameObj[] {
  const stars: GameObj[] = [];
  for (let i = 0; i < count; i++) {
    const star = k.add([
      k.rect(2, 2),
      k.pos(k.rand(0, GAME_WIDTH), k.rand(0, GAME_HEIGHT - 50)),
      k.color(COLORS.STAR[0], COLORS.STAR[1], COLORS.STAR[2]),
      k.opacity(0),
      k.fixed(),
      k.z(Z_INDEX.STARS)
    ]);
    stars.push(star);
  }
  return stars;
}

// =============================================================================
// ENEMY SPAWNERS
// =============================================================================

/**
 * Spawns an 8-bit pixel art bat enemy with animated wings
 * Size: ~48px wide (with wings), ~36px tall
 */
export function spawnBat(k: K, speed: number, isPaused: () => boolean): void {
  const px = ENTITY_PIXEL;

  const bat = k.add([
    k.pos(GAME_WIDTH, GAME_HEIGHT - k.rand(100, 220)),
    k.area({ shape: new k.Rect(k.vec2(-px * 6, -px * 4), px * 12, px * 8) }),
    k.anchor("center"),
    k.move(k.LEFT, speed * ENEMIES.BAT.SPEED_MULTIPLIER),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.ENEMIES),
    "bat",
    "danger"
  ]);

  // Main body (dark purple oval shape)
  bat.add([k.rect(px * 4, px * 3), k.pos(-px * 2, -px), k.color(80, 40, 100)]);
  bat.add([k.rect(px * 2, px * 4), k.pos(-px, -px * 2), k.color(80, 40, 100)]);

  // Head
  bat.add([k.rect(px * 3, px * 2), k.pos(-px * 1.5, -px * 3), k.color(100, 50, 120)]);

  // Ears (pointed)
  bat.add([k.rect(px, px * 2), k.pos(-px * 2, -px * 4.5), k.color(60, 30, 80)]);
  bat.add([k.rect(px, px * 2), k.pos(px, -px * 4.5), k.color(60, 30, 80)]);

  // Evil red eyes
  bat.add([k.rect(px, px), k.pos(-px * 1.5, -px * 2.5), k.color(255, 0, 0)]);
  bat.add([k.rect(px, px), k.pos(px * 0.5, -px * 2.5), k.color(255, 0, 0)]);

  // Eye glow
  bat.add([k.rect(px * 0.5, px * 0.5), k.pos(-px * 1.25, -px * 2.25), k.color(255, 100, 100)]);
  bat.add([k.rect(px * 0.5, px * 0.5), k.pos(px * 0.75, -px * 2.25), k.color(255, 100, 100)]);

  // Fangs
  bat.add([k.rect(px * 0.5, px), k.pos(-px * 0.5, -px * 0.5), k.color(255, 255, 255)]);
  bat.add([k.rect(px * 0.5, px), k.pos(0, -px * 0.5), k.color(255, 255, 255)]);

  // Wings (will animate)
  const leftWing = bat.add([k.rect(px * 4, px * 2), k.pos(-px * 6, -px), k.color(60, 20, 80), k.anchor("right")]);
  const rightWing = bat.add([k.rect(px * 4, px * 2), k.pos(px * 6, -px), k.color(60, 20, 80), k.anchor("left")]);

  // Wing membrane details
  bat.add([k.rect(px, px * 3), k.pos(-px * 5, -px * 2), k.color(40, 10, 60)]);
  bat.add([k.rect(px, px * 3), k.pos(px * 4, -px * 2), k.color(40, 10, 60)]);

  // Wave movement and wing animation
  let t = 0;
  bat.onUpdate(() => {
    if (isPaused()) return;
    t += k.dt() * ENEMIES.BAT.WAVE_SPEED;
    bat.pos.y += Math.sin(t) * ENEMIES.BAT.WAVE_AMPLITUDE;

    // Wing flap animation
    const wingFlap = Math.sin(t * 3) * 0.3;
    leftWing.scale = k.vec2(1, 1 + wingFlap);
    rightWing.scale = k.vec2(1, 1 + wingFlap);
  });
}

/**
 * Spawns a slime enemy using the 8-bit sprite with squish animation
 * Size: ~50px (matches other enemies)
 */
export function spawnSlime(
  k: K,
  speed: number,
  isGameRunning: () => boolean,
  isPaused: () => boolean
): void {
  const baseScale = ENEMIES.SLIME.SCALE;

  const slime = k.add([
    k.sprite("slime"),
    k.pos(GAME_WIDTH, GAME_HEIGHT - 60),
    k.area({ scale: 0.8 }),
    k.body(),
    k.scale(baseScale),
    k.anchor("center"),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.ENEMIES),
    "slime",
    "danger"
  ]);

  // Jump behavior with squish animation
  let jumpTimer = 0;

  slime.onUpdate(() => {
    if (!isGameRunning() || isPaused()) return;
    jumpTimer += k.dt();

    // Squish animation when about to jump
    if (jumpTimer >= ENEMIES.SLIME.JUMP_INTERVAL - 0.2 && slime.isGrounded()) {
      slime.scale = k.vec2(baseScale * 1.3, baseScale * 0.7); // Squash down
    }

    if (jumpTimer >= ENEMIES.SLIME.JUMP_INTERVAL) {
      jumpTimer = 0;
      if (slime.isGrounded()) {
        slime.jump(ENEMIES.SLIME.JUMP_FORCE);
        slime.scale = k.vec2(baseScale * 0.7, baseScale * 1.3); // Stretch up
      }
    }

    // Return to normal scale when grounded
    if (slime.isGrounded() && jumpTimer < ENEMIES.SLIME.JUMP_INTERVAL - 0.2) {
      slime.scale = k.lerp(slime.scale, k.vec2(baseScale, baseScale), k.dt() * 8);
    }
  });
}

/**
 * Spawns a frog enemy using the 8-bit sprite with jumping behavior
 * Size: ~50px (matches other enemies)
 */
export function spawnFrog(
  k: K,
  speed: number,
  isGameRunning: () => boolean,
  isPaused: () => boolean
): void {
  const baseScale = ENEMIES.FROG.SCALE;

  const frog = k.add([
    k.sprite("frog"),
    k.pos(GAME_WIDTH, GAME_HEIGHT - 70),
    k.area({ scale: 0.8 }),
    k.body(),
    k.scale(baseScale),
    k.anchor("center"),
    k.move(k.LEFT, speed * ENEMIES.FROG.SPEED_MULTIPLIER),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.ENEMIES),
    "frog",
    "danger"
  ]);

  // Jump behavior with squish animation (jumps more frequently than slime)
  let jumpTimer = 0;

  frog.onUpdate(() => {
    if (!isGameRunning() || isPaused()) return;
    jumpTimer += k.dt();

    // Squish animation when about to jump
    if (jumpTimer >= ENEMIES.FROG.JUMP_INTERVAL - 0.15 && frog.isGrounded()) {
      frog.scale = k.vec2(baseScale * 1.3, baseScale * 0.7); // Squash down
    }

    if (jumpTimer >= ENEMIES.FROG.JUMP_INTERVAL) {
      jumpTimer = 0;
      if (frog.isGrounded()) {
        frog.jump(ENEMIES.FROG.JUMP_FORCE);
        frog.scale = k.vec2(baseScale * 0.7, baseScale * 1.3); // Stretch up
      }
    }

    // Return to normal scale when grounded
    if (frog.isGrounded() && jumpTimer < ENEMIES.FROG.JUMP_INTERVAL - 0.15) {
      frog.scale = k.lerp(frog.scale, k.vec2(baseScale, baseScale), k.dt() * 10);
    }
  });
}

/**
 * Spawns an 8-bit pixel art attack drone with spinning rotors
 * Size: ~48px wide, ~28px tall
 */
export function spawnDrone(k: K, speed: number): void {
  const px = ENTITY_PIXEL;

  const drone = k.add([
    k.pos(GAME_WIDTH, GAME_HEIGHT - k.rand(100, 180)),
    k.area({ shape: new k.Rect(k.vec2(-px * 6, -px * 4), px * 12, px * 8) }),
    k.anchor("center"),
    k.move(k.LEFT, speed * ENEMIES.DRONE.SPEED_MULTIPLIER),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.ENEMIES),
    "enemy",
    "danger"
  ]);

  // Main body (dark metallic red)
  drone.add([k.rect(px * 6, px * 4), k.pos(-px * 3, -px * 2), k.color(180, 30, 30)]);

  // Body highlights (metallic shine)
  drone.add([k.rect(px * 4, px), k.pos(-px * 2, -px * 2), k.color(220, 60, 60)]);
  drone.add([k.rect(px, px * 2), k.pos(-px * 2.5, -px), k.color(200, 50, 50)]);

  // Dark underbelly
  drone.add([k.rect(px * 5, px), k.pos(-px * 2.5, px), k.color(120, 20, 20)]);

  // Cockpit/sensor (menacing eye)
  drone.add([k.rect(px * 2, px * 2), k.pos(-px, -px), k.color(20, 20, 20)]);
  drone.add([k.rect(px * 1.5, px * 1.5), k.pos(-px * 0.75, -px * 0.75), k.color(255, 255, 0)]); // Yellow glow
  drone.add([k.rect(px * 0.5, px * 0.5), k.pos(-px * 0.25, -px * 0.25), k.color(255, 0, 0)]); // Red center

  // Side thrusters
  drone.add([k.rect(px * 2, px * 2), k.pos(-px * 5, -px), k.color(80, 80, 90)]);
  drone.add([k.rect(px * 2, px * 2), k.pos(px * 3, -px), k.color(80, 80, 90)]);

  // Thruster glow
  drone.add([k.rect(px, px), k.pos(-px * 4.5, -px * 0.5), k.color(0, 150, 255)]);
  drone.add([k.rect(px, px), k.pos(px * 3.5, -px * 0.5), k.color(0, 150, 255)]);

  // Weapons/appendages
  drone.add([k.rect(px * 0.5, px * 2), k.pos(-px * 3, px), k.color(60, 60, 70)]);
  drone.add([k.rect(px * 0.5, px * 2), k.pos(px * 2.5, px), k.color(60, 60, 70)]);

  // Top rotor assembly
  drone.add([k.rect(px * 2, px), k.pos(-px, -px * 3), k.color(100, 100, 110)]);

  // Spinning rotors (will animate)
  const rotor1 = drone.add([k.rect(px * 6, px * 0.5), k.pos(0, -px * 3.5), k.color(180, 180, 190), k.anchor("center")]);
  const rotor2 = drone.add([k.rect(px * 6, px * 0.5), k.pos(0, -px * 3.5), k.color(150, 150, 160), k.anchor("center"), k.rotate(90)]);

  // Warning lights
  const warningLight = drone.add([k.rect(px, px), k.pos(px * 2, -px * 2), k.color(255, 0, 0)]);

  // Animation
  let t = 0;
  drone.onUpdate(() => {
    t += k.dt() * 20;

    // Spin rotors
    rotor1.angle = t * 30;
    rotor2.angle = t * 30 + 90;

    // Blink warning light
    warningLight.opacity = Math.sin(t * 5) > 0 ? 1 : 0.3;

    // Slight hover wobble
    drone.pos.y += Math.sin(t * 2) * 0.3;
  });
}

/**
 * Spawns an 8-bit pixel art spike obstacle
 * Size: ~32px wide, ~44px tall
 */
export function spawnObstacle(k: K, speed: number): void {
  const px = ENTITY_PIXEL;
  const variant = k.randi(0, 3); // Random obstacle variant

  const obstacle = k.add([
    k.pos(GAME_WIDTH, GAME_HEIGHT - GROUND.HEIGHT),
    k.area({ shape: new k.Rect(k.vec2(0, -px * 10), px * 8, px * 10) }),
    k.anchor("botleft"),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.PLATFORMS),
    "obstacle",
    "danger"
  ]);

  if (variant === 0) {
    // Spike cluster
    // Main spike
    obstacle.add([k.rect(px * 2, px * 8), k.pos(px * 3, -px * 8), k.color(80, 80, 90)]);
    obstacle.add([k.rect(px * 4, px * 2), k.pos(px * 2, -px * 2), k.color(70, 70, 80)]);
    obstacle.add([k.rect(px, px * 2), k.pos(px * 3.5, -px * 10), k.color(100, 100, 110)]);
    // Spike tip (sharp)
    obstacle.add([k.rect(px, px), k.pos(px * 3.5, -px * 11), k.color(200, 200, 210)]);

    // Side spike left
    obstacle.add([k.rect(px, px * 5), k.pos(px, -px * 5), k.color(60, 60, 70)]);
    obstacle.add([k.rect(px * 0.5, px), k.pos(px * 1.25, -px * 6), k.color(150, 150, 160)]);

    // Side spike right
    obstacle.add([k.rect(px, px * 4), k.pos(px * 6, -px * 4), k.color(60, 60, 70)]);
    obstacle.add([k.rect(px * 0.5, px), k.pos(px * 6.25, -px * 5), k.color(150, 150, 160)]);

    // Metallic shine highlights
    obstacle.add([k.rect(px * 0.5, px * 4), k.pos(px * 3, -px * 7), k.color(120, 120, 130)]);

  } else if (variant === 1) {
    // Crate with danger marking
    // Main crate body
    obstacle.add([k.rect(px * 8, px * 8), k.pos(0, -px * 8), k.color(100, 70, 40)]);
    // Crate edges (darker)
    obstacle.add([k.rect(px * 8, px), k.pos(0, -px * 8), k.color(60, 40, 20)]);
    obstacle.add([k.rect(px * 8, px), k.pos(0, -px), k.color(60, 40, 20)]);
    obstacle.add([k.rect(px, px * 8), k.pos(0, -px * 8), k.color(60, 40, 20)]);
    obstacle.add([k.rect(px, px * 8), k.pos(px * 7, -px * 8), k.color(60, 40, 20)]);

    // Danger X marking
    obstacle.add([k.rect(px * 4, px), k.pos(px * 2, -px * 5), k.color(200, 50, 50), k.rotate(45), k.anchor("center")]);
    obstacle.add([k.rect(px * 4, px), k.pos(px * 2, -px * 5), k.color(200, 50, 50), k.rotate(-45), k.anchor("center")]);

    // Wood grain details
    obstacle.add([k.rect(px * 0.5, px * 3), k.pos(px * 2, -px * 6), k.color(80, 55, 30)]);
    obstacle.add([k.rect(px * 0.5, px * 2), k.pos(px * 5, -px * 4), k.color(80, 55, 30)]);

    // Highlight
    obstacle.add([k.rect(px * 2, px * 0.5), k.pos(px, -px * 7), k.color(130, 100, 70)]);

  } else {
    // Rock/boulder obstacle
    // Main rock shape
    obstacle.add([k.rect(px * 6, px * 5), k.pos(px, -px * 5), k.color(90, 90, 100)]);
    obstacle.add([k.rect(px * 4, px * 6), k.pos(px * 2, -px * 7), k.color(80, 80, 90)]);
    obstacle.add([k.rect(px * 2, px * 2), k.pos(px * 3, -px * 8), k.color(70, 70, 80)]);

    // Rocky texture/cracks
    obstacle.add([k.rect(px * 2, px * 0.5), k.pos(px * 2, -px * 4), k.color(50, 50, 60)]);
    obstacle.add([k.rect(px * 0.5, px * 2), k.pos(px * 4, -px * 6), k.color(50, 50, 60)]);

    // Highlights (top)
    obstacle.add([k.rect(px * 2, px), k.pos(px * 2.5, -px * 7.5), k.color(120, 120, 130)]);
    obstacle.add([k.rect(px, px * 0.5), k.pos(px * 3, -px * 8), k.color(150, 150, 160)]);

    // Shadow (bottom)
    obstacle.add([k.rect(px * 5, px), k.pos(px * 1.5, -px), k.color(40, 40, 50)]);
  }
}

// =============================================================================
// PLATFORM SPAWNERS
// =============================================================================

/**
 * Spawns a floating platform with optional bread on top
 */
export function spawnPlatform(k: K, speed: number): void {
  const yPos = GAME_HEIGHT - k.rand(100, 180);

  const platform = k.add([
    k.rect(PLATFORM.WIDTH, PLATFORM.HEIGHT),
    k.color(COLORS.PLATFORM[0], COLORS.PLATFORM[1], COLORS.PLATFORM[2]),
    k.area(),
    k.body({ isStatic: true }),
    k.scale(PLATFORM.SCALE),
    k.pos(GAME_WIDTH, yPos),
    k.anchor("center"),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.PLATFORMS),
    "platform"
  ]);

  // Platform details
  platform.add([k.rect(2, 2), k.pos(-28, -6), k.color(COLORS.PLATFORM_DETAIL[0], COLORS.PLATFORM_DETAIL[1], COLORS.PLATFORM_DETAIL[2])]);
  platform.add([k.rect(2, 2), k.pos(26, -6), k.color(COLORS.PLATFORM_DETAIL[0], COLORS.PLATFORM_DETAIL[1], COLORS.PLATFORM_DETAIL[2])]);

  // Chance to spawn bread on top
  if (Number(k.rand()) > (1 - SPAWNING.PLATFORM_BREAD_CHANCE)) {
    spawnBread(k, speed, GAME_WIDTH, yPos - 40);
  }
}

// =============================================================================
// COLLECTIBLE SPAWNERS
// =============================================================================

/**
 * Spawns a bread collectible
 * Size: ~32px (8x8 grid with 4px pixels)
 */
export function spawnBread(k: K, speed: number, x?: number, y?: number): void {
  const px = COLLECTIBLE_PIXEL;
  const isAir = x === undefined ? Number(k.rand()) > 0.5 : false;
  const breadX = x ?? (GAME_WIDTH + (isAir ? 0 : 150));
  const breadY = y ?? (isAir ? GAME_HEIGHT - 220 : GAME_HEIGHT - 130);

  const bread = k.add([
    k.pos(breadX, breadY),
    k.area({ shape: new k.Rect(k.vec2(-px * 4, -px * 3), px * 8, px * 6) }),
    k.anchor("center"),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.COLLECTIBLES),
    "bread",
  ]);

  // 8-bit bread shape
  bread.add([k.rect(px * 6, px * 5), k.pos(-px * 3, -px * 2.5), k.color(COLORS.BREAD[0], COLORS.BREAD[1], COLORS.BREAD[2])]);
  bread.add([k.rect(px * 4, px), k.pos(-px * 2, -px * 3.5), k.color(COLORS.BREAD[0] + 30, COLORS.BREAD[1] + 20, COLORS.BREAD[2])]); // Top crust
  bread.add([k.rect(px * 2, px), k.pos(-px, -px * 2), k.color(255, 200, 100)]); // Highlight
  // Outline
  bread.add([k.rect(px * 6, px * 0.5), k.pos(-px * 3, -px * 3), k.color(COLORS.BREAD_OUTLINE[0], COLORS.BREAD_OUTLINE[1], COLORS.BREAD_OUTLINE[2])]);
  bread.add([k.rect(px * 6, px * 0.5), k.pos(-px * 3, px * 2), k.color(COLORS.BREAD_OUTLINE[0], COLORS.BREAD_OUTLINE[1], COLORS.BREAD_OUTLINE[2])]);
}

/**
 * Spawns a shield power-up
 * Size: ~32px
 */
export function spawnShield(k: K, speed: number): void {
  const px = COLLECTIBLE_PIXEL;

  const shieldItem = k.add([
    k.pos(GAME_WIDTH, GAME_HEIGHT - 120),
    k.area({ shape: new k.Rect(k.vec2(-px * 3, -px * 4), px * 6, px * 8) }),
    k.anchor("center"),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.POWERUPS),
    "shield-item"
  ]);

  // Shield shape
  shieldItem.add([k.rect(px * 6, px * 6), k.pos(-px * 3, -px * 3), k.color(COLORS.SHIELD_ITEM[0], COLORS.SHIELD_ITEM[1], COLORS.SHIELD_ITEM[2])]);
  shieldItem.add([k.rect(px * 4, px), k.pos(-px * 2, px * 3), k.color(COLORS.SHIELD_ITEM[0], COLORS.SHIELD_ITEM[1], COLORS.SHIELD_ITEM[2])]); // Bottom point
  shieldItem.add([k.rect(px * 2, px), k.pos(-px, px * 4), k.color(COLORS.SHIELD_ITEM[0], COLORS.SHIELD_ITEM[1], COLORS.SHIELD_ITEM[2])]);
  // Highlight
  shieldItem.add([k.rect(px * 2, px * 3), k.pos(-px * 2, -px * 2), k.color(100, 220, 255)]);
  // Glow effect
  shieldItem.add([k.rect(px * 8, px * 10), k.pos(-px * 4, -px * 4), k.color(COLORS.SHIELD_ITEM[0], COLORS.SHIELD_ITEM[1], COLORS.SHIELD_ITEM[2]), k.opacity(COLLECTIBLES.SHIELD.GLOW_OPACITY)]);
}

/**
 * Spawns a magnet power-up
 * Size: ~32px
 */
export function spawnMagnet(k: K, speed: number): void {
  const px = COLLECTIBLE_PIXEL;

  const magnet = k.add([
    k.pos(GAME_WIDTH, GAME_HEIGHT - 120),
    k.area({ shape: new k.Rect(k.vec2(-px * 3, -px * 4), px * 6, px * 8) }),
    k.anchor("center"),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.POWERUPS),
    "magnet-item"
  ]);

  // Horseshoe magnet shape
  magnet.add([k.rect(px * 6, px * 2), k.pos(-px * 3, -px * 3), k.color(COLORS.MAGNET_ITEM[0], COLORS.MAGNET_ITEM[1], COLORS.MAGNET_ITEM[2])]); // Top bar
  magnet.add([k.rect(px * 2, px * 5), k.pos(-px * 3, -px), k.color(COLORS.MAGNET_ITEM[0], COLORS.MAGNET_ITEM[1], COLORS.MAGNET_ITEM[2])]); // Left leg
  magnet.add([k.rect(px * 2, px * 5), k.pos(px, -px), k.color(COLORS.MAGNET_ITEM[0], COLORS.MAGNET_ITEM[1], COLORS.MAGNET_ITEM[2])]); // Right leg
  // Tips (silver)
  magnet.add([k.rect(px * 2, px * 2), k.pos(-px * 3, px * 2), k.color(COLORS.MAGNET_TIP[0], COLORS.MAGNET_TIP[1], COLORS.MAGNET_TIP[2])]);
  magnet.add([k.rect(px * 2, px * 2), k.pos(px, px * 2), k.color(COLORS.MAGNET_TIP[0], COLORS.MAGNET_TIP[1], COLORS.MAGNET_TIP[2])]);
}

/**
 * Spawns a heart pickup that restores health (8-bit pixel heart shape)
 * Size: ~32px
 */
export function spawnHeart(k: K, speed: number): void {
  const px = COLLECTIBLE_PIXEL;
  // 8-bit heart pattern (1 = filled pixel)
  const heartPattern = [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ];

  const heartWidth = 8 * px;
  const heartHeight = 7 * px;

  const heart = k.add([
    k.pos(GAME_WIDTH, GAME_HEIGHT - k.rand(100, 180)),
    k.anchor("center"),
    k.move(k.LEFT, speed),
    k.area({ shape: new k.Rect(k.vec2(-heartWidth / 2, -heartHeight / 2), heartWidth, heartHeight) }),
    k.scale(1),
    k.offscreen({ destroy: true, distance: 100 }),
    k.z(Z_INDEX.POWERUPS),
    "heart-item"
  ]);

  // Draw the 8-bit heart using individual pixel rectangles
  const mainColor = k.rgb(COLORS.HEART_ITEM[0], COLORS.HEART_ITEM[1], COLORS.HEART_ITEM[2]);
  const highlightColor = k.rgb(255, 150, 180); // Lighter pink for highlight
  const shadowColor = k.rgb(COLORS.HEART_OUTLINE[0], COLORS.HEART_OUTLINE[1], COLORS.HEART_OUTLINE[2]);

  heartPattern.forEach((row, rowIdx) => {
    row.forEach((pixel, colIdx) => {
      if (pixel === 1) {
        // Calculate position relative to center
        const posX = (colIdx - 4) * px + px / 2;
        const posY = (rowIdx - 3.5) * px + px / 2;

        // Determine color based on position (highlight top-left, shadow bottom-right)
        let color = mainColor;
        if (rowIdx <= 1 && colIdx <= 3) {
          color = highlightColor; // Top-left highlight
        } else if (rowIdx >= 5 || colIdx >= 6) {
          color = shadowColor; // Bottom-right shadow
        }

        heart.add([
          k.rect(px, px),
          k.pos(posX, posY),
          k.color(color),
          k.anchor("center")
        ]);
      }
    });
  });

  // Pulsing animation
  let t = 0;
  heart.onUpdate(() => {
    t += k.dt() * 8;
    const pulse = 1 + Math.sin(t) * 0.15;
    heart.scale = k.vec2(1 * pulse);
  });
}

// =============================================================================
// SPAWN CONTROLLER
// =============================================================================

export interface DifficultyContext {
  enemySpeedMultiplier: number; // 1.0 to ENEMY_SPEED_MULTIPLIER_MAX
  powerupSpawnChance: number;   // 1.0 to POWERUP_REDUCTION_MAX (lower = fewer powerups)
}

/**
 * Spawns a random entity based on spawn chances with difficulty scaling
 */
export function spawnRandomEntity(
  k: K,
  speed: number,
  isGameRunning: () => boolean,
  isPaused: () => boolean,
  difficulty: DifficultyContext = { enemySpeedMultiplier: 1, powerupSpawnChance: 1 }
): void {
  const type = k.randi(0, 100);
  const enemySpeed = speed * difficulty.enemySpeedMultiplier;

  // Calculate adjusted spawn thresholds based on difficulty
  // At higher difficulty, power-ups become rarer
  const shieldThreshold = SPAWNING.PLATFORM_CHANCE +
    (SPAWNING.SHIELD_CHANCE - SPAWNING.PLATFORM_CHANCE) * difficulty.powerupSpawnChance;
  const magnetThreshold = shieldThreshold +
    (SPAWNING.MAGNET_CHANCE - SPAWNING.SHIELD_CHANCE) * difficulty.powerupSpawnChance;
  const heartThreshold = magnetThreshold +
    (SPAWNING.HEART_CHANCE - SPAWNING.MAGNET_CHANCE) * difficulty.powerupSpawnChance;

  if (type <= SPAWNING.OBSTACLE_CHANCE) {
    spawnObstacle(k, enemySpeed);
  } else if (type <= SPAWNING.SLIME_CHANCE) {
    spawnSlime(k, enemySpeed, isGameRunning, isPaused);
  } else if (type <= SPAWNING.FROG_CHANCE) {
    spawnFrog(k, enemySpeed, isGameRunning, isPaused);
  } else if (type <= SPAWNING.DRONE_CHANCE) {
    spawnDrone(k, enemySpeed);
  } else if (type <= SPAWNING.BAT_CHANCE) {
    spawnBat(k, enemySpeed, isPaused);
  } else if (type <= SPAWNING.PLATFORM_CHANCE) {
    spawnPlatform(k, speed); // Platforms use base speed
  } else if (type <= shieldThreshold) {
    spawnShield(k, speed);
  } else if (type <= magnetThreshold) {
    spawnMagnet(k, speed);
  } else if (type <= heartThreshold) {
    spawnHeart(k, speed);
  } else {
    spawnBread(k, speed);
  }
}
