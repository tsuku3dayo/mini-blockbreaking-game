import { describe, expect, it } from 'vitest';
import { createGame, step, type GameEvent } from '../src/game';
import { planSounds } from '../src/sound-plan';

const block = (row: number, count = 1): GameEvent => ({ type: 'block', row, count });

describe('鳴らす音を決める（TC-0015）', () => {
  it('TC-0015-02 2 個同時に壊しても block は 1 回', () => {
    expect(planSounds([block(4, 2)])).toEqual([{ name: 'block', row: 4 }]);
    expect(planSounds([block(3), block(2)])).toEqual([{ name: 'block', row: 3 }]);
  });

  it('TC-0015-03 最後のブロックを壊したフレームは clear だけ', () => {
    expect(planSounds([{ type: 'paddle' }, block(0), { type: 'speedUp', level: 3 }, { type: 'clear' }])).toEqual([{ name: 'clear' }]);
    expect(planSounds([{ type: 'wall' }, { type: 'gameOver' }])).toEqual([{ name: 'gameOver' }]);
  });

  it('TC-0015-06 block の row で音の高さを変える（0 が最上段）', () => {
    expect(planSounds([block(0)])).toEqual([{ name: 'block', row: 0 }]);
    expect(planSounds([block(4)])).toEqual([{ name: 'block', row: 4 }]);
  });

  it('TC-0015-07 押し出しでは paddle の出来事が出ない', () => {
    // 上向きのボールがパドルに重なっている（押し出しになる）
    const state = createGame();
    state.status = 'playing';
    state.ball = { x: 240, y: 598, vx: 0, vy: -300 };
    const events: GameEvent[] = [];
    step(state, { source: 'keyboard', dir: 0, pointerX: null, launch: false }, events);
    // 押し出された（パドルの上面 600 − 半径 6 の位置）ことを確かめてから
    expect(state.ball.y).toBe(594);
    expect(state.ball.vy).toBe(-300);
    expect(events.some((e) => e.type === 'paddle')).toBe(false);
    expect(planSounds(events).some((s) => s.name === 'paddle')).toBe(false);
  });

  it('TC-0015-08 1 フレームで同じ種類は 1 回、決まった順に並べる', () => {
    expect(planSounds([{ type: 'wall' }, { type: 'wall' }, { type: 'paddle' }, { type: 'wall' }])).toEqual([{ name: 'paddle' }, { name: 'wall' }]);
    expect(planSounds([{ type: 'speedUp', level: 1 }, block(2), { type: 'launch' }])).toEqual([
      { name: 'launch' },
      { name: 'block', row: 2 },
      { name: 'speedUp' },
    ]);
    expect(planSounds([])).toEqual([]);
  });
});
