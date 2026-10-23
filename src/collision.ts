import {
  BALL_RADIUS,
  BLOCK_COLS,
  BLOCK_COUNT,
  BLOCK_GAP,
  BLOCK_HEIGHT,
  BLOCK_OFFSET_X,
  BLOCK_OFFSET_Y,
  BLOCK_WIDTH,
  FIELD_WIDTH,
  HUD_HEIGHT,
  MAX_BOUNCE_ANGLE_RAD,
  MIN_VY_RATIO,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_Y,
} from './config';
import type { Ball } from './game';

// 衝突（TD-0002 §5、仕様書 §5.4〜5.7、§5.9）。
// 浮動小数点の比較は、仕様書のとおり < ・ ≤ をそのまま使う（許容値を足さない）

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 円と矩形の重なり（§5.9） */
export interface Overlap {
  /** 矩形の上の、円の中心に最も近い点 */
  nearestX: number;
  nearestY: number;
  /** 中心から最近点までの距離 */
  distance: number;
  /** r − distance */
  depth: number;
  overlapX: number;
  overlapY: number;
}

/** ブロックとの衝突の結果 */
export interface BlockHit {
  /** 壊したブロックの ID（小さい順） */
  ids: number[];
  /** 代表ブロック（反射に使った 1 個）の ID */
  representative: number;
  /** 代表ブロックの行 */
  row: number;
}

/** 負なら −1、それ以外は +1（Math.sign は 0 で 0 を返すので使わない。§5.7） */
function sign(v: number): -1 | 1 {
  return v < 0 ? -1 : 1;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/** ブロックの矩形（§3.3） */
export function blockRect(id: number): Rect {
  const row = Math.floor(id / BLOCK_COLS);
  const col = id % BLOCK_COLS;
  return {
    x: BLOCK_OFFSET_X + col * (BLOCK_WIDTH + BLOCK_GAP),
    y: BLOCK_OFFSET_Y + row * (BLOCK_HEIGHT + BLOCK_GAP),
    w: BLOCK_WIDTH,
    h: BLOCK_HEIGHT,
  };
}

/** 円と矩形が重なっていれば（d < r）その様子を返す。接しているだけ（d = r）は null（§5.9） */
export function circleRect(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number): Overlap | null {
  const nearestX = clamp(cx, x, x + w);
  const nearestY = clamp(cy, y, y + h);
  const distance = Math.hypot(cx - nearestX, cy - nearestY);
  if (!(distance < r)) return null;
  return {
    nearestX,
    nearestY,
    distance,
    depth: r - distance,
    overlapX: Math.min(cx + r - x, x + w - (cx - r)),
    overlapY: Math.min(cy + r - y, y + h - (cy - r)),
  };
}

/** 左右の壁と天井で跳ね返す。向きは符号反転ではなく絶対値で設定する。当たったら true（§5.4） */
export function collideWalls(ball: Ball): boolean {
  let hit = false;
  if (ball.x - BALL_RADIUS < 0) {
    ball.x = BALL_RADIUS;
    ball.vx = Math.abs(ball.vx);
    hit = true;
  } else if (ball.x + BALL_RADIUS > FIELD_WIDTH) {
    ball.x = FIELD_WIDTH - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx);
    hit = true;
  }
  if (ball.y - BALL_RADIUS < HUD_HEIGHT) {
    ball.y = HUD_HEIGHT + BALL_RADIUS;
    ball.vy = Math.abs(ball.vy);
    hit = true;
  }
  return hit;
}

/**
 * パドルとの衝突（§5.5）。重なっていなければ null。
 * 'bounce'：上面で打ち返した、'push'：上向きのボールを押し出しただけ、'side'：側面・角。
 * 最小垂直成分の補正（enforceMinVy）は呼び出し側が行う
 */
