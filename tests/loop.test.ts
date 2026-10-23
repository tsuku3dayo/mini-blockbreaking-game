import { describe, expect, it } from 'vitest';
import { advance, createAccumulator, resetAccumulator } from '../src/loop';

describe('ループの時間計算（TC-0005）', () => {
  it('TC-0005-05 端数は次のフレームに持ち越す', () => {
    const a = createAccumulator();
    expect(advance(a, 0)).toBe(0);
    // 1 ステップ ≈ 8.333 ms。5 ms では進まず、次の 5 ms で 1 ステップ
    expect(advance(a, 5)).toBe(0);
    expect(advance(a, 10)).toBe(1);
    // ちょうど 1 秒分なら合わせて 120（小数の誤差は許容値で吸収する）
    let total = 1;
    for (let t = 20; t <= 1010; t += 10) total += advance(a, t);
    expect(total).toBe(121);
  });

  it('TC-0005-06 1 フレームで進めるのは 100 ms まで', () => {
    const a = createAccumulator();
    advance(a, 0);
    expect(advance(a, 500)).toBe(12);
  });

  it('TC-0005-07 再開のあとは、止まっていた時間を進めない', () => {
    const a = createAccumulator();
    advance(a, 0);
    advance(a, 50);
    resetAccumulator(a);
    expect(advance(a, 10_000)).toBe(0);
    expect(a.acc).toBe(0);
  });
});
