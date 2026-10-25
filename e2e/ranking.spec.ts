import { expect, test, type Page } from '@playwright/test';
import { finishGameOver, makeRecord, openApp, openGame, startGame, STORAGE_PREFIX, writeStorage, type StoredRecord } from './helpers';

// 前提：記録は保存データに直接入れる（必要なときだけ画面で登録する）（TC-0013）

// 日時の表示を決まった値で確かめるため、タイムゾーンをそろえる
test.use({ timezoneId: 'Asia/Tokyo' });

/** タイトル画面から RANKING を開く（開くたびに保存から読み直す） */
async function openRanking(page: Page): Promise<void> {
  await page.locator('#title-ranking').click();
  await expect(page.locator('#screen-ranking')).toBeVisible();
}

/** ランキング画面からタイトルへ戻って、もう一度開く */
async function reopenRanking(page: Page): Promise<void> {
  await page.locator('#ranking-back').click();
  await expect(page.locator('#screen-title')).toBeVisible();
  await openRanking(page);
}

const rows = (page: Page) => page.locator('#ranking-table tbody tr');

/** 結果パネルで名前を入れて登録する（入力ガードが明けるのを待ってから） */
async function registerOnPanel(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(500);
  await page.locator('#result-name').fill(name);
  await page.locator('#result-register').click();
}

test('TC-0013-02 登録時の順位と、ランキングの順位が一致する', async ({ page }) => {
  await openGame(page);
  await finishGameOver(page);
  await registerOnPanel(page, 'A');
  await expect(page.locator('#result-message')).toHaveText('1 位で登録しました');
  await page.locator('#result-retry').click();

  await finishGameOver(page);
  await registerOnPanel(page, 'B');
  await expect(page.locator('#result-message')).toHaveText('2 位で登録しました');
  await page.locator('#result-ranking').click();
  await expect(rows(page).nth(1).locator('.ranking-name')).toHaveText('B');
  await expect(rows(page).nth(1).locator('th')).toHaveText('2nd');
});

test('TC-0013-03 自分の記録の行だけに「（あなた）」と強調のクラス', async ({ page }) => {
  await openApp(page);
  await writeStorage(page, { scores: [makeRecord(1, 1400), makeRecord(2, 50)], nextId: 3 });
  await startGame(page);
  await finishGameOver(page);
  await registerOnPanel(page, 'ME');
  await expect(page.locator('#result-message')).toHaveText('2 位で登録しました');
  await page.locator('#result-ranking').click();

  await expect(rows(page)).toHaveCount(3);
  await expect(rows(page).nth(1).locator('.ranking-name')).toHaveText('ME');
  await expect(rows(page).nth(1).locator('.ranking-you')).toHaveText('（あなた）');
  await expect(rows(page).nth(1)).toHaveClass(/is-mine/);
  for (const i of [0, 2]) {
    await expect(rows(page).nth(i).locator('.ranking-you')).toHaveCount(0);
    await expect(rows(page).nth(i)).not.toHaveClass(/is-mine/);
  }
});

test('TC-0013-04 0 件の表示と、読み込み失敗からの再読み込み', async ({ page }) => {
  await openApp(page);
  await openRanking(page);
  await expect(page.locator('#ranking-empty')).toContainText('まだ記録がありません');
  await expect(page.locator('#ranking-table')).toHaveCount(0);
  await page.locator('#ranking-empty-title').click();
  await expect(page.locator('#screen-title')).toBeVisible();

  // scores を壊れた JSON にして開く
  await page.evaluate((key) => localStorage.setItem(key, '[{'), `${STORAGE_PREFIX}scores`);
  await openRanking(page);
  await expect(page.locator('#ranking-error')).toContainText('ランキングを読み込めませんでした');
  await expect(page.locator('#ranking-error svg')).toHaveCount(1);

  // 直してから「再読み込み」
  await writeStorage(page, { scores: [makeRecord(1, 1250)] });
  await page.locator('#ranking-reload').click();
  await expect(rows(page)).toHaveCount(1);
  await expect(page.locator('#ranking-error')).toHaveCount(0);
  await expect(page.locator('#ranking-heading')).toBeFocused();
});

