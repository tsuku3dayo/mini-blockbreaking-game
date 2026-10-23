import { describe, expect, it } from 'vitest';
import { createAccumulator, advance } from '../src/loop';
import { blockScore, createGame, currentSpeed, pause, resume, step, type GameEvent, type GameState, type StepInput } from '../src/game';

const pointer = (x: number | null, launch = false): StepInput => ({ source: 'pointer', dir: 0, pointerX: x, launch });
const keyboard = (dir: -1 | 0 | 1): StepInput => ({ source: 'keyboard', dir, pointerX: null, launch: false });

function run(state: GameState, input: StepInput, times: number, events: GameEvent[] = []): GameEvent[] {
  for (let i = 0; i < times; i++) step(state, input, events);
  return events;
}

/** プレイ中にして、ボールの位置・速度を決める */
function playing(x: number, y: number, vx: number, vy: number): GameState {
  const state = createGame();
  state.status = 'playing';
  state.ball = { x, y, vx, vy };
  return state;
}

/** テスト用の決まった乱数（線形合同法）。同じ種なら同じ列になる */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** 決まった入力列：ポインタを左右に動かし、ときどき発射する */
function inputSequence(length: number, seed: number): StepInput[] {
  const rand = lcg(seed);
  const inputs: StepInput[] = [];
  let x = 240;
  for (let i = 0; i < length; i++) {
    x = Math.min(480, Math.max(0, x + (rand() - 0.5) * 40));
    inputs.push(i % 50 === 0 ? pointer(x, true) : rand() < 0.3 ? keyboard(rand() < 0.5 ? -1 : 1) : pointer(x));
  }
  return inputs;
}

describe('発射（TC-0002）', () => {
  it('TC-0002-01 開始直後の状態', () => {
    const state = createGame();
    expect(state.paddleX).toBe(240);
    expect(state.ball).toEqual({ x: 240, y: 593, vx: 0, vy: 0 });
    expect(state.alive).toHaveLength(40);
    expect(state.alive.every((a) => a)).toBe(true);
    expect(state.broken).toBe(0);
    expect(state.speedLevel).toBe(0);
    expect(state.elapsedMs).toBe(0);
    expect(state.status).toBe('ready');
  });

  it('TC-0002-02 発射前は追従し、時間が増えない', () => {
    const state = createGame();
    run(state, pointer(100), 120);
    expect(state.ball).toEqual({ x: 100, y: 593, vx: 0, vy: 0 });
    expect(state.elapsedMs).toBe(0);
    expect(state.status).toBe('ready');
  });

  it('TC-0002-03 発射直後の速度', () => {
    const state = createGame();
    const events = run(state, pointer(240, true), 1);
    expect(state.status).toBe('playing');
    expect(state.ball.vx).toBeCloseTo(102.61, 2);
    expect(state.ball.vy).toBeCloseTo(-281.91, 2);
    expect(events).toEqual([{ type: 'launch' }]);
    expect(state.elapsedMs).toBe(0);
  });
});

describe('パドル（TC-0003・TC-0008）', () => {
  it('TC-0003-08 パドルの範囲は 40〜440', () => {
    const left = createGame();
    run(left, keyboard(-1), 600);
    expect(left.paddleX).toBe(40);

    const zero = createGame();
    step(zero, pointer(0), []);
    expect(zero.paddleX).toBe(40);

    const max = createGame();
    step(max, pointer(480), []);
    expect(max.paddleX).toBe(440);
  });

  it('TC-0008-03 キーボードは 420 px/秒、両方押し（dir = 0）は止まる', () => {
    const state = createGame();
    state.paddleX = 40;
    // 0.5 秒で 210 動く
    run(state, keyboard(1), 60);
    expect(state.paddleX).toBeCloseTo(250, 9);
    // さらに 0.5 秒（合わせて 420 動く分）で、上限の 440 に止まる
    run(state, keyboard(1), 60);
    expect(state.paddleX).toBe(440);

    const both = createGame();
    run(both, keyboard(0), 120);
    expect(both.paddleX).toBe(240);
  });
});

