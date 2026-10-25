import { expect, test, type Page } from '@playwright/test';
import { controlPoint, finishCleared, finishGameOver, nextFrames, openGame, snapshot, touch, touchAt, type TouchType } from './helpers';

// 前提：/?debug=1 を開いて START（TC-0007）

const Y = 500;

async function paddleX(page: Parameters<typeof snapshot>[0]): Promise<number> {
  await nextFrames(page);
  return (await snapshot(page)).paddleX;
}

test.beforeEach(async ({ page }) => {
  await openGame(page);
});

test('TC-0007-01 なぞると追従し、離すと止まる', async ({ page }) => {
  await touch(page, 'pointerdown', 240, Y);
  await touch(page, 'pointermove', 100, Y);
  expect(await paddleX(page)).toBeCloseTo(100, 3);
  await touch(page, 'pointermove', 300, Y);
  expect(await paddleX(page)).toBeCloseTo(300, 3);
  await touch(page, 'pointerup', 300, Y);
  // 離したあと、同じ指の id で（押さずに）動いても追従しない
  await touch(page, 'pointermove', 150, Y);
  expect(await paddleX(page)).toBeCloseTo(300, 3);
});

test('TC-0007-02・03 動かして離しても発射しない、タップなら発射する', async ({ page }) => {
  await touch(page, 'pointerdown', 240, Y);
  await touch(page, 'pointermove', 260, Y);
  await touch(page, 'pointerup', 260, Y);
  await nextFrames(page);
  expect((await snapshot(page)).status).toBe('ready');

  // 位置を合わせたあとで、改めてタップ（5 px 動いても 10 px 以内ならタップ）
  await touch(page, 'pointerdown', 260, Y);
  await touch(page, 'pointermove', 265, Y);
  await touch(page, 'pointerup', 265, Y);
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing');
});

test('TC-0007-03 ブラウザの本物のタッチ（touchscreen.tap）でも発射する', async ({ page }) => {
  const box = await page.locator('#field').boundingBox();
  if (!box) throw new Error('#field が見えません');
  await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height * 0.7);
  await expect.poll(async () => (await snapshot(page)).status).toBe('playing');
  // タップした位置（論理 x ≈ 144）にパドルが合っている
  expect((await snapshot(page)).paddleX).toBeCloseTo(144, 0);
});

test('TC-0007-04 なぞってもスクロール・拡大・文字選択が起きない', async ({ page }) => {
  const style = await page.locator('#field').evaluate((el) => {
    const s = getComputedStyle(el);
    return { touchAction: s.touchAction, userSelect: s.userSelect || s.webkitUserSelect };
  });
  expect(style.touchAction).toBe('none');
  expect(style.userSelect).toBe('none');

  const before = await page.evaluate(() => window.scrollY);
  await touch(page, 'pointerdown', 240, 300);
  for (const y of [350, 400, 450, 500]) await touch(page, 'pointermove', 240, y);
  await touch(page, 'pointerup', 240, 500);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);

  // 長押しメニューを出さない
  const prevented = await page.locator('#field').evaluate((el) => !el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
  expect(prevented).toBe(true);
});

test('TC-0007-05 押したまま外に出ても追従する、外で押したら追従しない', async ({ page }) => {
  await touch(page, 'pointerdown', 240, Y);
  // Canvas の右の外まで動かす
  await touch(page, 'pointermove', 700, Y);
  expect(await paddleX(page)).toBe(440);
  await touch(page, 'pointerup', 700, Y);

  // 操作欄（一時停止ボタン）で押して、Canvas の上へ動かす
  const before = await paddleX(page);
  const box = await page.locator('#pause-button').boundingBox();
  if (!box) throw new Error('#pause-button が見えません');
  await touchAt(page, 'pointerdown', { x: box.x + box.width / 2, y: box.y + box.height / 2 }, 1);
  await touch(page, 'pointermove', 100, Y);
  await touch(page, 'pointerup', 100, Y);
  expect(await paddleX(page)).toBe(before);
});

test('TC-0007-06 2 本目の指は無視する', async ({ page }) => {
  await touch(page, 'pointerdown', 100, Y, 1);
  await touch(page, 'pointerdown', 400, Y, 2);
  await touch(page, 'pointermove', 420, Y, 2);
  expect(await paddleX(page)).toBeCloseTo(100, 3);
  await touch(page, 'pointerup', 420, Y, 2);
  expect(await paddleX(page)).toBeCloseTo(100, 3);
});

