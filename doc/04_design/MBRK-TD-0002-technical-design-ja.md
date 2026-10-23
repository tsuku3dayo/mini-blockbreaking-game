---
id: MBRK-TD-0002
type: Technical Design
title: ゲームのロジック（状態・1 ステップ・衝突・スコア・ループの時間計算）
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-TD-0001
  - MBRK-ADR-0004
  - MBRK-US-0002
  - MBRK-US-0003
  - MBRK-US-0004
  - MBRK-US-0005
  - MBRK-US-0006
  - doc/specification.md (v1.1) §3、§5、§6、§7、§11
verified: null
---

# TD-0002 ゲームのロジック

すべて DOM・時刻・乱数に触れない関数にする（ADR-0004）。対象のファイルは `config.ts`・`game.ts`・`collision.ts`・`score.ts`・`loop.ts`。

## 1. パラメータ（`config.ts`）

仕様書 §11 の値を、同じ名前の定数で `export const` する（例：`FIELD_WIDTH = 480`、`STEP_MS = 1000 / 120`、`STEP_SEC = 1 / 120`）。派生する値も、ここで計算して持つ。

| 定数 | 値 |
| --- | --- |
| `PADDLE_MIN_X` / `PADDLE_MAX_X` | 40 / 440（`PADDLE_WIDTH / 2`、`FIELD_WIDTH − PADDLE_WIDTH / 2`） |
| `BALL_READY_Y` | 593（`PADDLE_Y − BALL_RADIUS − 1`） |
| `BLOCK_COUNT` | 40 |
| `LAUNCH_ANGLE_RAD` / `MAX_BOUNCE_ANGLE_RAD` | 度をラジアンにした値 |
| `EPSILON_MS` | 1e-6（ループの浮動小数点誤差の許容値） |

## 2. 型

```ts
export type GameStatus = 'ready' | 'playing' | 'paused' | 'cleared' | 'gameOver';

export interface Ball { x: number; y: number; vx: number; vy: number }

export interface GameState {
  status: GameStatus;
  pausedFrom: 'ready' | 'playing' | null; // 一時停止の前の状態
  paddleX: number;                        // パドル中心 x
  ball: Ball;
  alive: boolean[];                       // 長さ 40。index = ブロック ID（行 × 8 + 列）
  broken: number;                         // 壊した数
  speedLevel: number;                     // 0〜3
  elapsedMs: number;                      // プレイ中だけ増える
}

/** 1 ステップに渡す入力（input.ts が作る） */
export interface StepInput {
  source: 'keyboard' | 'pointer';
  dir: -1 | 0 | 1;          // キーボードの向き
  pointerX: number | null;  // ポインタの論理 x（0〜480 に丸め済み）。なければ null
  launch: boolean;          // このステップで取り出した発射要求
}

/** 1 ステップで起きた出来事（効果音・読み上げ・テストに使う） */
export type GameEvent =
  | { type: 'launch' }
  | { type: 'paddle' }                       // 打ち返した（押し出しだけのときは出さない）
  | { type: 'wall' }                         // 壁・天井で跳ね返った
  | { type: 'block'; row: number; count: number } // row は代表ブロックの行
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
```

- ブロックの位置・大きさは ID から計算できるので、状態には持たない（`blockRect(id)` を `collision.ts` に置く）。
- 状態は **1 ステップごとに書き換える**（新しい物を作らない）。1 秒に 120 回呼ぶので、ごみを減らして 60 fps を保つため（ADR-0004 で 04 に残した判断）。テストでは `createGame()` で作った状態を書き換えて使う。

## 3. `game.ts` の関数

| 関数 | 内容 |
| --- | --- |
| `createGame(): GameState` | 新しいゲーム（仕様書 §3 の初期配置、`status = 'ready'`、すべて 0） |
| `step(state, input, events): void` | 1 ステップ進める（§4）。起きた出来事を `events` 配列に追加する |
| `pause(state): boolean` | 発射前・プレイ中なら一時停止にして `true`。それ以外は何もせず `false` |
| `resume(state): boolean` | 一時停止中なら `pausedFrom` の状態に戻して `true` |
| `currentSpeed(state): number` | `300 × (1 + 0.1 × speedLevel)` |
| `blockScore(state): number` | `broken × 10` |

## 4. 1 ステップ（`step`、仕様書 §5.2）

