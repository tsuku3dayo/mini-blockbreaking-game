import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

// 前提：タイトル画面から開く（TC-0024）

/** 仕様書 §8.8 の役職と名前 */
const CREDITS = [
  ['PRODUCER', 'YOSHIHARU TSUKUDA'],
  ['DIRECTOR', 'YOSHIHARU TSUKUDA'],
  ['GAME DESIGNER', 'YOSHIHARU TSUKUDA'],
  ['GRAPHIC DESIGNER', 'CLAUDE CODE'],
  ['SOUND CREATOR', 'CLAUDE CODE'],
  ['PROGRAMMER', 'CLAUDE CODE'],
];

test.beforeEach(async ({ page }) => {
  await openApp(page, './');
});

test('TC-0024-01 タイトル画面の RANKING のすぐ下に「クレジット」がある', async ({ page }) => {
  const ids = await page.locator('#screen-title .menu button').evaluateAll((els) => els.map((el) => el.id));
  expect(ids).toEqual(['title-start', 'title-ranking', 'title-credits']);
  await expect(page.locator('#title-credits')).toHaveText('クレジット');
});

test('TC-0024-02 押すとクレジット画面になり、見出しに初期フォーカス', async ({ page }) => {
  await page.locator('#title-credits').click();
  await expect(page.locator('#screen-credits')).toBeVisible();
  await expect(page.locator('#screen-title')).toBeHidden();
  await expect(page).toHaveTitle('ブロック崩し - クレジット');
  expect(new URL(page.url()).hash).toBe('#/credits');
  await expect(page.locator('#credits-heading')).toHaveText('クレジット');
  await expect(page.locator('#credits-heading')).toBeFocused();
});

test('TC-0024-03 §8.8 の役職と名前を、順に中央揃えで文字として出す', async ({ page }) => {
  await page.locator('#title-credits').click();
  const list = page.locator('#screen-credits .credits');
  await expect(list.locator('dt')).toHaveText(CREDITS.map(([role]) => role));
  await expect(list.locator('dd')).toHaveText(CREDITS.map(([, name]) => name));
  for (const el of await list.locator('dt, dd').all()) {
    expect(await el.evaluate((e) => getComputedStyle(e).textAlign)).toBe('center');
  }
  // 役職と名前の組は、画面の真ん中にある
  const listBox = await list.boundingBox();
  const nameBox = await list.locator('dd').first().boundingBox();
  if (!listBox || !nameBox) throw new Error('外形が取れません');
  expect(Math.abs(nameBox.x + nameBox.width / 2 - (listBox.x + listBox.width / 2))).toBeLessThan(2);
});

test('TC-0024-04 BACK・Esc でタイトルに戻る', async ({ page }) => {
  await page.locator('#title-credits').click();
  await page.locator('#credits-back').click();
  await expect(page.locator('#screen-title')).toBeVisible();

  await page.locator('#title-credits').click();
  await expect(page.locator('#screen-credits')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#screen-title')).toBeVisible();
  await expect(page.locator('#screen-credits')).toBeHidden();
});

test('TC-0024-05 #/credits で開くとクレジット画面、戻る・進むで切り替わる', async ({ page }) => {
  await openApp(page, './#/credits');
  await expect(page.locator('#screen-credits')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#/credits');

  await page.locator('#credits-back').click();
  await expect(page.locator('#screen-title')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#screen-credits')).toBeVisible();
  await page.goForward();
  await expect(page.locator('#screen-title')).toBeVisible();
});

test('TC-0024-06 横スクロールがなく、ボタンは 44 px 以上', async ({ page }) => {
  for (const id of ['#title-credits']) {
    const box = await page.locator(id).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('#title-credits').click();
  const back = await page.locator('#credits-back').boundingBox();
  expect(back?.width).toBeGreaterThanOrEqual(44);
  expect(back?.height).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