describe('打ち返し・壁（TC-0003）', () => {
  it('TC-0003-09 決まった入力列で 10,000 ステップ動かしても、垂直成分は速さの 0.5 倍以上', () => {
    let state = createGame();
    const inputs = inputSequence(10_000, 1);
    let playingSteps = 0;
    for (const input of inputs) {
      // 終わったら新しいゲームで続ける
      if (state.status === 'cleared' || state.status === 'gameOver') state = createGame();
      step(state, input, []);
      if (state.status === 'playing') {
        playingSteps++;
        expect(Math.abs(state.ball.vy)).toBeGreaterThanOrEqual(0.5 * currentSpeed(state) - 1e-9);
      }
    }
    // プレイ中のステップを十分に通ったこと
    expect(playingSteps).toBeGreaterThan(5000);
  });
});

describe('ブロック・得点・加速（TC-0004）', () => {
  it('TC-0004-01 1 個壊して 10 点', () => {
    // ブロック 32（x 18〜70、y 184〜204）の下面へ上向きに
    const state = playing(44, 212, 0, -300);
    const events = run(state, pointer(null), 1);
    expect(state.alive[32]).toBe(false);
    expect(state.broken).toBe(1);
    expect(blockScore(state)).toBe(10);
    expect(events).toContainEqual({ type: 'block', row: 4, count: 1 });
  });

  it('TC-0004-02 2 個同時に壊して 20 点、反射は 1 回', () => {
    const state = playing(72, 212, 0, -300);
    const events = run(state, pointer(null), 1);
    expect(state.alive[32]).toBe(false);
    expect(state.alive[33]).toBe(false);
    expect(blockScore(state)).toBe(20);
    expect(state.ball.vy).toBeGreaterThan(0);
    expect(events).toContainEqual({ type: 'block', row: 4, count: 2 });
  });

  it.each([
    [9, 1, 330],
    [19, 2, 360],
    [29, 3, 390],
  ])('TC-0004-05 壊した数 %i から 1 個壊すと段階 %i・速さ %i、向きは保つ', (before, level, speed) => {
    // 30° の向きでブロック 32 の下面に当てる。反射後は (150, 259.81) の向き
    const state = playing(44, 212, 150, -259.8076211353316);
    state.broken = before;
    state.speedLevel = level - 1;
    const prevSpeed = currentSpeed(state);
    state.ball.vx = prevSpeed * Math.sin(Math.PI / 6);
    state.ball.vy = -prevSpeed * Math.cos(Math.PI / 6);
    const events = run(state, pointer(null), 1);
    expect(state.speedLevel).toBe(level);
    expect(currentSpeed(state)).toBeCloseTo(speed, 9);
    expect(Math.hypot(state.ball.vx, state.ball.vy)).toBeCloseTo(speed, 9);
    // 反射後の向き（下向き 30°）のまま
    expect(Math.atan2(state.ball.vx, state.ball.vy)).toBeCloseTo(Math.PI / 6, 9);
    expect(events).toContainEqual({ type: 'speedUp', level });
  });

  it('TC-0004-06 段階は 3 で止まり、40 個で速さ 390', () => {
    const state = playing(44, 212, 0, -390);
    state.alive.fill(false);
    state.alive[32] = true;
    state.broken = 39;
    state.speedLevel = 3;
    const events = run(state, pointer(null), 1);
    expect(state.broken).toBe(40);
    expect(state.speedLevel).toBe(3);
    expect(currentSpeed(state)).toBeCloseTo(390, 9);
    expect(events.some((e) => e.type === 'speedUp')).toBe(false);
  });
});