export function collidePaddle(ball: Ball, paddleX: number, speed: number): 'bounce' | 'push' | 'side' | null {
  const left = paddleX - PADDLE_WIDTH / 2;
  if (!circleRect(ball.x, ball.y, BALL_RADIUS, left, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT)) return null;

  if (ball.y <= PADDLE_Y) {
    ball.y = PADDLE_Y - BALL_RADIUS;
    if (ball.vy < 0) return 'push';
    // 当たった位置だけで向きを決める（打ち返す前の向き・速さによらない）
    const offset = clamp((ball.x - paddleX) / (PADDLE_WIDTH / 2), -1, 1);
    const angle = offset * MAX_BOUNCE_ANGLE_RAD;
    ball.vx = speed * Math.sin(angle);
    ball.vy = -speed * Math.cos(angle);
    return 'bounce';
  }

  if (ball.x < paddleX) {
    ball.x = left - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx);
  } else {
    ball.x = left + PADDLE_WIDTH + BALL_RADIUS;
    ball.vx = Math.abs(ball.vx);
  }
  return 'side';
}

/**
 * ブロックとの衝突（§5.6）。重なったブロックはすべて壊し（alive を false にする）、
 * 最も深く重なった 1 個（同じなら ID の小さい方）で 1 回だけ反射する。最後に enforceMinVy をかける。
 * 重なりがなければ null
 */
export function collideBlocks(ball: Ball, alive: boolean[], speed: number): BlockHit | null {
  const ids: number[] = [];
  let representative = -1;
  let best: Overlap | null = null;
  for (let id = 0; id < BLOCK_COUNT; id++) {
    if (!alive[id]) continue;
    // 1 秒に 120 回呼ぶので、ブロックごとの矩形の物は作らずに位置を計算する（TD-0002 §2）
    const x = BLOCK_OFFSET_X + (id % BLOCK_COLS) * (BLOCK_WIDTH + BLOCK_GAP);
    const y = BLOCK_OFFSET_Y + Math.floor(id / BLOCK_COLS) * (BLOCK_HEIGHT + BLOCK_GAP);
    const overlap = circleRect(ball.x, ball.y, BALL_RADIUS, x, y, BLOCK_WIDTH, BLOCK_HEIGHT);
    if (!overlap) continue;
    ids.push(id);
    // ID の小さい順に見るので、深さが同じなら先の（小さい）方が残る
    if (!best || overlap.depth > best.depth) {
      best = overlap;
      representative = id;
    }
  }
  if (!best) return null;

  for (const id of ids) alive[id] = false;

  const rect = blockRect(representative);
  if (best.overlapX <= best.overlapY) {
    // 側面
    if (ball.x < rect.x + rect.w / 2) {
      ball.x = rect.x - BALL_RADIUS;
      ball.vx = -Math.abs(ball.vx);
    } else {
      ball.x = rect.x + rect.w + BALL_RADIUS;
      ball.vx = Math.abs(ball.vx);
    }
  }
  if (best.overlapY <= best.overlapX) {
    // 上下面（overlapX と等しい角では、側面と両方を行う）
    if (ball.y < rect.y + rect.h / 2) {
      ball.y = rect.y - BALL_RADIUS;
      ball.vy = -Math.abs(ball.vy);
    } else {
      ball.y = rect.y + rect.h + BALL_RADIUS;
      ball.vy = Math.abs(ball.vy);
    }
  }
  enforceMinVy(ball, speed);
  return { ids, representative, row: Math.floor(representative / BLOCK_COLS) };
}

/** 垂直成分が速さの 0.5 倍より小さければ、符号を保って 0.5 倍にし、速さを speed にそろえる（§5.7） */
export function enforceMinVy(ball: Ball, speed: number): void {
  const minVy = speed * MIN_VY_RATIO;
  if (Math.abs(ball.vy) >= minVy) return;
  ball.vy = sign(ball.vy) * minVy;
  ball.vx = sign(ball.vx) * Math.sqrt(speed * speed - ball.vy * ball.vy);
}
