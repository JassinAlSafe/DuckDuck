import { DuckSkin } from './types';

// =============================================================================
// GAME DIMENSIONS
// =============================================================================
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// =============================================================================
// PLAYER SETTINGS
// =============================================================================
export const PLAYER = {
  // Position
  START_X: 80,
  START_Y: GAME_HEIGHT - 200,
  MIN_X: 20,
  MAX_X: GAME_WIDTH / 2,

  // Physics
  GRAVITY: 2400,
  JUMP_FORCE: 900,
  DOUBLE_JUMP_FORCE: 700,
  MOVE_SPEED: 300,

  // Visuals
  SIZE: 16,
  SCALE: 4,
  COLOR: [255, 215, 0] as const, // Gold
  BEAK_COLOR: [255, 69, 0] as const, // Orange Red
  WING_COLOR: [218, 165, 32] as const, // Goldenrod
  EYE_COLOR: [0, 0, 0] as const,
} as const;

// =============================================================================
// DASH SETTINGS
// =============================================================================
export const DASH = {
  DURATION: 0.3,
  COOLDOWN: 2.0,
  DISTANCE: 50,
  TRAIL_COLOR: [0, 255, 255] as const, // Cyan
} as const;

// =============================================================================
// SHIELD SETTINGS
// =============================================================================
export const SHIELD = {
  COLOR: [0, 200, 255] as const,
  PARTICLE_COLOR: [180, 255, 255] as const,
  RING_SIZE: 28,
  PARTICLE_COUNT: 4,
  ORBIT_RADIUS: 22,
} as const;

// =============================================================================
// MAGNET SETTINGS
// =============================================================================
export const MAGNET = {
  DURATION: 10, // seconds
  PULL_SPEED: 600,
  RANGE: 400,
  AURA_COLOR: [255, 50, 50] as const,
  AURA_RADIUS: 30,
} as const;

// =============================================================================
// HEALTH & LIVES
// =============================================================================
export const HEALTH: {
  MAX_LIVES: number;
  INVULNERABILITY_DURATION: number;
} = {
  MAX_LIVES: 3,
  INVULNERABILITY_DURATION: 2, // seconds
};

// =============================================================================
// SPEED & DIFFICULTY
// =============================================================================
export const DIFFICULTY: {
  INITIAL_SPEED: number;
  MAX_SPEED: number;
  SPEED_INCREMENT: number;
  SPEED_INCREASE_INTERVAL: number;
  // Progressive difficulty scaling
  SPAWN_RATE_MULTIPLIER_MAX: number;
  ENEMY_SPEED_MULTIPLIER_MAX: number;
  POWERUP_REDUCTION_MAX: number;
  DIFFICULTY_SCALE_SCORE: number;
} = {
  INITIAL_SPEED: 400,
  MAX_SPEED: 1200,
  SPEED_INCREMENT: 15,
  SPEED_INCREASE_INTERVAL: 5, // seconds
  // Progressive difficulty scaling
  SPAWN_RATE_MULTIPLIER_MAX: 2.5, // Spawns up to 2.5x faster at max difficulty
  ENEMY_SPEED_MULTIPLIER_MAX: 1.5, // Enemies move up to 1.5x faster
  POWERUP_REDUCTION_MAX: 0.4, // Power-ups spawn at 40% rate at max difficulty
  DIFFICULTY_SCALE_SCORE: 5000, // Score at which max difficulty is reached
};

// =============================================================================
// SCORING
// =============================================================================
export const SCORING = {
  // Points per action
  BREAD_COLLECT: 100,
  SHIELD_COLLECT: 50,
  MAGNET_COLLECT: 50,
  ENEMY_SMASH: 50,

  // Passive score
  UPDATE_INTERVAL: 0.5, // seconds
  POINTS_PER_INTERVAL: 5,
} as const;

// =============================================================================
// SPAWNING
// =============================================================================
export const SPAWNING = {
  // Timing
  MIN_INTERVAL: 0.8,
  MAX_INTERVAL: 1.8,
  CLOUD_MIN_INTERVAL: 1,
  CLOUD_MAX_INTERVAL: 3,

  // Spawn chances (cumulative percentages)
  OBSTACLE_CHANCE: 18,
  SLIME_CHANCE: 30,
  FROG_CHANCE: 42,   // Frog enemy (12% chance)
  DRONE_CHANCE: 52,
  BAT_CHANCE: 65,
  PLATFORM_CHANCE: 75,
  SHIELD_CHANCE: 80,
  MAGNET_CHANCE: 83,
  HEART_CHANCE: 85, // Rare heart pickup (2% chance)
  // Remaining = bread

  // Platform bread spawn chance
  PLATFORM_BREAD_CHANCE: 0.7,
} as const;

// =============================================================================
// BIOMES
// =============================================================================
export interface Biome {
  score: number;
  sky: readonly [number, number, number];
  ground: readonly [number, number, number];
  name: string;
}

