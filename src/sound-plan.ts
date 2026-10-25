import type { GameEvent } from './game';

// 出来事から鳴らす音を決める（TD-0005 §1、仕様書 §8.7）

export type SoundName = 'launch' | 'paddle' | 'wall' | 'block' | 'speedUp' | 'clear' | 'gameOver' | 'register';

export interface PlannedSound {
  name: SoundName;
  /** block のときだけ。0 = 最上段 */
  row?: number;
}

/** 同じフレームで重なったときに鳴らす順 */
const ORDER = ['launch', 'paddle', 'wall', 'block', 'speedUp'] as const;

/**
 * 1 フレームの出来事から、鳴らす音の一覧を返す。
 * クリア・ゲームオーバーがあればそれだけ。それ以外は種類ごとに 1 回（block の row は最初の出来事の行）
 */
export function planSounds(events: GameEvent[]): PlannedSound[] {
  const end = events.find((e) => e.type === 'clear' || e.type === 'gameOver');
  if (end) return [{ name: end.type as 'clear' | 'gameOver' }];
  const planned: PlannedSound[] = [];
  for (const name of ORDER) {
    const first = events.find((e) => e.type === name);
    if (!first) continue;
    planned.push(first.type === 'block' ? { name, row: first.row } : { name });
  }
  return planned;
}