test.describe('操作空間（仕様書 v1.2）', () => {
  /** 操作空間の中の、論理 x にあたる位置にタッチを送る */
  async function touchArea(page: Page, type: TouchType, x: number): Promise<void> {
    await touchAt(page, type, await controlPoint(page, x));
  }

  test('TC-0007-09 操作空間でなぞると追従し、離すと止まる', async ({ page }) => {
    await touchArea(page, 'pointerdown', 240);
    await touchArea(page, 'pointermove', 100);
    expect(await paddleX(page)).toBeCloseTo(100, 0);
    await touchArea(page, 'pointermove', 300);
    expect(await paddleX(page)).toBeCloseTo(300, 0);
    await touchArea(page, 'pointerup', 300);
    await touchArea(page, 'pointermove', 150);
    expect(await paddleX(page)).toBeCloseTo(300, 0);
  });

  test('TC-0007-10 操作空間のタップで発射し、動かしたら発射しない', async ({ page }) => {
    await touchArea(page, 'pointerdown', 240);
    await touchArea(page, 'pointermove', 260);
    await touchArea(page, 'pointerup', 260);
    await nextFrames(page);
    expect((await snapshot(page)).status).toBe('ready');

    await touchArea(page, 'pointerdown', 260);
    await touchArea(page, 'pointermove', 265);
    await touchArea(page, 'pointerup', 265);
    await expect.poll(async () => (await snapshot(page)).status).toBe('playing');
  });

  test('TC-0007-10 ブラウザの本物のタッチ（touchscreen.tap）で、操作空間から発射する', async ({ page }) => {
    const point = await controlPoint(page, 144);
    await page.touchscreen.tap(point.x, point.y);
    await expect.poll(async () => (await snapshot(page)).status).toBe('playing');
    expect((await snapshot(page)).paddleX).toBeCloseTo(144, 0);
  });

  test('TC-0007-11 タッチ端末では操作空間が出て、ゲーム領域と左右がそろい、スクロールを止める', async ({ page }) => {
    const area = page.locator('#control-area');
    await expect(area).toBeVisible();
    const box = await area.boundingBox();
    const field = await page.locator('#field').boundingBox();
    if (!box || !field) throw new Error('外形が取れません');
    expect(box.height).toBeCloseTo(96, 0);
    expect(box.x).toBeCloseTo(field.x, 0);
    expect(box.width).toBeCloseTo(field.width, 0);
    // ゲーム領域のすぐ下（間 8）
    expect(box.y - (field.y + field.height)).toBeCloseTo(8, 0);
    const style = await area.evaluate((el) => {
      const s = getComputedStyle(el);
      return { touchAction: s.touchAction, userSelect: s.userSelect || s.webkitUserSelect };
    });
    expect(style).toEqual({ touchAction: 'none', userSelect: 'none' });

    const before = await page.evaluate(() => window.scrollY);
    await touchArea(page, 'pointerdown', 240);
    for (const x of [200, 160, 120]) await touchArea(page, 'pointermove', x);
    await touchArea(page, 'pointerup', 120);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    const prevented = await area.evaluate((el) => !el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })));
    expect(prevented).toBe(true);
  });

  test('TC-0007-14 クリア・ゲームオーバーの結果パネルの間は操作空間を出さず、ゲーム領域の大きさは変えない', async ({ page }) => {
    const area = page.locator('#control-area');
    await expect(area).toBeVisible();
    const before = await page.locator('#field').boundingBox();

    await finishGameOver(page);
    await expect(area).toBeHidden();
    expect(await page.locator('#field').boundingBox()).toEqual(before);

    // RETRY で新しいゲームに戻ると、また出る
    await page.waitForTimeout(500);
    await page.locator('#result-retry').click();
    await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
    await expect(area).toBeVisible();

    await finishCleared(page);
    await expect(area).toBeHidden();
    expect(await page.locator('#field').boundingBox()).toEqual(before);
  });

  test('TC-0007-12 操作空間から外に出ても追従する', async ({ page }) => {
    await touchArea(page, 'pointerdown', 240);
    await touchArea(page, 'pointermove', 700);
    expect(await paddleX(page)).toBe(440);
    await touchArea(page, 'pointerup', 700);
  });
});

test.describe('マウスの端末', () => {
  test.use({ hasTouch: false, isMobile: false });

  test('TC-0007-11 パソコン（マウス）では操作空間が出ない', async ({ page }) => {
    await expect(page.locator('#field')).toBeVisible();
    await expect(page.locator('#control-area')).toBeHidden();
  });
});

test('TC-0007-07 中断されたら追従をやめ、発射もしない', async ({ page }) => {
  await touch(page, 'pointerdown', 240, Y);
  await touch(page, 'pointermove', 200, Y);
  await touch(page, 'pointercancel', 200, Y);
  await touch(page, 'pointermove', 350, Y);
  expect(await paddleX(page)).toBeCloseTo(200, 3);
  await touch(page, 'pointerup', 200, Y);
  await nextFrames(page);
  expect((await snapshot(page)).status).toBe('ready');
});
