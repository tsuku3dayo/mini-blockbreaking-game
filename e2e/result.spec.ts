import { expect, test, type Page } from '@playwright/test';
import { finishCleared, finishGameOver, openGame, readStorage, setup, snapshot, startGame, writeStorage } from './helpers';

// 前提：/?debug=1 で START、setup で終了の直前を作り、時計を進めて終わらせる（TC-0006）

test.beforeEach(async ({ page }) => {
  await openGame(page);
});

test('TC-0006-02 クリアの内訳', async ({ page }) => {
  await finishCleared(page);
  const panel = page.locator('#result-panel');
  const breakdown = panel.locator('.result-breakdown');
  await expect(breakdown.locator('dt')).toHaveText(['ブロック', '時間ボーナス', 'タイム', '壊したブロック']);
  await expect(breakdown.locator('dd')).toHaveText(['400', '850', '95.7 秒', '40 / 40']);
  await expect(panel.locator('.result-total dd')).toHaveText('1,250');
  expect((await snapshot(page)).elapsedMs).toBeCloseTo(95789, 6);
  await expect(page).toHaveTitle('ブロック崩しミニ - 結果');
});

test('TC-0006-05 ゲームオーバーの内訳', async ({ page }) => {
  await finishGameOver(page);
  const panel = page.locator('#result-panel');
  await expect(panel.getByRole('heading', { name: 'GAME OVER' })).toBeVisible();
  await expect(panel.locator('.result-breakdown dt')).toHaveText(['壊したブロック']);
  await expect(panel.locator('.result-breakdown dd')).toHaveText(['12 / 40']);
  await expect(panel.locator('.result-total dd')).toHaveText('120');
  for (const label of ['ブロック', '時間ボーナス', 'タイム']) {
    await expect(panel.locator('dt', { hasText: new RegExp(`^${label}$`) })).toHaveCount(0);
  }
});

test('TC-0006-06 見出しの文字とアイコン', async ({ page }) => {
  await finishCleared(page);
  const clear = page.locator('#result-heading');
  await expect(clear).toHaveText('CLEAR!');
  await expect(clear.locator('svg')).toHaveCount(1);
  // スマホ（両プロジェクトともタッチ端末）では見出しに初期フォーカス
  await expect(clear).toBeFocused();

  await page.waitForTimeout(500);
  await page.locator('#result-retry').click();
  await finishGameOver(page);
  const over = page.locator('#result-heading');
  await expect(over).toHaveText('GAME OVER');
  await expect(over.locator('svg')).toHaveCount(1);
});

test('TC-0006-07 パネルはゲーム領域の中に収まり、はみ出す分はスクロールできる', async ({ page }) => {
  await finishCleared(page);
  const field = await page.locator('#field').boundingBox();
  const panel = await page.locator('#result-panel').boundingBox();
  if (!field || !panel) throw new Error('外形が取れません');
  expect(panel.x).toBeGreaterThanOrEqual(field.x - 0.5);
  expect(panel.y).toBeGreaterThanOrEqual(field.y - 0.5);
  expect(panel.x + panel.width).toBeLessThanOrEqual(field.x + field.width + 0.5);
  expect(panel.y + panel.height).toBeLessThanOrEqual(field.y + field.height + 0.5);
  expect(await page.locator('#result-panel').evaluate((el) => getComputedStyle(el).overflowY)).toBe('auto');
  // 一時停止ボタンは終了後は押せない
  await expect(page.locator('#pause-button')).toBeDisabled();
});

test('TC-0006-08 RETRY で新しいゲーム', async ({ page }) => {
  await finishCleared(page);
  await page.waitForTimeout(500);
  await page.locator('#result-retry').click();
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
  await expect(page.locator('#result-panel')).toBeHidden();
  const state = await snapshot(page);
  expect(state.broken).toBe(0);
  expect(state.elapsedMs).toBe(0);
  expect(state.alive.every(Boolean)).toBe(true);
  await expect(page).toHaveTitle('ブロック崩しミニ - プレイ');
  await expect(page.locator('#pause-button')).toBeEnabled();
});

test('TC-0006-08 フォーカスがないときの Enter も RETRY', async ({ page }) => {
  await finishGameOver(page);
  await page.waitForTimeout(500);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Enter');
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
});

test('TC-0006-08 TITLE でタイトル画面', async ({ page }) => {
  await finishGameOver(page);
  await page.waitForTimeout(500);
  await page.locator('#result-title').click();
  await expect(page.locator('#screen-title')).toBeVisible();
  await expect(page.locator('#result-panel')).toBeHidden();
});

test('TC-0006-08 RANKING でランキング画面', async ({ page }) => {
  await finishGameOver(page);
  await page.waitForTimeout(500);
  await page.locator('#result-ranking').click();
  await expect(page.locator('#screen-ranking')).toBeVisible();
});

