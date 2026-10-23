import { expect, test } from '@playwright/test';

// 仮のテスト：開いたらプレイ画面が出ることだけ確かめる（WS-0002 では、開いたらすぐプレイ画面。TASK-0006）。
// タイトル画面から始める流れ（TASK-0009）と、その本物のテスト（TC-0001）ができたら消す
test('プレイ画面が開く', async ({ page }) => {
  await page.goto('./');
  await expect.poll(() => page.evaluate(() => window.__appStarted)).toBe(true);
  await expect(page).toHaveTitle('ブロック崩し - プレイ');
  await expect(page.locator('#field')).toBeVisible();
  await expect(page.locator('#field')).toBeFocused();
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
  await expect(page.locator('#screen-title')).toBeHidden();

  // 横スクロールが出ない
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});
