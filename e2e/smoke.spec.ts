import { expect, test } from '@playwright/test';

// 仮のテスト：タイトル画面が開くことだけ確かめる。タイトル画面の本物のテスト（TC-0001）ができたら消す
test('タイトル画面が開く', async ({ page }) => {
  await page.goto('./');
  await expect.poll(() => page.evaluate(() => window.__appStarted)).toBe(true);
  await expect(page).toHaveTitle('ブロック崩し - タイトル');
  await expect(page.getByRole('heading', { level: 1, name: 'BREAKOUT' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'START' })).toBeFocused();
  await expect(page.locator('#screen-play')).toBeHidden();
  await expect(page.locator('#screen-ranking')).toBeHidden();

  // 横スクロールが出ない
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});
