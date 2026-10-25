import { expect, test, type Page } from '@playwright/test';
import { appEvents, finishCleared, finishGameOver, openGame, recordAppEvents, setup } from './helpers';

// 前提：app:sound イベントの detail（name・muted）を addInitScript で記録する（TC-0015）

interface SoundDetail {
  name: string;
  muted: boolean;
}

/** 記録した app:sound の detail */
async function sounds(page: Page): Promise<SoundDetail[]> {
  return (await appEvents(page)).filter((e) => e.type === 'app:sound').map((e) => e.detail as SoundDetail);
}

/** ここまでの記録を捨てる */
function clearEvents(page: Page): Promise<void> {
  return page.evaluate(() => {
    if (window.__appEvents) window.__appEvents.length = 0;
  });
}

/** 名前を記録した音が出るまで待つ */
async function expectSound(page: Page, name: string): Promise<void> {
  await expect.poll(async () => (await sounds(page)).map((s) => s.name)).toContain(name);
}

test.beforeEach(async ({ page }) => {
  await recordAppEvents(page);
  await openGame(page);
});

test('TC-0015-01 8 種類の音が鳴る', async ({ page }) => {
  // 発射。START のクリックで鳴らせる状態になっている（muted でない）
  await page.keyboard.press('Space');
  await expectSound(page, 'launch');
  expect((await sounds(page)).find((s) => s.name === 'launch')?.muted).toBe(false);

  // パドル：真上から落とす
  await clearEvents(page);
  await setup(page, { status: 'playing', paddleX: 240, ball: { x: 240, y: 585, vx: 0, vy: 300 } });
  await expectSound(page, 'paddle');

  // 壁：左の壁へ
  await clearEvents(page);
  await setup(page, { status: 'playing', ball: { x: 12, y: 400, vx: -300, vy: -100 } });
  await expectSound(page, 'wall');

  // ブロック：最下段（行 4）の 1 列目を下から
  await clearEvents(page);
  await setup(page, { status: 'playing', speedLevel: 1, broken: 0, ball: { x: 44, y: 215, vx: 0, vy: -300 } });
  await expectSound(page, 'block');

  // 加速：9 個壊した状態から 1 個
  await clearEvents(page);
  await setup(page, { status: 'playing', aliveIds: [32, 33], broken: 9, speedLevel: 0, ball: { x: 44, y: 215, vx: 0, vy: -300 } });
  await expectSound(page, 'speedUp');
  expect((await sounds(page)).map((s) => s.name)).toContain('block');

  // クリア
  await clearEvents(page);
  await finishCleared(page);
  await expectSound(page, 'clear');

  // 登録
  await page.waitForTimeout(500);
  await page.locator('#result-name').fill('TSUKU');
  await page.locator('#result-register').click();
  await expectSound(page, 'register');

  // ゲームオーバー
  await page.locator('#result-retry').click();
  await clearEvents(page);
  await finishGameOver(page);
  await expectSound(page, 'gameOver');
});

test('TC-0015-04 最後のブロックを壊したフレームは clear だけ', async ({ page }) => {
  await clearEvents(page);
  // 加速の境目（39 → 40）でもあるが、clear だけになる
  await finishCleared(page);
  await expectSound(page, 'clear');
  expect((await sounds(page)).map((s) => s.name)).toEqual(['clear']);
});

test.describe('音が使えない環境', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      delete w.AudioContext;
      delete w.webkitAudioContext;
    });
  });

  test('TC-0015-05 AudioContext がなくてもエラーなく 1 ゲーム終えられる', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (e) => errors.push(e));
    await page.reload();
    await expect.poll(() => page.evaluate(() => typeof window.AudioContext)).toBe('undefined');
    await expect.poll(() => page.evaluate(() => window.__appStarted === true)).toBe(true);
    await page.locator('#title-start').click();
    await page.keyboard.press('Space');
    await expectSound(page, 'launch');
    await finishGameOver(page);
    await expect(page.locator('#result-panel')).toBeVisible();
    expect(errors).toEqual([]);
    // 鳴らす判断はするが、鳴らさない
    const all = await sounds(page);
    expect(all.map((s) => s.name)).toContain('gameOver');
    expect(all.every((s) => s.muted)).toBe(true);
  });
});
