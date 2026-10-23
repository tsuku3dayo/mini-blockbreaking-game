import { expect, test, type Page } from '@playwright/test';
import { freezeClock, openGame, snapshot, toScreen } from './helpers';

// 前提：/?debug=1 で START。マウスは page.mouse、キーは page.keyboard（TC-0008）。時計は止めて runFor で進める

const Y = 500;
// キーを押した・離した時刻とフレームの区切りのずれで、数ステップ（1 ステップ 3.5 px）の差が出る
const KEY_TOLERANCE = 3 * 3.5;

async function paddleX(page: Page): Promise<number> {
  await page.clock.runFor(50);
  return (await snapshot(page)).paddleX;
}

async function moveMouse(page: Page, x: number): Promise<void> {
  const p = await toScreen(page, x, Y);
  await page.mouse.move(p.x, p.y);
}

/** キーを ms ミリ秒押し続ける */
async function hold(page: Page, key: string, ms: number): Promise<void> {
  await page.keyboard.down(key);
  await page.clock.runFor(ms);
  await page.keyboard.up(key);
}

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await openGame(page);
  await freezeClock(page);
});

test('TC-0008-01 パドルは最後に使った入力に従う', async ({ page }) => {
  await moveMouse(page, 100);
  expect(await paddleX(page)).toBeCloseTo(100, 3);
  // → を 0.5 秒：100 + 420 × 0.5 = 約 310
  await hold(page, 'ArrowRight', 500);
  expect(Math.abs((await paddleX(page)) - 310)).toBeLessThanOrEqual(KEY_TOLERANCE);
  // マウスを動かすと、またマウスに従う
  await moveMouse(page, 400);
  expect(await paddleX(page)).toBeCloseTo(400, 3);
});

test('TC-0008-02 A / D でも動く', async ({ page }) => {
  await moveMouse(page, 100);
  const start = await paddleX(page);
  await hold(page, 'KeyD', 500);
  const right = await paddleX(page);
  expect(Math.abs(right - start - 210)).toBeLessThanOrEqual(KEY_TOLERANCE);
  await hold(page, 'KeyA', 500);
  const left = await paddleX(page);
  expect(Math.abs(right - left - 210)).toBeLessThanOrEqual(KEY_TOLERANCE);
});

test('TC-0008-04 Space の押しっぱなし（キーリピート）では発射しない', async ({ page }) => {
  await page.evaluate(() => {
    document.getElementById('field')?.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', repeat: true, bubbles: true, cancelable: true }));
  });
  await page.clock.runFor(200);
  expect((await snapshot(page)).status).toBe('ready');
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  expect((await snapshot(page)).status).toBe('playing');
});

test('TC-0008-05 マウスはボタンを押さずに追従し、ゲーム領域の外でも追従する', async ({ page }) => {
  await moveMouse(page, 300);
  expect(await paddleX(page)).toBeCloseTo(300, 3);
  const box = await page.locator('#field').boundingBox();
  if (!box) throw new Error('#field が見えません');
  // ゲーム領域の左の外
  await page.mouse.move(Math.max(0, box.x - 10), box.y + box.height / 2);
  expect(await paddleX(page)).toBe(40);
});

test('TC-0008-06 クリックで発射し、押したまま動かしたら発射しない', async ({ page }) => {
  const from = await toScreen(page, 200, Y);
  const to = await toScreen(page, 230, Y);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y);
  await page.mouse.up();
  await page.clock.runFor(100);
  expect((await snapshot(page)).status).toBe('ready');

  await page.mouse.click(to.x, to.y);
  await page.clock.runFor(100);
  expect((await snapshot(page)).status).toBe('playing');
});

test('TC-0008-07 プレイ中の ← → Space でページがスクロールしない', async ({ page }) => {
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  expect((await snapshot(page)).status).toBe('playing');
  const prevented = await page.evaluate(() =>
    ['ArrowLeft', 'ArrowRight', 'Space'].map((code) => {
      const e = new KeyboardEvent('keydown', { code, key: code === 'Space' ? ' ' : code, bubbles: true, cancelable: true });
      document.getElementById('field')?.dispatchEvent(e);
      return e.defaultPrevented;
    }),
  );
  expect(prevented).toEqual([true, true, true]);
});

test('TC-0008-08 マウスでプレイ中はカーソルを隠し、一時停止中は戻す', async ({ page }) => {
  const p = await toScreen(page, 240, Y);
  await page.mouse.click(p.x, p.y);
  await page.clock.runFor(100);
  const cursor = () => page.locator('#field').evaluate((el) => getComputedStyle(el).cursor);
  expect((await snapshot(page)).status).toBe('playing');
  expect(await cursor()).toBe('none');
  await page.keyboard.press('p');
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'paused');
  expect(await cursor()).not.toBe('none');
});

test('TC-0008-09 フォーカスを失ったら、押していたキーを離した扱いにする', async ({ page }) => {
  await moveMouse(page, 100);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(200);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const atBlur = await paddleX(page);
  await page.clock.runFor(300);
  expect(await paddleX(page)).toBe(atBlur);
  await page.keyboard.up('ArrowRight');
});

test('TC-0008-03 両方押しは止まる（← と → を同時に押す）', async ({ page }) => {
  await moveMouse(page, 240);
  const start = await paddleX(page);
  await page.keyboard.down('ArrowLeft');
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(500);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowRight');
  expect(await paddleX(page)).toBeCloseTo(start, 3);
});
