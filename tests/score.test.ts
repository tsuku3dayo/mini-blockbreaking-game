import { describe, expect, it } from 'vitest';
import { createGame } from '../src/game';
import { summarize, timeBonus } from '../src/score';

describe('スコア（TC-0006）', () => {
  it('TC-0006-01 95,789 ms でクリア', () => {
    const state = createGame();
    state.status = 'cleared';
    state.broken = 40;
    state.elapsedMs = 95789;
    expect(summarize(state)).toEqual({
      result: 'cleared',
      broken: 40,
      blockScore: 400,
      timeBonus: 850,
      total: 1250,
      elapsedMs: 95789,
    });
  });

  it('TC-0006-03 180 秒以上は時間ボーナス 0', () => {
    expect(timeBonus('cleared', 180000)).toBe(0);
    expect(timeBonus('cleared', 250000)).toBe(0);
    expect(timeBonus('cleared', 179999)).toBe(10);
    // 1 秒未満でクリアなら最大の 1,800
    expect(timeBonus('cleared', 999)).toBe(1800);
  });

  it('TC-0006-04 ゲームオーバーは時間ボーナス 0', () => {
    const state = createGame();
    state.status = 'gameOver';
    state.broken = 12;
    state.elapsedMs = 30000;
    const summary = summarize(state);
    expect(summary.result).toBe('gameOver');
    expect(summary.timeBonus).toBe(0);
    expect(summary.total).toBe(120);
    expect(timeBonus('gameOver', 1000)).toBe(0);
  });
});
