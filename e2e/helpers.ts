import { expect, type Page } from '@playwright/test';
import type { DebugApi } from '../src/debug';

// E2E 用の小物（TASK-0006）：起動を待つ、状態の写しを読む、論理座標を画面座標に直す、app:* の出来事を記録する

export interface AppEvent {
  type: string;
  detail: unknown;
}

declare global {
  interface Window {
    __appStarted?: boolean;
    __breakout?: DebugApi;
    __appEvents?: AppEvent[];
  }
}

/** 開いて、起動するまで待つ。page.clock で時計を止めていても待てるよう、Node 側から確かめる */
export async function openApp(page: Page, path = './?debug=1'): Promise<void> {
  await page.goto(path);
  await expect.poll(() => page.evaluate(() => window.__appStarted === true)).toBe(true);
}

/** タイトル画面の START でゲームを始め、発射前になるまで待つ */
export async function startGame(page: Page): Promise<void> {
  await page.locator('#title-start').click();
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
}

/** 開いて START まで（多くのテストの前提：「/?debug=1 で START」） */
export async function openGame(page: Page, path = './?debug=1'): Promise<void> {
  await openApp(page, path);
  await startGame(page);
}

/**
 * page.clock の時計を止める（page.clock.install() のあとで呼ぶ）。
 * install() だけでは時計は実時間でも進み続けるので、時間に厳しいテストでは止めて runFor で進める
 */
export async function freezeClock(page: Page): Promise<void> {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 100);
}

/** ゲームの状態の写し（?debug=1 のときだけ使える） */
export function snapshot(page: Page) {
  return page.evaluate(() => {
    if (!window.__breakout) throw new Error('?debug=1 で開いてください');
    return window.__breakout.snapshot();
  });
}

/** ゲームの状態の一部を書き換える（?debug=1 のときだけ使える） */
export function setup(page: Page, partial: Parameters<DebugApi['setup']>[0]) {
  return page.evaluate((p) => {
    if (!window.__breakout) throw new Error('?debug=1 で開いてください');
    window.__breakout.setup(p);
  }, partial);
}

/** 論理座標（480 × 640）を、ページ上の座標に直す */
export async function toScreen(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  const box = await page.locator('#field').boundingBox();
  if (!box) throw new Error('#field が見えません');
  return { x: box.x + (x * box.width) / 480, y: box.y + (y * box.height) / 640 };
}

export type TouchType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel';

/**
 * タッチの PointerEvent を送る。位置は論理座標（Canvas の外も可）で、ページ上のその位置にある要素に送る。
 * id が 1 の指を「最初の指」（isPrimary）とする
 */
export async function touch(page: Page, type: TouchType, x: number, y: number, id = 1): Promise<void> {
  await touchAt(page, type, await toScreen(page, x, y), id);
}

/** touch と同じ。位置をページ上の座標で渡す（Canvas の外の部品を押すとき） */
export async function touchAt(page: Page, type: TouchType, point: { x: number; y: number }, id = 1): Promise<void> {
  await page.evaluate(
    ({ type, point, id }) => {
      const target = document.elementFromPoint(point.x, point.y) ?? document.body;
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          pointerId: id,
          pointerType: 'touch',
          isPrimary: id === 1,
          clientX: point.x,
          clientY: point.y,
          button: type === 'pointermove' ? -1 : 0,
          buttons: type === 'pointerdown' || type === 'pointermove' ? 1 : 0,
        }),
      );
    },
    { type, point, id },
  );
}

/** ブラウザで次の描画まで待つ（入力がステップに取り込まれるまで） */
export function nextFrames(page: Page, count = 3): Promise<void> {
  return page.evaluate(
    (n) =>
      new Promise<void>((resolve) => {
        let left = n;
        const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      }),
    count,
  );
}

/** app:state・app:sound を記録する。page.goto の前に呼ぶ */
export async function recordAppEvents(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__appEvents = [];
    for (const type of ['app:state', 'app:sound']) {
      window.addEventListener(type, (e) => window.__appEvents?.push({ type, detail: (e as CustomEvent).detail }));
    }
  });
}

/** 記録した app:* の出来事 */
export function appEvents(page: Page): Promise<AppEvent[]> {
  return page.evaluate(() => window.__appEvents ?? []);
}

/** 次のステップで最後のブロック（32）を壊してクリアする状態。経過は終わったときに 95,789 ms（合計 1,250） */
export async function finishCleared(page: Page): Promise<void> {
  await setup(page, {
    status: 'playing',
    aliveIds: [32],
    broken: 39,
    speedLevel: 3,
    elapsedMs: 95789 - 1000 / 120,
    ball: { x: 44, y: 212, vx: 0, vy: -390 },
  });
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'cleared');
  await expect(page.locator('#result-panel')).toBeVisible();
}

/** 12 個壊した状態で、パドルから離れた所に落とす（合計 120） */
export async function finishGameOver(page: Page): Promise<void> {
  await setup(page, { status: 'playing', broken: 12, speedLevel: 1, ball: { x: 100, y: 630, vx: 0, vy: 330 } });
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'gameOver');
  await expect(page.locator('#result-panel')).toBeVisible();
}

// ── 保存データ（TD-0004 §1 のキー：mini-blockbreaking-game-<名前>、値は JSON） ──

export const STORAGE_PREFIX = 'mini-blockbreaking-game-';

export interface StoredRecord {
  id: number;
  playerName: string;
  score: number;
  result: 'cleared' | 'gameOver';
  createdAt: string;
}

/** 記録を作る（score が 400 以上ならクリア） */
export function makeRecord(id: number, score: number, playerName = `P${id}`): StoredRecord {
  return {
    id,
    playerName,
    score,
    result: score >= 400 ? 'cleared' : 'gameOver',
    createdAt: `2026-10-22T00:00:${String(id % 60).padStart(2, '0')}.000Z`,
  };
}

/** 保存データを書く（開いたあとで呼ぶ。値は JSON にする） */
export async function writeStorage(page: Page, entries: Record<string, unknown>): Promise<void> {
  await page.evaluate(
    ({ prefix, entries }) => {
      for (const [name, value] of Object.entries(entries)) localStorage.setItem(prefix + name, JSON.stringify(value));
    },
    { prefix: STORAGE_PREFIX, entries },
  );
}

/** 保存データを読む（なければ null） */
export function readStorage(page: Page, name: string): Promise<unknown> {
  return page.evaluate((key) => {
    const text = localStorage.getItem(key);
    return text === null ? null : (JSON.parse(text) as unknown);
  }, STORAGE_PREFIX + name);
}

/** 保存できない環境にする（setItem が例外を出す）。page.goto の前に呼ぶ */
export async function breakStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };
  });
}
