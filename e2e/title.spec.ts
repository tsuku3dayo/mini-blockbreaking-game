import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

// 前提：保存データは空。/ を開く（TC-0001）

test('TC-0001-01 タイトル画面の要素', async ({ page }) => {
  await openApp(page, './');
  await expect(page.getByRole('heading', { level: 1, name: 'ブロック崩しミニ' })).toBeVisible();
  await expect(page.getByRole('button', { name: /START/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'RANKING' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '操作方法' })).toBeVisible();
  const howto = page.locator('.howto dt');
  await expect(howto).toHaveText(['パドル移動', '発射', '一時停止']);
  await expect(page.locator('#screen-play')).toBeHidden();
  await expect(page.locator('#screen-ranking')).toBeHidden();
  // 横スクロールが出ない
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test('TC-0001-02 START でゲームが始まる', async ({ page }) => {
  await openApp(page, './');
  await page.getByRole('button', { name: /START/ }).click();
  await expect(page.locator('#screen-play')).toBeVisible();
  await expect(page.locator('#screen-title')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
  await expect(page.locator('#field')).toBeFocused();
});

test('TC-0001-03 START に初期フォーカスがあり、Enter で始まる', async ({ page }) => {
  await openApp(page, './');
  await expect(page.locator('#title-start')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-play')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
});

test('TC-0001-03 ほかの部品にフォーカスがあるときの Enter は、その部品の動作だけ', async ({ page }) => {
  await openApp(page, './');
  // RANKING にフォーカスして Enter → ランキング画面（ゲームは始まらない）
  await page.locator('#title-ranking').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-ranking')).toBeVisible();
  await expect(page.locator('#screen-play')).toBeHidden();

  // どこにもフォーカスがないときの Enter は START と同じ
  await page.goto('./#/title');
  await expect.poll(() => page.evaluate(() => window.__appStarted === true)).toBe(true);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Enter');
  await expect(page.locator('#screen-play')).toBeVisible();
});

test('TC-0001-04 RANKING でランキング画面、BACK・Esc でタイトルへ', async ({ page }) => {
  await openApp(page, './');
  await page.getByRole('button', { name: 'RANKING' }).click();
  await expect(page.getByRole('heading', { name: 'ハイスコアランキング' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ハイスコアランキング' })).toBeFocused();
  await expect(page.getByText('まだ記録がありません')).toBeVisible();

  await page.getByRole('button', { name: 'BACK' }).click();
  await expect(page.locator('#screen-title')).toBeVisible();

  await page.getByRole('button', { name: 'RANKING' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#screen-title')).toBeVisible();
});

test('TC-0001-05 ページタイトルが画面ごとに変わる', async ({ page }) => {
  await openApp(page, './');
  await expect(page).toHaveTitle('ブロック崩しミニ - タイトル');
  await page.getByRole('button', { name: /START/ }).click();
  await expect(page).toHaveTitle('ブロック崩しミニ - プレイ');
  // ブラウザの「戻る」でタイトルへ
  await page.goBack();
  await expect(page).toHaveTitle('ブロック崩しミニ - タイトル');
  await expect(page.locator('#screen-title')).toBeVisible();
  await page.getByRole('button', { name: 'RANKING' }).click();
  await expect(page).toHaveTitle('ブロック崩しミニ - ランキング');
});

test('TC-0001-06 存在しない画面・開いたときの #/play はタイトルへ', async ({ page }) => {
  for (const hash of ['#/unknown', '#/play']) {
    // ハッシュだけ違う URL への移動は読み込み直しにならないので、いったん空のページを挟んで「開く」
    await page.goto('about:blank');
    await openApp(page, `./${hash}`);
    await expect(page.locator('#screen-title')).toBeVisible();
    await expect(page.locator('#screen-play')).toBeHidden();
    expect(new URL(page.url()).hash).toBe('#/title');
  }

  // 起動したあとにハッシュを書き換えた場合
  await page.evaluate(() => (location.hash = '#/xyz'));
  await expect(page.locator('#screen-title')).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toBe('#/title');
});

test('TC-0001-07 見出しが幅 375 で 1 行に収まる', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openApp(page, './');
  const m = await page.locator('#title-logo').evaluate((el) => {
    // 見出しの箱ではなく文字の範囲で測る（箱は親の幅いっぱいに広がるため）
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect();
    return { height: text.height, right: text.right, fontSize: parseFloat(getComputedStyle(el).fontSize), width: document.documentElement.clientWidth };
  });
  expect(m.height).toBeLessThan(m.fontSize * 2);
  expect(m.right).toBeLessThanOrEqual(m.width);
});

test('TC-0010-05 タイトル・ランキング画面のボタンは 44 px 以上', async ({ page }) => {
  await openApp(page, './');
  const sizes = async () =>
    page.locator('button:visible, input:visible').evaluateAll((els) => els.map((el) => ({ id: el.id || el.textContent?.trim(), ...el.getBoundingClientRect().toJSON() })));
  const check = (boxes: { id?: string; width: number; height: number }[]) => {
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      expect(b.width, b.id).toBeGreaterThanOrEqual(44);
      expect(b.height, b.id).toBeGreaterThanOrEqual(44);
    }
  };
  check(await sizes());
  await page.getByRole('button', { name: 'RANKING' }).click();
  check(await sizes());
});
