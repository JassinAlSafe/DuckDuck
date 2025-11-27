import { KAPLAYCtx, Vec2, Color } from 'kaplay';
import { COLORS, Z_INDEX, ANIMATION } from '../constants';

type K = KAPLAYCtx<{}, never>;

/**
 * Spawns dust particles at a position (e.g., on landing)
 */
export function spawnDust(k: K, pos: Vec2): void {
  for (let i = 0; i < 4; i++) {
    k.add([
      k.rect(4, 4),
      k.pos(pos),
      k.color(COLORS.DUST[0], COLORS.DUST[1], COLORS.DUST[2]),
      k.move(k.choose([k.LEFT, k.RIGHT, k.UP]), k.rand(20, 60)),
      k.opacity(1),
      k.lifespan(ANIMATION.DUST_LIFESPAN, { fade: 0.1 }),
      k.z(Z_INDEX.DUST)
    ]);
  }
}

/**
 * Spawns bread crumb particles when collecting bread
 */
export function spawnCrumbs(k: K, pos: Vec2): void {
  for (let i = 0; i < 6; i++) {
    k.add([
      k.rect(3, 3),
      k.pos(pos),
      k.color(COLORS.CRUMBS[0], COLORS.CRUMBS[1], COLORS.CRUMBS[2]),
      k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(60, 100)),
      k.opacity(1),
      k.lifespan(ANIMATION.CRUMBS_LIFESPAN, { fade: 0.1 }),
      k.z(Z_INDEX.CRUMBS)
    ]);
  }
}

/**
 * Spawns explosion particles when destroying enemies
 */
export function spawnExplosion(k: K, pos: Vec2): void {
  for (let i = 0; i < 8; i++) {
    k.add([
      k.rect(5, 5),
      k.pos(pos),
      k.color(COLORS.EXPLOSION[0], COLORS.EXPLOSION[1], COLORS.EXPLOSION[2]),
      k.move(k.Vec2.fromAngle(k.rand(0, 360)), k.rand(100, 200)),
      k.lifespan(ANIMATION.EXPLOSION_LIFESPAN, { fade: 0.1 }),
      k.opacity(1),
      k.z(Z_INDEX.EXPLOSION)
    ]);
  }
}

/**
 * Shows floating text that rises and fades out
 */
export function showFloatingText(
  k: K,
  txt: string,
  pos: Vec2,
  color?: Color
): void {
  const textColor = color ?? k.rgb(COLORS.FLOATING_TEXT[0], COLORS.FLOATING_TEXT[1], COLORS.FLOATING_TEXT[2]);

  k.add([
    k.text(txt, { size: 20 }),
    k.pos(pos),
    k.color(textColor),
    k.move(k.UP, 50),
    k.opacity(1),
    k.lifespan(ANIMATION.FLOATING_TEXT_DURATION, { fade: 0.5 }),
    k.z(Z_INDEX.FLOATING_TEXT)
  ]);
}

/**
 * Creates the dash boom effect
 */
export function createDashBoom(k: K, pos: Vec2): void {
  const boom = k.add([
    k.circle(10),
    k.pos(pos),
    k.anchor("center"),
    k.color(200, 255, 255),
    k.opacity(0.8),
    k.scale(1),
    k.z(Z_INDEX.DASH_TRAIL),
    k.outline(3, k.rgb(255, 255, 255))
  ]);

  k.tween(1, 6, ANIMATION.DASH_BOOM_DURATION, (val) => boom.scale = k.vec2(val), k.easings.easeOutExpo);
  k.tween(0.8, 0, ANIMATION.DASH_BOOM_DURATION, (val) => boom.opacity = val, k.easings.linear)
    .then(() => k.destroy(boom));
}

/**
 * Spawns dash trail particles
 */
export function spawnDashTrail(k: K, playerPos: Vec2, playerScale: Vec2): void {
  // Ghost trail
  k.add([
    k.rect(16, 16),
    k.pos(playerPos),
    k.scale(playerScale),
    k.anchor("center"),
    k.color(COLORS.DUST[0], COLORS.DUST[1], COLORS.DUST[2]),
    k.opacity(0.4),
    k.lifespan(ANIMATION.DASH_TRAIL_LIFESPAN, { fade: 0.15 }),
    k.z(Z_INDEX.DASH_EFFECT)
  ]);

  // Speed lines
  k.add([
    k.rect(k.rand(10, 30), 2),
    k.pos(playerPos.x - k.rand(10, 30), playerPos.y + k.rand(-10, 10)),
    k.color(255, 255, 255),
    k.move(k.LEFT, 800),
    k.opacity(1),
    k.lifespan(0.1, { fade: 0.1 }),
    k.z(Z_INDEX.DASH_TRAIL)
  ]);
}
