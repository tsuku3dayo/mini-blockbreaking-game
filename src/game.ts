// ゲームの状態と型（TD-0002 §2）。状態の作成・1 ステップの更新は TASK-0005 で足す

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