test('TC-0010-04 結果パネルの間は、高さだけ変わってもゲーム領域を縮めない', async ({ page }) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('viewport がありません');
  await finishGameOver(page);
  const before = await page.locator('#field').boundingBox();

  // ソフトウェアキーボードが出たときのように、高さだけ 300 縮める
  await page.setViewportSize({ width: viewport.width, height: viewport.height - 300 });
  await page.waitForTimeout(200);
  expect(await page.locator('#field').boundingBox()).toEqual(before);

  // 幅が変わったら計算し直す
  await page.setViewportSize({ width: 340, height: viewport.height - 300 });
  await expect.poll(async () => (await page.locator('#field').boundingBox())?.width).not.toBe(before?.width);
});

test('TC-0010-05 結果パネルのボタン・入力欄は 44 px 以上', async ({ page }) => {
  await finishCleared(page);
  const boxes = await page.locator('#result-panel button:visible, #result-panel input:visible').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
  // 入力欄・REGISTER・RETRY・TITLE・RANKING
  expect(boxes).toHaveLength(5);
  for (const b of boxes) {
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
});

test.describe('誤操作を防ぐ（TC-0011、page.clock）', () => {
  /** 時計を止めて開き直し、ゲームオーバーで終わらせる。終わった時点から時計を進めるのはテストの側 */
  async function finishWithClock(page: Page): Promise<void> {
    // 前回の名前を入れておき、REGISTER が押せる状態にする
    await writeStorage(page, { lastName: 'A' });
    await page.clock.install();
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.__appStarted === true)).toBe(true);
    await startGame(page);
    // install() だけでは時計は実時間で進み続ける。止めて、runFor で進めた分だけ進むようにする
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 100);
    await setup(page, { status: 'playing', broken: 12, speedLevel: 1, ball: { x: 100, y: 630, vx: 0, vy: 330 } });
    await page.clock.runFor(100);
    await expect(page.locator('body')).toHaveAttribute('data-game-state', 'gameOver');
    await expect(page.locator('#result-panel')).toBeVisible();
  }

  test('TC-0011-01・02 出てから 500 ms は Enter・Space・タップ・REGISTER が効かず、過ぎれば効く', async ({ page }) => {
    await finishWithClock(page);
    await expect(page.locator('#result-register')).toBeEnabled();
    // 終わってから 400 ms 以内
    await page.clock.runFor(300);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    // 時計を止めていると Playwright の「動きが落ち着くまで待つ」が終わらないので、force で押す
    await page.locator('#result-retry').tap({ force: true });
    await page.locator('#result-retry').click({ force: true });
    await page.locator('#result-register').click({ force: true });
    // 入力欄の Enter でも登録されない
    await page.locator('#result-name').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toHaveAttribute('data-game-state', 'gameOver');
    await expect(page.locator('#result-panel')).toBeVisible();
    expect(await readStorage(page, 'scores')).toBeNull();
    await expect(page.locator('#result-message')).toHaveText('');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    // 500 ms を過ぎれば Enter で新しいゲーム
    await page.clock.runFor(200);
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
    await expect(page.locator('#result-panel')).toBeHidden();
  });

  test('TC-0011-03 TITLE にフォーカスがあるときの Enter はタイトルへ（リトライしない）', async ({ page }) => {
    await finishWithClock(page);
    await page.clock.runFor(600);
    await page.locator('#result-title').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#screen-title')).toBeVisible();
    await expect(page.locator('#screen-play')).toBeHidden();
  });

  test('TC-0011-03 名前の入力欄の Enter は登録だけ（結果パネルのまま）', async ({ page }) => {
    await finishWithClock(page);
    await page.clock.runFor(600);
    await page.locator('#result-name').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#result-message')).toHaveText('1 位で登録しました');
    expect(await readStorage(page, 'scores')).toMatchObject([{ playerName: 'A', score: 120 }]);
    await expect(page.locator('body')).toHaveAttribute('data-game-state', 'gameOver');
    await expect(page.locator('#result-panel')).toBeVisible();
  });

  test('TC-0011-04 結果パネルの入力欄に「A B」と入力できる', async ({ page }) => {
    await finishWithClock(page);
    await page.clock.runFor(600);
    await page.locator('#result-name').focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('A B');
    await expect(page.locator('#result-name')).toHaveValue('A B');
  });

  test('TC-0011-04 終わったらゲーム用の入力を受け付けない', async ({ page }) => {
    await finishWithClock(page);
    await page.clock.runFor(600);
    const before = await snapshot(page);
    // ゲーム中なら効くキー・ポインタを送っても、状態は変わらず、Space の既定の動きも止められない
    await page.mouse.move(10, 10);
    const notPrevented = await page.evaluate(() =>
      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true, cancelable: true })),
    );
    expect(notPrevented).toBe(true);
    await page.keyboard.press('p');
    await page.clock.runFor(200);
    expect(await snapshot(page)).toEqual(before);
  });
});