export const BIOMES: readonly Biome[] = [
  { score: 0, sky: [135, 206, 235], ground: [34, 139, 34], name: "FOREST" },
  { score: 1000, sky: [255, 200, 100], ground: [210, 180, 140], name: "DESERT" },
  { score: 2000, sky: [200, 200, 220], ground: [240, 250, 250], name: "SNOW" },
  { score: 3000, sky: [40, 0, 40], ground: [100, 20, 20], name: "VOLCANO" },
] as const;

// =============================================================================
// COLORS
// =============================================================================
export const COLORS = {
  // UI
  UI_TEXT: [0, 0, 0] as const,
  UI_BACKGROUND: [0, 0, 0] as const,
  PAUSE_OVERLAY: [0, 0, 0] as const,
  PAUSE_TEXT: [255, 255, 255] as const,

  // Effects
  DUST: [200, 200, 200] as const,
  CRUMBS: [255, 165, 0] as const,
  EXPLOSION: [255, 0, 0] as const,
  FLOATING_TEXT: [255, 255, 0] as const,
  SPEED_UP_TEXT: [255, 50, 50] as const,

  // Entities
  CLOUD: [255, 255, 255] as const,
  STAR: [255, 255, 255] as const,
  OBSTACLE: [105, 105, 105] as const,
  SLIME: [50, 205, 50] as const,
  BAT: [147, 112, 219] as const,
  BAT_WING: [75, 0, 130] as const,
  DRONE: [220, 20, 60] as const,
  DRONE_ROTOR: [200, 200, 200] as const,
  PLATFORM: [139, 69, 19] as const,
  PLATFORM_DETAIL: [160, 82, 45] as const,
  BREAD: [255, 165, 0] as const,
  BREAD_OUTLINE: [139, 69, 19] as const,
  SHIELD_ITEM: [0, 191, 255] as const,
  MAGNET_ITEM: [255, 0, 0] as const,
  MAGNET_TIP: [200, 200, 200] as const,
  HEART_ITEM: [255, 80, 120] as const,
  HEART_OUTLINE: [200, 0, 50] as const,
} as const;

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================
export const Z_INDEX = {
  STARS: -20,
  CLOUDS: -10,
  GROUND: 0,
  PLATFORMS: 10,
  COLLECTIBLES: 10,
  POWERUPS: 15,
  DASH_TRAIL: 18,
  DASH_EFFECT: 19,
  PLAYER: 20,
  ENEMIES: 20,
  DUST: 15,
  CRUMBS: 25,
  EXPLOSION: 30,
  HUD: 100,
  FLOATING_TEXT: 100,
  PAUSE_OVERLAY: 200,
} as const;

// =============================================================================
// ANIMATION SETTINGS
// =============================================================================
export const ANIMATION = {
  TIME_WRAP: Math.PI * 200, // Wrap time to prevent floating-point overflow

  // Durations
  COUNTDOWN_STEP: 0.6,
  COUNTDOWN_GO: 0.4,
  JUMP_SQUASH_DURATION: 0.1,
  JUMP_STRETCH_DURATION: 0.2,
  LAND_SQUASH_DURATION: 0.15,
  DASH_BOOM_DURATION: 0.3,
  FLOATING_TEXT_DURATION: 0.8,
  DOUBLE_JUMP_SPIN_DURATION: 0.3,

  // Particle lifespans
  DUST_LIFESPAN: 0.3,
  CRUMBS_LIFESPAN: 0.4,
  EXPLOSION_LIFESPAN: 0.5,
  DASH_TRAIL_LIFESPAN: 0.15,

  // Visual effect speeds
  INVULNERABILITY_FLASH_SPEED: 30,
  BIOME_CYCLE_SPEED: 0.1,
  GROUND_BOB_SPEED: 20,
  GROUND_BOB_AMPLITUDE: 0.5,
  WING_FLAP_SPEED: 30,
  WING_FLAP_AMPLITUDE: 1,
  SHIELD_PULSE_SPEED: 15,
  SHIELD_ROTATION_SPEED: 120,
  SHIELD_ORBIT_SPEED: 4,
  MAGNET_PULSE_SPEED: 10,
} as const;

// =============================================================================
// ENEMY SETTINGS
// =============================================================================
// Standard pixel unit for 8-bit art (all enemies use this for consistency)
// Player is 64x64 on screen, enemies should be ~48-56px
export const ENTITY_PIXEL = 4; // Base pixel size for all pixel-art entities

export const ENEMIES = {
  BAT: {
    SPEED_MULTIPLIER: 1.3,
    WAVE_SPEED: 10,
    WAVE_AMPLITUDE: 2,
  },
  SLIME: {
    SCALE: 0.07, // Sprite scale to match ~50px size
    JUMP_FORCE: 500,
    JUMP_INTERVAL: 1.5,
  },
  FROG: {
    SCALE: 0.07, // Sprite scale to match ~50px size
    JUMP_FORCE: 600,
    JUMP_INTERVAL: 1.0,
    SPEED_MULTIPLIER: 0.9,
  },
  DRONE: {
    SPEED_MULTIPLIER: 1.2,
  },
  OBSTACLE: {
    // Uses ENTITY_PIXEL for sizing
  },
} as const;

