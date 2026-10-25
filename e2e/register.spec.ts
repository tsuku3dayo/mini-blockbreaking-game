import { expect, test, type Page } from '@playwright/test';
import {
  breakStorage,
  finishCleared,
  finishGameOver,
  makeRecord,
  openGame,
  readStorage,
  startGame,
  writeStorage,
  type StoredRecord,
} from './helpers';

// 前提：/?debug=1 で終わらせて結果パネルを出し、500 ms 待つ（TC-0012）

/** 入力ガードが明けるのを待つ */
async function waitGuard(page: Page): Promise<void> {
  await page.waitForTimeout(500);
}

/** 名前を入れて REGISTER を押す */
async function registerName(page: Page, name: string): Promise<void> {
  await page.locator('#result-name').fill(name);
  await page.locator('#result-register').click();
}

test.beforeEach(async ({ page }) => {
  await openGame(page);
});

test('TC-0012-02 前後の空白を除いて保存する', async ({ page }) => {
  await finishCleared(page);
  await waitGuard(page);
  await registerName(page, ' TSUKU ');
  await expect(page.locator('#result-message')).toHaveText('1 位で登録しました');
  expect(await readStorage(page, 'scores')).toMatchObject([{ playerName: 'TSUKU', score: 1250, result: 'cleared' }]);
  await page.locator('#result-ranking').click();
  await expect(page.locator('#ranking-table tbody .ranking-name')).toHaveText(['TSUKU']);
});

test('TC-0012-05 13 文字・ゼロ幅文字を含む名前は REGISTER が押せず、エラー文が出る', async ({ page }) => {
  await finishGameOver(page);
  await waitGuard(page);
  const input = page.locator('#result-name');
  const hint = page.locator('#result-name-hint');
  const button = page.locator('#result-register');

  await input.fill('ABCDEFGHIJKLM');
  await expect(button).toBeDisabled();
  await expect(hint).toHaveText('12 文字以内で入力してください');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#result-name-count')).toHaveText('13 / 12');

  await input.fill('AB​C');
  await expect(button).toBeDisabled();
  await expect(hint).toHaveText('使用できない文字が含まれています');

  // 13 文字でゼロ幅文字を含む → 使えない文字の方を出す
  await input.fill('ABCDEF​GHIJKL');
  await expect(hint).toHaveText('使用できない文字が含まれています');

  await input.fill('ABC');
  await expect(button).toBeEnabled();
  await expect(hint).toHaveText('1〜12 文字');
  await expect(input).toHaveAttribute('aria-invalid', 'false');
});

test('TC-0012-08 ランキング外のときはメッセージを出し、ランキングは変わらない', async ({ page }) => {
  // 最下位 500 の 10 件
  const scores: StoredRecord[] = Array.from({ length: 10 }, (_, i) => makeRecord(i + 1, 1400 - i * 100));
  await writeStorage(page, { scores, nextId: 11 });
  await finishGameOver(page);
  await waitGuard(page);
  await registerName(page, 'LOW');
  await expect(page.locator('#result-message')).toHaveText('ランキング外でした（上位 10 件に入りませんでした）');
  expect(await readStorage(page, 'scores')).toEqual(scores);
  // 圏外でも前回の名前は保存する（仕様書 §9.5）
  expect(await readStorage(page, 'lastName')).toBe('LOW');
});

test('TC-0012-10 1 位で登録し、同じ結果は再登録できない', async ({ page }) => {
  await finishGameOver(page);
  await waitGuard(page);
  await registerName(page, 'TSUKU');
  const message = page.locator('#result-message');
  await expect(message).toHaveText('1 位で登録しました');
  await expect(message.locator('svg')).toHaveCount(1);
  await expect(page.locator('#result-name')).toBeDisabled();
  await expect(page.locator('#result-register')).toBeDisabled();
  expect(await readStorage(page, 'scores')).toHaveLength(1);
  expect(await readStorage(page, 'lastRecordId')).toBe(1);
});

