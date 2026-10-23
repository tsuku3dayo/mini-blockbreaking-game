import { EPSILON_MS, MAX_FRAME, STEP_MS } from './config';

// ループの時間計算（TD-0002 §7、仕様書 §5.1）。時刻は引数で受け取る

export interface Accumulator {
  /** 前のフレームの時刻（ミリ秒）。まだなければ null */
  last: number | null;
  /** まだステップに使っていない時間（ミリ秒） */
  acc: number;
}

export function createAccumulator(): Accumulator {
  return { last: null, acc: 0 };
}

/** 再開するときに呼ぶ。止まっていた時間を進めない */
export function resetAccumulator(a: Accumulator): void {
  a.last = null;
  a.acc = 0;
}

/** now（ミリ秒）までに進めるステップ数を返し、蓄積を減らす。1 フレームで足すのは 100 ミリ秒まで */
export function advance(a: Accumulator, now: number): number {
  if (a.last === null) {
    a.last = now;
    return 0;
  }
  a.acc += Math.min(now - a.last, MAX_FRAME);
  a.last = now;
  const n = Math.floor((a.acc + EPSILON_MS) / STEP_MS);
  a.acc = Math.max(0, a.acc - n * STEP_MS);
  return n;
}
