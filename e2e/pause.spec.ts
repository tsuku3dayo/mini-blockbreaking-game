import { expect, test, type Page } from '@playwright/test';
import { openGame, setup, snapshot } from './helpers';

// 前提：/?debug=1 で START → 発射。時計は page.clock で進める（TC-0009）

const body = (page: Page) => page.locator('body');

/** 発射して、ボールが動き出すまで進める */
async function launch(page: Page): Promise<void> {
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  await expect(body(page)).toHaveAttribute('data-game-state', 'playing');
}

/** 画面が隠れた / 表示に戻ったことにする */
async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await openGame(page);
});

for (const [name, action] of [
  ['一時停止ボタン', (page: Page) => page.locator('#pause-button').click()],
  ['P', (page: Page) => page.keyboard.press('p')],
  ['Esc', (page: Page) => page.keyboard.press('Escape')],
] as const) {
  test(`TC-0009-01 ${name}で止まり、止めている間は時間が増えない`, async ({ page }) => {
    await launch(page);
    await action(page);
    await expect(body(page)).toHaveAttribute('data-game-state', 'paused');
    const paused = await snapshot(page);
    await page.clock.runFor(5000);
    const after = await snapshot(page);
    expect(after.elapsedMs).toBe(paused.elapsedMs);
    expect(after.ball).toEqual(paused.ball);

    // 再開すると、また時間が進む（止まっていた 5 秒は進めない）
    await action(page);
    await expect(body(page)).toHaveAttribute('data-game-state', 'playing');
    await page.clock.runFor(500);
    const resumed = await snapshot(page);
    expect(resumed.elapsedMs).toBeGreaterThan(paused.elapsedMs);
    expect(resumed.elapsedMs - paused.elapsedMs).toBeLessThan(1000);
  });
}

test('TC-0009-02 画面が隠れたら自動で止まり、戻っても再開しない', async ({ page }) => {
  await launch(page);
  await setHidden(page, true);
  await expect(body(page)).toHaveAttribute('data-game-state', 'paused');
  const paused = await snapshot(page);
  await page.clock.runFor(3000);
  await setHidden(page, false);
  await page.clock.runFor(1000);
  const after = await snapshot(page);
  expect(after.status).toBe('paused');
  expect(after.elapsedMs).toBe(paused.elapsedMs);
});

test('TC-0009-03 一時停止中の Space では発射しない', async ({ page }) => {
  await page.keyboard.press('p');
  await expect(body(page)).toHaveAttribute('data-game-state', 'paused');
  await page.keyboard.press('Space');
  await page.keyboard.press('p');
  await expect(body(page)).toHaveAttribute('data-game-state', 'ready');
  await page.clock.runFor(1000);
  expect((await snapshot(page)).status).toBe('ready');
});

test('TC-0009-05 ボタンの表示と押せる場面', async ({ page }) => {
  const button = page.locator('#pause-button');
  await expect(button).toHaveText('一時停止');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toBeEnabled();

  await button.click();
  await expect(button).toHaveText('再開');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  // 押したあとはゲーム領域にフォーカスが戻る
  await expect(page.locator('#field')).toBeFocused();

  await button.click();
  await expect(button).toHaveText('一時停止');
  await expect(button).toHaveAttribute('aria-pressed', 'false');

  // 終了後は押せない
  await setup(page, { status: 'playing', ball: { x: 100, y: 630, vx: 0, vy: 300 } });
  await page.clock.runFor(500);
  await expect(body(page)).toHaveAttribute('data-game-state', 'gameOver');
  await expect(button).toBeDisabled();
  await expect(button).toHaveText('一時停止');
});

test('TC-0009-07 P の押しっぱなし（キーリピート）は無視する', async ({ page }) => {
  await launch(page);
  await page.keyboard.press('p');
  await expect(body(page)).toHaveAttribute('data-game-state', 'paused');
  // 押しっぱなしで続けて届く keydown（repeat: true）
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', key: 'p', repeat: true, bubbles: true }));
    });
  }
  await page.clock.runFor(100);
  await expect(body(page)).toHaveAttribute('data-game-state', 'paused');
});
