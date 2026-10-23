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
