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
