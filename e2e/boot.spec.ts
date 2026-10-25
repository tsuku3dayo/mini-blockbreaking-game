import { expect, test, type Page } from '@playwright/test';
import { openApp, readStorage, writeStorage } from './helpers';

// 前提：window.__bootWaitMs を短くし、メインのスクリプト（assets/index-*.js）を読めなくして起動の失敗を作る（TC-0020）

const APP_ID = 'mini-blockbreaking-game';
const REPAIR_KEY = `${APP_ID}:boot-repair-at`;
const MAIN_SCRIPT = /\/assets\/index-[^/]+\.js$/;

// Service Worker が配るとリクエストを止められないので、このファイルでは使わない
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __bootWaitMs: number }).__bootWaitMs = 300;
  });
});

/** メインのスクリプトを読めなくする。times を渡すと、その回数だけ */
async function breakMainScript(page: Page, times?: number): Promise<void> {
  let count = 0;
  await page.route(MAIN_SCRIPT, (route) => {
    count += 1;
    if (times === undefined || count <= times) void route.abort();
    else void route.continue();
  });
}

/** 復旧の時刻（sessionStorage）。読み込み直しの途中で読めないときは 0 */
async function repairAt(page: Page): Promise<number> {
  try {
    return await page.evaluate((key) => Number(sessionStorage.getItem(key)) || 0, REPAIR_KEY);
  } catch {
    return 0;
  }
}

test('TC-0020-01 1 回目の失敗は自動で読み込み直し、「なおす」は出さない', async ({ page }) => {
  await breakMainScript(page, 1);
  await page.goto('./');
  // 自動で読み込み直したあとは、ふつうに起動する
  await expect.poll(() => repairAt(page), { timeout: 10_000 }).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__appStarted === true), { timeout: 10_000 }).toBe(true);
  await expect(page.locator('#boot-error')).toBeHidden();
  await expect(page.locator('#title-start')).toBeVisible();
});

test('TC-0020-02 2 分以内の 2 回目の失敗では「なおす」を出し、押すと読み込み直す', async ({ page }) => {
  await breakMainScript(page);
  await page.goto('./');
  const box = page.locator('#boot-error');
  await expect(box).toBeVisible({ timeout: 10_000 });
  await expect(box).toContainText('うまく起動できませんでした。');
  await expect(box).toContainText('記録は消えません。');
  const button = page.locator('#boot-repair');
  await expect(button).toHaveText('なおす');
  const size = await button.boundingBox();
  expect(size?.height).toBeGreaterThanOrEqual(44);

  const before = await repairAt(page);
  await Promise.all([page.waitForEvent('load'), button.click()]);
  // 押した時刻で読み込み直した
  await expect.poll(() => repairAt(page)).toBeGreaterThanOrEqual(before);
});

test('TC-0020-03 復旧しても記録・前回の名前・効果音の設定は消えない', async ({ page }) => {
  await openApp(page, './');
  await writeStorage(page, { scores: [{ id: 1, playerName: 'TSUKU', score: 1250, result: 'cleared', createdAt: '2026-10-23T03:15:00.123Z' }], lastName: 'TSUKU', sound: false });

  await breakMainScript(page);
  await page.reload();
  await expect(page.locator('#boot-error')).toBeVisible({ timeout: 10_000 });
  await Promise.all([page.waitForEvent('load'), page.locator('#boot-repair').click()]);

  expect(await readStorage(page, 'scores')).toHaveLength(1);
  expect(await readStorage(page, 'lastName')).toBe('TSUKU');
  expect(await readStorage(page, 'sound')).toBe(false);
});

test('TC-0020-04 ほかのアプリのキャッシュは消さず、このアプリのキャッシュだけを消す', async ({ page }) => {
  await openApp(page, './');
  const ownCache = await page.evaluate(async () => {
    // Workbox のキャッシュの名前には、このアプリの範囲（scope）が入る
    const name = `workbox-precache-v2-${new URL('./', location.href).href}`;
    await caches.open(name);
    await caches.open('other-app-precache');
    return name;
  });

  await breakMainScript(page);
  await page.reload();
  await expect(page.locator('#boot-error')).toBeVisible({ timeout: 10_000 });

  const keys = await page.evaluate(() => caches.keys());
  expect(keys).toContain('other-app-precache');
  expect(keys).not.toContain(ownCache);
});