test('TC-0012-11 開き直しても記録が残り、入力欄の初期値が前回の名前', async ({ page }) => {
  await finishGameOver(page);
  await waitGuard(page);
  await registerName(page, 'TSUKU');
  await expect(page.locator('#result-message')).toHaveText('1 位で登録しました');

  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__appStarted === true)).toBe(true);
  expect(await readStorage(page, 'scores')).toMatchObject([{ id: 1, playerName: 'TSUKU', score: 120 }]);
  await page.locator('#title-ranking').click();
  await expect(page.locator('#ranking-table tbody .ranking-name')).toHaveText(['TSUKU']);
  await expect(page.locator('#ranking-table tbody .ranking-score')).toHaveText(['120']);

  await page.locator('#ranking-back').click();
  await startGame(page);
  await finishCleared(page);
  await expect(page.locator('#result-name')).toHaveValue('TSUKU');
  await expect(page.locator('#result-name-count')).toHaveText('5 / 12');
});

test('TC-0012-17 登録に成功したら RETRY にフォーカス', async ({ page }) => {
  await finishCleared(page);
  await waitGuard(page);
  await registerName(page, 'TSUKU');
  await expect(page.locator('#result-retry')).toBeFocused();
});

test('TC-0012-18 名前は文字として扱う', async ({ page }) => {
  await finishGameOver(page);
  await waitGuard(page);
  await registerName(page, '<b>x</b>');
  await expect(page.locator('#result-message')).toHaveText('1 位で登録しました');
  expect(await readStorage(page, 'scores')).toMatchObject([{ playerName: '<b>x</b>' }]);
  await expect(page.locator('#result-panel b')).toHaveCount(0);
  await page.locator('#result-ranking').click();
  await expect(page.locator('#ranking-table tbody .ranking-name')).toHaveText(['<b>x</b>']);
  await expect(page.locator('#ranking-table b')).toHaveCount(0);
});

test('TC-0012-14 補助の文字・文字数・空のエラー', async ({ page }) => {
  await finishGameOver(page);
  const input = page.locator('#result-name');
  const hint = page.locator('#result-name-hint');
  await expect(input).toHaveValue('');
  await expect(hint).toHaveText('1〜12 文字');
  await expect(page.locator('#result-name-count')).toHaveText('0 / 12');
  await expect(page.locator('#result-register')).toBeDisabled();

  await waitGuard(page);
  await input.focus();
  await expect(hint).toHaveText('1〜12 文字');
  await expect(input).toHaveAttribute('aria-invalid', 'false');
  await input.blur();
  await expect(hint).toHaveText('名前を入力してください');
  await expect(input).toHaveAttribute('aria-invalid', 'true');

  await input.fill('AB');
  await expect(hint).toHaveText('1〜12 文字');
  await expect(page.locator('#result-name-count')).toHaveText('2 / 12');
});

test('TC-0012-15 スマホでは見出しに初期フォーカスし、入力欄にはフォーカスしない', async ({ page }) => {
  await finishCleared(page);
  await expect(page.locator('#result-heading')).toBeFocused();
  await expect(page.locator('#result-name')).not.toBeFocused();
});

test.describe('保存できない環境', () => {
  test.beforeEach(async ({ page }) => {
    await breakStorage(page);
    await openGame(page);
  });

  test('TC-0012-12 最後まで遊べ、登録は失敗を伝えて、また押せる', async ({ page }) => {
    await finishGameOver(page);
    await waitGuard(page);
    await registerName(page, 'TSUKU');
    const message = page.locator('#result-message');
    await expect(message).toHaveText('保存できませんでした。もう一度お試しください');
    await expect(page.locator('#result-register')).toBeEnabled();
    await expect(page.locator('#result-name')).toBeEnabled();

    // もう一度押しても同じ。ゲームは続けて遊べる
    await page.locator('#result-register').click();
    await expect(message).toHaveText('保存できませんでした。もう一度お試しください');
    await page.locator('#result-retry').click();
    await expect(page.locator('body')).toHaveAttribute('data-game-state', 'ready');
  });
});
