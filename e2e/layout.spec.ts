import { expect, test, type Page } from '@playwright/test';
import { openGame } from './helpers';

// 前提：/ を開いて START（TC-0010-03）

/** Canvas の CSS の大きさと実ピクセル */
function canvasSize(page: Page) {
  return page.evaluate(() => {
    const c = document.getElementById('field') as HTMLCanvasElement;
    const rect = c.getBoundingClientRect();
    return { cssWidth: rect.width, cssHeight: rect.height, width: c.width, height: c.height, dpr: window.devicePixelRatio };
  });
}

test('TC-0010-03 1 画面に収まる', async ({ page }) => {
  await openGame(page, './');
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('viewport がありません');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const selector of ['#field', '#pause-button']) {
    const box = await page.locator(selector).boundingBox();
    expect(box, selector).not.toBeNull();
    if (!box) continue;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('TC-0010-05 プレイ画面のボタンは 44 px 以上', async ({ page }) => {
  await openGame(page, './');
  const buttons = page.locator('#screen-play button:visible, #screen-play input:visible');
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const box of await buttons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect))) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('TC-0010-06 実ピクセルは CSS の大きさ × 画素密度', async ({ page }) => {
  await openGame(page, './');
  const size = await canvasSize(page);
  expect(size.width).toBe(Math.round(size.cssWidth * size.dpr));
  expect(size.height).toBe(Math.round(size.cssHeight * size.dpr));
  if (test.info().project.name === 'small') {
    // deviceScaleFactor 2 のプロジェクト
    expect(size.dpr).toBe(2);
    expect(size.width).toBe(size.cssWidth * 2);
  }
});

test('TC-0010-07 向きを変えたら大きさを合わせ直す', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openGame(page, './');
  const portrait = await canvasSize(page);
  expect(portrait.cssWidth).toBe(343);
  expect(portrait.cssHeight).toBe(457);

  await page.setViewportSize({ width: 667, height: 375 });
  await expect.poll(async () => (await canvasSize(page)).cssWidth).toBe(288);
  const landscape = await canvasSize(page);
  expect(landscape.cssHeight).toBe(384);
  expect(landscape.width).toBe(Math.round(288 * landscape.dpr));
});

test('TC-0010-08 横向きで最小のときだけ、縦向きをすすめる', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openGame(page, './');
  const notice = page.getByText('縦向きでのプレイをおすすめします');
  await expect(notice).toBeHidden();

  await page.setViewportSize({ width: 667, height: 375 });
  await expect(notice).toBeVisible();

  await page.setViewportSize({ width: 375, height: 667 });
  await expect(notice).toBeHidden();
});
