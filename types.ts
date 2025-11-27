import { KAPLAYCtx, GameObj, Vec2, Color } from 'kaplay';
import { MutableRefObject } from 'react';

// =============================================================================
// GAME STATE TYPES
// =============================================================================

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD',
  SKINS = 'SKINS'
}

// =============================================================================
// DUCK SKIN TYPES
// =============================================================================

export interface DuckSkin {
  id: string;
  name: string;
  bodyColor: readonly [number, number, number];
  beakColor: readonly [number, number, number];
  wingColor: readonly [number, number, number];
  eyeColor: readonly [number, number, number];
  unlocked: boolean;
  unlockScore?: number; // Score needed to unlock (if not unlocked by default)
  isSprite?: boolean;   // If true, uses sprite images instead of rectangles
}

export interface ScoreData {
  current: number;
  high: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface CommentaryResponse {
  message: string;
}

// =============================================================================
// GAME CONTEXT TYPES
// =============================================================================

export interface GameRefs {
  onScoreUpdate: MutableRefObject<(score: number) => void>;
  onHealthUpdate: MutableRefObject<(health: number) => void>;
  onGameOver: MutableRefObject<(score: number, commentary: string) => void>;
}

export interface GameplayState {
  score: number;
  speed: number;
  lives: number;
  canDoubleJump: boolean;
  isGameRunning: boolean;
  isPaused: boolean;
  isInvulnerable: boolean;
  invulnerabilityTimer: ReturnType<typeof setTimeout> | null;
  isDashing: boolean;
  canDash: boolean;
  dashTimer: number;
  hasShield: boolean;
  hasMagnet: boolean;
  magnetTimer: number;
  currentBiomeIndex: number;
  time: number;
}

export interface SpawnerState {
  cloudSpawnerActive: boolean;
  obstacleSpawnerActive: boolean;
  spawnAccumulator: number;
  nextSpawnTime: number;
}

// =============================================================================
// KAPLAY HELPER TYPES
// =============================================================================

export type KaplayContext = KAPLAYCtx<{}, never>;

// Extended KAPLAYCtx with timeScale property
export interface KaplayContextWithTimeScale extends KaplayContext {
  timeScale: number;
}

// Player game object with all components
export type PlayerGameObj = GameObj<{
  pos: Vec2;
  scale: Vec2;
  angle: number;
  opacity: number;
  color: Color;
  paused: boolean;
  vel: Vec2;
  jump: (force: number) => void;
  move: (x: number, y: number) => void;
  isGrounded: () => boolean;
  onCollide: (tag: string, cb: (obj: GameObj) => void) => void;
}>;

// =============================================================================
// EFFECT TYPES
// =============================================================================

export interface EffectConfig {
  pos: Vec2;
  color?: Color;
  text?: string;
}

export type EffectFunction = (k: KaplayContext, config: EffectConfig) => void;

// =============================================================================
// SPAWNER TYPES
// =============================================================================

export interface SpawnContext {
  k: KaplayContext;
  speed: number;
  isGameRunning: boolean;
  isPaused: boolean;
  gameCleanedUp: boolean;
}

export type SpawnFunction = (ctx: SpawnContext) => void;

// =============================================================================
// UI TYPES
// =============================================================================

export interface UIElements {
  scoreLabel: GameObj;
  pauseGroup: GameObj;
  dashBar: GameObj;
}

// =============================================================================
// CALLBACK TYPES
// =============================================================================

export interface DuckGameProps {
  onScoreUpdate: (score: number) => void;
  onHealthUpdate: (health: number) => void;
  onGameOver: (score: number, commentary: string) => void;
  skin: DuckSkin;
}

// =============================================================================
// ENTITY TYPES
// =============================================================================

export type EntityTag =
  | 'player'
  | 'ground-physics'
  | 'ground-visual'
  | 'platform'
  | 'cloud'
  | 'obstacle'
  | 'danger'
  | 'slime'
  | 'frog'
  | 'bat'
  | 'enemy'
  | 'bread'
  | 'shield-item'
  | 'magnet-item'
  | 'heart-item';
