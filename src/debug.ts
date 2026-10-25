import type { Ball, GameState } from './game';
import type { PlayScreen } from './play';
import { onNeedRefresh } from './pwa';

// テスト用の入口（TD-0001 §7）。URL に ?debug=1 を付けて開いたときだけ window.__breakout を用意する。
// Canvas の中身は E2E から読めないため（ADR-0003）、状態の写しを返し、状態の一部を書き換えられるようにする

/** setup に渡せる、状態の一部 */
export interface DebugSetup {
  status?: 'ready' | 'playing';
  paddleX?: number;
  ball?: Partial<Ball>;
  /** 生きているブロックの ID。指定したもの以外は壊れた扱いにする */
  aliveIds?: number[];
  broken?: number;
  speedLevel?: number;
  elapsedMs?: number;
}

export interface DebugApi {
  snapshot(): GameState;
  setup(partial: DebugSetup): void;
  /** 新しい版の準備ができたことにする（更新の帯を出す。TC-0019-03） */
  showUpdateBanner(): void;
}

export function isDebugMode(search: string): boolean {
  return new URLSearchParams(search).get('debug') === '1';
}

export function installDebug(play: PlayScreen): void {
  const api: DebugApi = {
    snapshot() {
      return structuredClone(play.getState());
    },
    setup(partial) {
      const state = play.getState();
      if (partial.status !== undefined) state.status = partial.status;
      if (partial.paddleX !== undefined) state.paddleX = partial.paddleX;
      if (partial.ball) Object.assign(state.ball, partial.ball);
      if (partial.aliveIds) {
        const ids = new Set(partial.aliveIds);
        state.alive.forEach((_, id) => (state.alive[id] = ids.has(id)));
      }
      if (partial.broken !== undefined) state.broken = partial.broken;
      if (partial.speedLevel !== undefined) state.speedLevel = partial.speedLevel;
      if (partial.elapsedMs !== undefined) state.elapsedMs = partial.elapsedMs;
      play.refresh();
    },
    showUpdateBanner() {
      onNeedRefresh();
    },
  };
  window.__breakout = api;
}
