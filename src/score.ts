import { TIME_BONUS_BASE, TIME_BONUS_PER_SEC } from './config';
import { blockScore, type GameState, type ResultSummary } from './game';

// スコア（TD-0002 §6、仕様書 §6）

/** 時間ボーナス。クリア：max(0, 180 − 経過秒（切り捨て）) × 10、ゲームオーバー：0 */
export function timeBonus(result: 'cleared' | 'gameOver', elapsedMs: number): number {
  if (result !== 'cleared') return 0;
  return Math.max(0, TIME_BONUS_BASE - Math.floor(elapsedMs / 1000)) * TIME_BONUS_PER_SEC;
}

/** 終了した状態から結果サマリを作る（仕様書 §7.2） */
export function summarize(state: GameState): ResultSummary {
  const result = state.status === 'cleared' ? 'cleared' : 'gameOver';
  const blocks = blockScore(state);
  const bonus = timeBonus(result, state.elapsedMs);
  return {
    result,
    broken: state.broken,
    blockScore: blocks,
    timeBonus: bonus,
    total: blocks + bonus,
    elapsedMs: state.elapsedMs,
  };
}
