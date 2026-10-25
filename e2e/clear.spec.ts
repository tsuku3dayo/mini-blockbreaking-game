import { expect, test, type Page } from '@playwright/test';
import { breakStorage, finishGameOver, makeRecord, openApp, readStorage, startGame, writeStorage } from './helpers';

// 前提：記録は保存データに直接入れる（TC-0023）

const THREE = [makeRecord(1, 1250), makeRecord(2, 980), makeRecord(3, 120)];

const clearButton = (page: Page) => page.locator('#title-clear');
const dialog = (page: Page) => page.locator('#clear-dialog');
const message = (page: Page) => page.locator('#title-clear-message');

test.beforeEach(async ({ page }) => {
  await openApp(page);
  await writeStorage(page, { scores: THREE, nextId: 4, lastName: 'TSUKU', lastRecordId: 2 });
});

test('TC-0023-04 確認が出て、キャンセル・Esc では何も変わらない', async ({ page }) => {
  await clearButton(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole('heading')).toHaveText('記録を全部消しますか？');
  await expect(page.locator('#clear-cancel')).toBeFocused();
  await page.locator('#clear-cancel').click();
  await expect(dialog(page)).toBeHidden();
  await expect(clearButton(page)).toBeFocused();
  expect(await readStorage(page, 'scores')).toHaveLength(3);

  await clearButton(page).click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(clearButton(page)).toBeFocused();
  expect(await readStorage(page, 'scores')).toHaveLength(3);
  await expect(message(page)).toHaveText('');
  // タイトル画面のまま（Esc・Enter でほかの画面に移らない）
  await expect(page.locator('#screen-title')).toBeVisible();
});

test('TC-0023-05 「消す」でランキングが 0 件になる', async ({ page }) => {
  await clearButton(page).click();
  await page.locator('#clear-confirm').click();
  await expect(dialog(page)).toBeHidden();
  await expect(message(page)).toHaveText('記録を消しました');
  await expect(message(page)).toHaveClass(/is-success/);
  await expect(clearButton(page)).toBeFocused();
  await page.locator('#title-ranking').click();
  await expect(page.locator('#ranking-empty')).toContainText('まだ記録がありません');
  // タイトルに戻るとメッセージは消えている
  await page.locator('#ranking-back').click();
  await expect(message(page)).toHaveText('');
  await expect(message(page)).toBeHidden();
});

test('TC-0023-06 消しても前回の名前と番号は残る', async ({ page }) => {
  await clearButton(page).click();
  await page.locator('#clear-confirm').click();
  await expect(message(page)).toHaveText('記録を消しました');
  expect(await readStorage(page, 'lastRecordId')).toBeNull();
  expect(await readStorage(page, 'nextId')).toBe(4);

  await startGame(page);
  await finishGameOver(page);
  await expect(page.locator('#result-name')).toHaveValue('TSUKU');
  await page.waitForTimeout(500);
  await page.locator('#result-register').click();
  await expect(page.locator('#result-message')).toHaveText('1 位で登録しました');
  expect(await readStorage(page, 'scores')).toMatchObject([{ id: 4, playerName: 'TSUKU' }]);
});

test('TC-0023-08 ボタンの大きさと危険のボタン', async ({ page }) => {
  const sizes = [await clearButton(page).boundingBox()];
  await clearButton(page).click();
  sizes.push(await page.locator('#clear-cancel').boundingBox(), await page.locator('#clear-confirm').boundingBox());
  for (const box of sizes) {
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('#clear-confirm')).toHaveClass(/danger/);
  await expect(page.locator('#clear-confirm')).toHaveText('消す');
});

test.describe('保存できない環境', () => {
  test.beforeEach(async ({ page }) => {
    await breakStorage(page);
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.__appStarted === true)).toBe(true);
  });

  test('TC-0023-07 消せないときはメッセージを出し、記録は変わらない', async ({ page }) => {
    await clearButton(page).click();
    await page.locator('#clear-confirm').click();
    await expect(message(page)).toHaveText('消せませんでした。もう一度お試しください');
    await expect(message(page)).toHaveClass(/is-danger/);
    expect(await readStorage(page, 'scores')).toHaveLength(3);
  });
});
