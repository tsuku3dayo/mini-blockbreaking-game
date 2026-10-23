import { expect, test } from '@playwright/test';
import { nextFrames, openApp, snapshot, touch, touchAt } from './helpers';

// この段階（WS-0003 の途中）では、開いたらすぐプレイ画面になる。タイトルの START からの流れは TASK-0009

const Y = 500;

async function paddleX(page: Parameters<typeof snapshot>[0]): Promise<number> {
  await nextFrames(page);
  return (await snapshot(page)).paddleX;
}

test.beforeEach(async ({ page }) => {
  await openApp(page);
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