describe('終了（TC-0005）', () => {
  it('TC-0005-01 最後の 1 個を壊すとクリア', () => {
    const state = playing(44, 212, 0, -390);
    state.alive.fill(false);
    state.alive[32] = true;
    state.broken = 39;
    state.speedLevel = 3;
    const events = run(state, pointer(null), 1);
    expect(state.status).toBe('cleared');
    expect(events).toContainEqual({ type: 'clear' });
  });

  it('TC-0005-02 ボールの上端が 640 を超えたステップでゲームオーバー', () => {
    // パドル（200〜280）から離れた所を、下向きに落とす
    const state = playing(100, 640, 0, 300);
    const events: GameEvent[] = [];
    let prevTop = state.ball.y - 6;
    while (state.status === 'playing') {
      prevTop = state.ball.y - 6;
      step(state, pointer(null), events);
      if (state.status === 'playing') expect(state.ball.y - 6).toBeLessThanOrEqual(640);
    }
    expect(state.status).toBe('gameOver');
    expect(prevTop).toBeLessThanOrEqual(640);
    expect(state.ball.y - 6).toBeGreaterThan(640);
    expect(events).toEqual([{ type: 'gameOver' }]);
  });

  it('TC-0005-03 クリアとゲームオーバーが同じステップならクリア', () => {
    // 最後のブロックを壊すときにボールが下端の外にいる配置は作れないので、
    // 40 個目まで壊した状態でボールが下端の外へ出るステップを作り、判定の順を確かめる
    const state = playing(100, 645, 0, 300);
    state.alive.fill(false);
    state.broken = 40;
    state.speedLevel = 3;
    const events = run(state, pointer(null), 1);
    expect(state.status).toBe('cleared');
    expect(events).toContainEqual({ type: 'clear' });
    expect(events.some((e) => e.type === 'gameOver')).toBe(false);
  });

  it('TC-0005-04 同じ入力列（5,000 ステップ）なら同じ結果', () => {
    const inputs = inputSequence(5000, 42);
    const play = () => {
      const state = createGame();
      const events: GameEvent[] = [];
      for (const input of inputs) step(state, input, events);
      return { state: JSON.stringify(state), events: JSON.stringify(events) };
    };
    const a = play();
    const b = play();
    expect(a.state).toBe(b.state);
    expect(a.events).toBe(b.events);
  });

  it('TC-0005-05 フレームの間隔によらず、1 秒で 120 ステップ・同じ結果', () => {
    const results = [7, 16.7, 33.3].map((dt) => {
      const acc = createAccumulator();
      const state = createGame();
      let total = 0;
      const times: number[] = [];
      for (let t = 0; t < 1000; t += dt) times.push(t);
      times.push(1000);
      for (const t of times) {
        const n = advance(acc, t);
        for (let i = 0; i < n; i++) {
          // 入力はステップの番号だけで決める（最初のステップで発射）
          step(state, pointer(200 + (total % 80), total === 0), []);
          total++;
        }
      }
      return { total, state: JSON.stringify(state) };
    });
    for (const r of results) expect(r.total).toBe(120);
    expect(results[1].state).toBe(results[0].state);
    expect(results[2].state).toBe(results[0].state);
  });

  it('TC-0005-10 経過時間はプレイ中だけ増える', () => {
    const state = createGame();
    // ブロックをなくして、クリアにならないようにする。パドルをボールに合わせ続けて落とさない
    state.alive.fill(false);
    run(state, pointer(240), 120);
    expect(state.elapsedMs).toBe(0);
    step(state, pointer(240, true), []);
    for (let i = 0; i < 5039; i++) step(state, pointer(state.ball.x), []);
    expect(state.status).toBe('playing');
    expect(state.elapsedMs).toBeCloseTo(41991.67, 1);
    expect(Math.floor(state.elapsedMs / 1000)).toBe(41);
  });
});

describe('一時停止（TC-0009）', () => {
  it('TC-0009-06 止める前の状態に戻る・終了後は止められない', () => {
    const ready = createGame();
    expect(pause(ready)).toBe(true);
    expect(ready.status).toBe('paused');
    expect(resume(ready)).toBe(true);
    expect(ready.status).toBe('ready');

    const play = playing(240, 400, 0, -300);
    expect(pause(play)).toBe(true);
    // 一時停止中は step しても何も変わらない
    const before = JSON.stringify(play);
    run(play, pointer(100), 10);
    expect(JSON.stringify(play)).toBe(before);
    expect(resume(play)).toBe(true);
    expect(play.status).toBe('playing');

    const over = createGame();
    over.status = 'gameOver';
    expect(pause(over)).toBe(false);
    expect(over.status).toBe('gameOver');
    expect(resume(over)).toBe(false);
  });
});