test('TC-0013-05 列と順位の表示（1〜3 位は強調）', async ({ page }) => {
  await openApp(page);
  await writeStorage(page, { scores: [makeRecord(1, 1250), makeRecord(2, 980), makeRecord(3, 400), makeRecord(4, 120)] });
  await openRanking(page);
  await expect(page.locator('#ranking-table thead th')).toHaveText(['順位', '名前', 'スコア']);
  await expect(rows(page).locator('th')).toHaveText(['1st', '2nd', '3rd', '4']);
  await expect(rows(page).locator('.ranking-score')).toHaveText(['1,250', '980', '400', '120']);
  for (const i of [0, 1, 2]) await expect(rows(page).nth(i).locator('th')).toHaveClass(/is-top/);
  await expect(rows(page).nth(3).locator('th')).not.toHaveClass(/is-top/);
  await expect(page.locator('#ranking-table caption')).toHaveText('上位 10 件の記録');
  await expect(rows(page).nth(0).locator('th')).toHaveAttribute('scope', 'row');
});

test('TC-0013-06 長い名前は省略記号で切れ、title に全文。「（あなた）」は見える', async ({ page }) => {
  const name = 'とても長い名前のプレイヤ';
  expect([...name]).toHaveLength(12);
  // 文字の幅はフォントで変わり、幅 375・412 では収まって切れないことがある（CI の Linux など）。
  // どのフォントでも切れるよう、幅を 320 に狭めて確かめる（名前に使える幅は約 97 px）
  await page.setViewportSize({ width: 320, height: 667 });
  await openApp(page);
  await writeStorage(page, { scores: [makeRecord(1, 1250, name)], lastRecordId: 1 });
  await openRanking(page);
  const cell = rows(page).nth(0).locator('.ranking-name');
  await expect(cell).toHaveText(name);
  await expect(cell).toHaveAttribute('title', name);
  expect(await cell.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await cell.evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis');
  const you = rows(page).nth(0).locator('.ranking-you');
  await expect(you).toBeVisible();
  // 「（あなた）」は切れずに表の中に収まる
  const youBox = await you.boundingBox();
  const rowBox = await rows(page).nth(0).boundingBox();
  if (!youBox || !rowBox) throw new Error('外形が取れません');
  expect(youBox.x + youBox.width).toBeLessThanOrEqual(rowBox.x + rowBox.width);
  expect(await you.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test('TC-0013-07 結果と登録日時', async ({ page }) => {
  await openApp(page);
  const scores: StoredRecord[] = [
    { ...makeRecord(1, 1250), createdAt: '2026-10-23T03:15:00.123Z' },
    { ...makeRecord(2, 120), createdAt: '2026-10-21T12:00:00.000Z' },
  ];
  await writeStorage(page, { scores });
  await openRanking(page);
  await expect(rows(page).locator('.ranking-meta')).toHaveText(['CLEAR · 2026/10/23 12:15', 'GAME OVER · 2026/10/21 21:00']);
  await expect(rows(page).nth(0).locator('.ranking-meta svg')).toHaveCount(1);
  await expect(rows(page).nth(1).locator('.ranking-meta svg')).toHaveCount(1);
});

test('TC-0013-08 12 文字の名前 10 件でも横スクロールしない', async ({ page }, info) => {
  test.skip(info.project.name !== 'small', 'small プロジェクトで確かめる');
  await openApp(page);
  const scores = Array.from({ length: 10 }, (_, i) => makeRecord(i + 1, 2200 - i * 100, `ＷＷＷＷＷＷＷＷＷＷＷ${i}`));
  await writeStorage(page, { scores, lastRecordId: 3 });
  await openRanking(page);
  await expect(rows(page)).toHaveCount(10);
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  const table = await page.locator('#ranking-table').evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
  expect(table.scrollWidth).toBeLessThanOrEqual(table.clientWidth);
});

test('TC-0013-09 開いたら見出しにフォーカス。Esc・BACK でタイトルへ', async ({ page }) => {
  await openApp(page);
  await openRanking(page);
  await expect(page.locator('#ranking-heading')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#screen-title')).toBeVisible();

  await openRanking(page);
  await expect(page.locator('#ranking-heading')).toBeFocused();
  await page.locator('#ranking-back').click();
  await expect(page.locator('#screen-title')).toBeVisible();
});

test('TC-0013-10 開くたびに保存から読み直す', async ({ page }) => {
  await openApp(page);
  await writeStorage(page, { scores: [makeRecord(1, 1250)] });
  await openRanking(page);
  await expect(rows(page)).toHaveCount(1);
  await writeStorage(page, { scores: [makeRecord(1, 1250), makeRecord(2, 980)] });
  await reopenRanking(page);
  await expect(rows(page)).toHaveCount(2);
  await expect(rows(page).nth(1).locator('.ranking-name')).toHaveText('P2');
});