```
step(state, input, events):
  if status が ready / playing 以外: return
  1. パドル移動
       source = keyboard → paddleX += dir × 420 × STEP_SEC
       source = pointer かつ pointerX ≠ null → paddleX = pointerX
       paddleX = clamp(paddleX, 40, 440)
  2. status = ready のとき
       ball = (paddleX, 593)、速度 0
       launch なら：速度 = (speed × sin20°, −speed × cos20°)、status = playing、events に launch
       return（経過時間は増やさない）
  3. status = playing のとき
       elapsedMs += STEP_MS
       speed = currentSpeed(state)
       ball.x += vx × STEP_SEC、ball.y += vy × STEP_SEC
       collideWalls(ball)            → 当たれば events に wall
       collidePaddle(ball, paddleX, speed)
                                     → 打ち返したら events に paddle。重なったら enforceMinVy(ball, speed)
       hits = collideBlocks(ball, alive, speed)
                                     → 壊した ID を alive から消し、broken += 数、events に block（代表の行・数）
       段階 = min(3, floor(broken / 10))
       段階が上がったら：speedLevel を更新、速度ベクトルを新しい速さに合わせる（向きは保つ）、events に speedUp
       broken ≥ 40 → status = cleared、events に clear、return
       ball.y − 6 > 640 → status = gameOver、events に gameOver
```

## 5. 衝突（`collision.ts`）

| 関数 | 内容（仕様書） |
| --- | --- |
| `circleRect(cx, cy, r, x, y, w, h): Overlap \| null` | 最近点・距離・`depth`・`overlapX`・`overlapY` を返す。`d < r` のときだけ返す（§5.9） |
| `collideWalls(ball): boolean` | 左壁 → 右壁（排他）→ 天井。向きは絶対値で設定（§5.4） |
| `collidePaddle(ball, paddleX, speed): 'bounce' \| 'push' \| 'side' \| null` | §5.5 の A（打ち返し / 押し出し）・B（側面）。`null` は重なりなし |
| `collideBlocks(ball, alive, speed): BlockHit \| null` | 重なったブロックを全部集め、全部壊す。代表は `depth` 最大、同じなら ID 最小。代表で反射を 1 回。最後に `enforceMinVy`（§5.6） |
| `enforceMinVy(ball, speed): void` | §5.7 |
| `blockRect(id)` | `x = 18 + 列 × 56`、`y = 88 + 行 × 24`、`w = 52`、`h = 20` |

- 浮動小数点の比較は、仕様書のとおり `<`・`≤` をそのまま使う（許容値を足さない）。仕様書の決定性（同じ入力 → 同じ結果）は、同じ順の同じ計算で保たれる。
- 符号の関数は、仕様書 §5.7 のとおり「負なら −1、それ以外は +1」（`Math.sign` は 0 で 0 を返すので使わない）。

## 6. スコア（`score.ts`）

| 関数 | 内容 |
| --- | --- |
| `timeBonus(result, elapsedMs)` | クリア：`max(0, 180 − floor(elapsedMs / 1000)) × 10`、ゲームオーバー：0 |
| `summarize(state): ResultSummary` | 終了した状態から結果サマリを作る（仕様書 §7.2） |

## 7. ループの時間計算（`loop.ts`）

```ts
export interface Accumulator { last: number | null; acc: number }
export function createAccumulator(): Accumulator;      // { last: null, acc: 0 }
export function resetAccumulator(a: Accumulator): void; // 再開時。止まっていた時間を進めない
/** now（ミリ秒）までに進めるステップ数を返し、蓄積を減らす */
export function advance(a: Accumulator, now: number): number;
```

- `advance`：`last` が `null` なら `last = now` として 0 を返す。そうでなければ `delta = min(now − last, 100)`、`acc += delta`、`n = floor((acc + 1e-6) / STEP_MS)`、`acc −= n × STEP_MS`（負なら 0）、`last = now`、`n` を返す。
- 画面層は `n` 回 `step` を呼び、途中で状態が発射前・プレイ中以外になったら残りを呼ばない（仕様書 §5.1）。

## 8. 単体テストで確かめること（05 で test-case に展開する）

| 対象 | 確かめること | 仕様書 |
| --- | --- | --- |
| `createGame` | 初期配置 | §12.1-1 |
| `step`（発射前） | 追従・経過時間が増えない・発射速度 | §12.1-2、3 |
| `collidePaddle` | 中央で真上、端で 60°、押し出し、側面 | §12.1-4 |
| `collideWalls` | 左右・天井、下端なし | §12.1-5 |
| `step`（パドル） | 40〜440 に丸める、キーボード 420 px/秒、両方押しで停止 | §12.1-6 |
| `collideBlocks` | 2 個同時に壊れて 20 点、反射 1 回、代表の選び方、角 | §12.1-7 |
| `step`（加速） | 10・20・30 個目で 330・360・390、向きを保つ | §12.1-8 |
| `enforceMinVy` | `|vy| ≥ 0.5 × speed`、符号を保つ | §12.1-9 |
| `step`（終了） | クリア・ゲームオーバー・同じステップならクリア | §12.1-10、11 |
| `step` を同じ入力列で 2 回 | 同じ結果 | §12.1-12 |
| `timeBonus` / `summarize` | 95,789 ms → 850・1,250、180 秒以上で 0、ゲームオーバーで 0 | §12.3 |
| `advance` | 100 ms の上限、蓄積、再開で 0 | §5.1 |
