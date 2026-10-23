import { collideBlocks, collidePaddle, collideWalls, enforceMinVy } from './collision';
import {
  BALL_INITIAL_SPEED,
  BALL_RADIUS,
  BALL_READY_Y,
  BLOCK_COUNT,
  FIELD_HEIGHT,
  LAUNCH_ANGLE_RAD,
  MAX_SPEED_LEVEL,
  PADDLE_INITIAL_X,
  PADDLE_MAX_X,
  PADDLE_MIN_X,
  PADDLE_SPEED,
  POINTS_PER_BLOCK,
  SPEED_STEP_BLOCKS,
  SPEED_STEP_RATIO,
  STEP_MS,
  STEP_SEC,
} from './config';

// ゲームの状態・1 ステップの更新（TD-0002 §2〜§4、仕様書 §5.2）。
// 状態は 1 ステップごとに書き換える（1 秒に 120 回呼ぶので、新しい物を作らない）

export type GameStatus = 'ready' | 'playing' | 'paused' | 'cleared' | 'gameOver';

/** ボールの中心座標と速度（px/秒） */
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  status: GameStatus;
  /** 一時停止の前の状態 */
  pausedFrom: 'ready' | 'playing' | null;
  /** パドル中心 x */
  paddleX: number;
  ball: Ball;
  /** 長さ 40。index = ブロック ID（行 × 8 + 列） */
  alive: boolean[];
  /** 壊した数 */
  broken: number;
  /** 0〜3 */
  speedLevel: number;
  /** プレイ中だけ増える */
  elapsedMs: number;
}

/** 1 ステップに渡す入力（input.ts が作る） */
export interface StepInput {
  source: 'keyboard' | 'pointer';
  /** キーボードの向き */
  dir: -1 | 0 | 1;
  /** ポインタの論理 x（0〜480 に丸め済み）。なければ null */
  pointerX: number | null;
  /** このステップで取り出した発射要求 */
  launch: boolean;
}

/** 1 ステップで起きた出来事（効果音・読み上げ・テストに使う） */
export type GameEvent =
  | { type: 'launch' }
  /** 打ち返した（押し出しだけのときは出さない） */
  | { type: 'paddle' }
  /** 壁・天井で跳ね返った */
  | { type: 'wall' }
  /** row は代表ブロックの行 */
  | { type: 'block'; row: number; count: number }
  | { type: 'speedUp'; level: number }
  | { type: 'clear' }
  | { type: 'gameOver' };

export interface ResultSummary {
  result: 'cleared' | 'gameOver';
  broken: number;
  blockScore: number;
  timeBonus: number;
  total: number;
  elapsedMs: number;
}

/** 新しいゲーム（仕様書 §3 の初期配置） */
export function createGame(): GameState {
  return {
    status: 'ready',
    pausedFrom: null,
    paddleX: PADDLE_INITIAL_X,
    ball: { x: PADDLE_INITIAL_X, y: BALL_READY_Y, vx: 0, vy: 0 },
    alive: new Array<boolean>(BLOCK_COUNT).fill(true),
    broken: 0,
    speedLevel: 0,
    elapsedMs: 0,
  };
}

/** 今の速さ（§5.8） */
export function currentSpeed(state: GameState): number {
  return BALL_INITIAL_SPEED * (1 + SPEED_STEP_RATIO * state.speedLevel);
}

/** ブロック得点（§6） */
export function blockScore(state: GameState): number {
  return state.broken * POINTS_PER_BLOCK;
}

/** 発射前・プレイ中なら一時停止にして true。それ以外は何もせず false */
export function pause(state: GameState): boolean {
  if (state.status !== 'ready' && state.status !== 'playing') return false;
  state.pausedFrom = state.status;
  state.status = 'paused';
  return true;
}

/** 一時停止中なら、止める前の状態に戻して true */
export function resume(state: GameState): boolean {
  if (state.status !== 'paused' || state.pausedFrom === null) return false;
  state.status = state.pausedFrom;
  state.pausedFrom = null;
  return true;
}

/** 1 ステップ進める。起きた出来事を events に足す（§5.2） */
export function step(state: GameState, input: StepInput, events: GameEvent[]): void {
  if (state.status !== 'ready' && state.status !== 'playing') return;

  // 1. パドル移動
  if (input.source === 'keyboard') {
    state.paddleX += input.dir * PADDLE_SPEED * STEP_SEC;
  } else if (input.pointerX !== null) {
    state.paddleX = input.pointerX;
  }
  state.paddleX = Math.min(Math.max(state.paddleX, PADDLE_MIN_X), PADDLE_MAX_X);

  const ball = state.ball;

  // 2. 発射前：パドル中央の真上に乗せる。このステップでは経過時間を増やさない
  if (state.status === 'ready') {
    ball.x = state.paddleX;
    ball.y = BALL_READY_Y;
    ball.vx = 0;
    ball.vy = 0;
    if (input.launch) {
      const speed = currentSpeed(state);
      ball.vx = speed * Math.sin(LAUNCH_ANGLE_RAD);
      ball.vy = -speed * Math.cos(LAUNCH_ANGLE_RAD);
      state.status = 'playing';
      events.push({ type: 'launch' });
    }
    return;
  }

  // 3. プレイ中
  state.elapsedMs += STEP_MS;
  const speed = currentSpeed(state);
  ball.x += ball.vx * STEP_SEC;
  ball.y += ball.vy * STEP_SEC;

  if (collideWalls(ball)) events.push({ type: 'wall' });

  const paddle = collidePaddle(ball, state.paddleX, speed);
  if (paddle !== null) {
    if (paddle !== 'push') events.push({ type: 'paddle' });
    enforceMinVy(ball, speed);
  }

  const hit = collideBlocks(ball, state.alive, speed);
  if (hit) {
    state.broken += hit.ids.length;
    events.push({ type: 'block', row: hit.row, count: hit.ids.length });
  }

  // 速度段階：上がったら、向きを保ったまま新しい速さに合わせる（段階は下がらない）
  const level = Math.min(MAX_SPEED_LEVEL, Math.floor(state.broken / SPEED_STEP_BLOCKS));
  if (level > state.speedLevel) {
    state.speedLevel = level;
    const scale = currentSpeed(state) / Math.hypot(ball.vx, ball.vy);
    ball.vx *= scale;
    ball.vy *= scale;
    events.push({ type: 'speedUp', level });
  }

  // クリアが成立したステップでは、落下の判定をしない
  if (state.broken >= BLOCK_COUNT) {
    state.status = 'cleared';
    events.push({ type: 'clear' });
    return;
  }
  if (ball.y - BALL_RADIUS > FIELD_HEIGHT) {
    state.status = 'gameOver';
    events.push({ type: 'gameOver' });
  }
}