// =============================================================================
// COLLECTIBLE SETTINGS
// =============================================================================
// Collectibles should be ~30-36px (about 50% of player size)
export const COLLECTIBLE_PIXEL = 4; // Base pixel size for collectibles

export const COLLECTIBLES = {
  BREAD: {
    OUTLINE_WIDTH: 2,
  },
  SHIELD: {
    GLOW_OPACITY: 0.3,
  },
  MAGNET: {
    // Uses COLLECTIBLE_PIXEL for sizing
  },
  HEART: {
    PIXEL_SIZE: 4, // Each heart pixel
  },
} as const;

// =============================================================================
// PLATFORM SETTINGS
// =============================================================================
export const PLATFORM = {
  WIDTH: 64,
  HEIGHT: 16,
  SCALE: 2,
  MIN_Y: GAME_HEIGHT - 180,
  MAX_Y: GAME_HEIGHT - 100,
} as const;

// =============================================================================
// GROUND SETTINGS
// =============================================================================
export const GROUND = {
  HEIGHT: 48,
  TILE_SIZE: 16,
  GRASS_HEIGHT: 4,
  PIXEL_SIZE: 4, // Size of each "pixel" in 8-bit style
} as const;

// =============================================================================
// CLOUD SETTINGS
// =============================================================================
export const CLOUD = {
  MIN_WIDTH: 40,
  MAX_WIDTH: 80,
  MIN_HEIGHT: 20,
  MAX_HEIGHT: 30,
  MIN_Y: 20,
  MAX_Y: 200,
  SPEED_MULTIPLIER: 0.2,
  OPACITY: 0.6,
} as const;

// =============================================================================
// STAR SETTINGS
// =============================================================================
export const STARS = {
  COUNT: 50,
  SIZE: 2,
} as const;

// =============================================================================
// DUCK SKINS
// =============================================================================
export const DUCK_SKINS: DuckSkin[] = [
  {
    id: 'classic',
    name: 'Classic Duck',
    bodyColor: [255, 215, 0],      // Gold
    beakColor: [255, 69, 0],       // Orange Red
    wingColor: [218, 165, 32],     // Goldenrod
    eyeColor: [0, 0, 0],           // Black
    unlocked: true,
  },
  {
    id: 'mallard',
    name: 'Mallard',
    bodyColor: [34, 139, 34],      // Forest Green
    beakColor: [255, 215, 0],      // Gold
    wingColor: [0, 100, 0],        // Dark Green
    eyeColor: [0, 0, 0],
    unlocked: true,
  },
  {
    id: 'rubber',
    name: 'Rubber Duck',
    bodyColor: [255, 255, 0],      // Bright Yellow
    beakColor: [255, 140, 0],      // Dark Orange
    wingColor: [255, 200, 0],      // Yellow-Orange
    eyeColor: [0, 0, 0],
    unlocked: true,
  },
  {
    id: 'ninja',
    name: 'Ninja Duck',
    bodyColor: [30, 30, 30],       // Dark Gray
    beakColor: [60, 60, 60],       // Gray
    wingColor: [20, 20, 20],       // Almost Black
    eyeColor: [255, 0, 0],         // Red eyes
    unlocked: false,
    unlockScore: 500,
  },
  {
    id: 'royal',
    name: 'Royal Duck',
    bodyColor: [148, 0, 211],      // Purple
    beakColor: [255, 215, 0],      // Gold
    wingColor: [128, 0, 128],      // Dark Purple
    eyeColor: [255, 255, 255],     // White
    unlocked: false,
    unlockScore: 1000,
  },
  {
    id: 'cyber',
    name: 'Cyber Duck',
    bodyColor: [0, 255, 255],      // Cyan
    beakColor: [255, 0, 255],      // Magenta
    wingColor: [0, 200, 200],      // Dark Cyan
    eyeColor: [255, 255, 0],       // Yellow
    unlocked: false,
    unlockScore: 2000,
  },
  {
    id: 'fire',
    name: 'Fire Duck',
    bodyColor: [255, 100, 0],      // Orange
    beakColor: [255, 50, 0],       // Red-Orange
    wingColor: [255, 200, 0],      // Yellow-Orange
    eyeColor: [255, 255, 0],       // Yellow
    unlocked: false,
    unlockScore: 3000,
  },
  {
    id: 'ice',
    name: 'Ice Duck',
    bodyColor: [173, 216, 230],    // Light Blue
    beakColor: [135, 206, 250],    // Sky Blue
    wingColor: [100, 149, 237],    // Cornflower Blue
    eyeColor: [0, 0, 139],         // Dark Blue
    unlocked: false,
    unlockScore: 4000,
  },
  {
    id: 'pixel',
    name: 'Pixel Duck',
    bodyColor: [218, 165, 32],     // Matches sprite colors (for preview)
    beakColor: [255, 165, 0],
    wingColor: [184, 134, 11],
    eyeColor: [0, 0, 0],
    unlocked: false,
    unlockScore: 5000,
    isSprite: true,                // Uses sprite images instead of rectangles
  },
];
