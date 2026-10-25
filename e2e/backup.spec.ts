import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { makeRecord, openApp, readStorage, STORAGE_PREFIX, writeStorage } from './helpers';

// 前提：記録は保存データに直接入れ、ランキング画面から書き出す・読み込む（TC-0014）

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const rows = (page: Page) => page.locator('#ranking-table tbody tr');
const message = (page: Page) => page.locator('#backup-message');

async function openRanking(page: Page): Promise<void> {
  await page.locator('#title-ranking').click();
  await expect(page.locator('#screen-ranking')).toBeVisible();
}

/** 「記録を読み込む」でファイルを選ぶ */
async function chooseFile(page: Page, name: string): Promise<void> {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#backup-import').click()]);
  await chooser.setFiles(fixture(name));
}

/** 保存データを全部消す */
function clearStorage(page: Page): Promise<void> {
  return page.evaluate((prefix) => {
    for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key);
  }, STORAGE_PREFIX);
}

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test('TC-0014-01・07 書き出したファイルを読み込むと、同じ表と「（あなた）」に戻る', async ({ page }) => {
  await writeStorage(page, { scores: [makeRecord(1, 1250), makeRecord(2, 980), makeRecord(3, 120)], nextId: 4, lastName: 'P2', lastRecordId: 2 });
  await openRanking(page);
  const before = await rows(page).allInnerTexts();
  expect(before).toHaveLength(3);

  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#backup-export').click()]);
  // ファイル名は端末の日付
  const today = await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  });
  expect(download.suggestedFilename()).toBe(`mini-blockbreaking-game-backup-${today}.json`);
  const path = await download.path();
  const text = await readFile(path, 'utf8');
  expect(JSON.parse(text)).toMatchObject({ app: 'mini-blockbreaking-game', schemaVersion: 1, nextId: 4, lastPlayerName: 'P2', lastRecordId: 2 });

  // 保存データを消してから読み込む
  await clearStorage(page);
  await page.locator('#ranking-back').click();
  await openRanking(page);
  await expect(page.locator('#ranking-empty')).toBeVisible();

  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#backup-import').click()]);
  await chooser.setFiles({ name: download.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.from(text) });
  await expect(page.locator('#import-dialog')).toBeVisible();
  await page.locator('#import-confirm').click();
  await expect(message(page)).toHaveText('記録を読み込みました（3 件）');
  expect(await rows(page).allInnerTexts()).toEqual(before);
  await expect(rows(page).nth(1).locator('.ranking-you')).toHaveText('（あなた）');
  expect(await readStorage(page, 'nextId')).toBe(4);
  expect(await readStorage(page, 'lastName')).toBe('P2');
});

test('TC-0014-03・05 読み込めないファイルは理由を出し、確認を出さず、表は変わらない', async ({ page }) => {
  await writeStorage(page, { scores: [makeRecord(1, 1250)] });
  await openRanking(page);
  const cases: [string, string][] = [
    ['other-app.json', '別のアプリの記録です'],
    ['too-new.json', '新しい版のアプリで書き出した記録です。アプリを更新してから読み込んでください'],
    ['broken.json', '記録のファイルとして読み込めませんでした'],
    ['invalid-score.json', '記録の内容が正しくありません'],
  ];
  for (const [name, text] of cases) {
    await chooseFile(page, name);
    await expect(message(page)).toHaveText(text);
    await expect(message(page)).toHaveClass(/is-danger/);
    await expect(page.locator('#import-dialog')).toBeHidden();
    await expect(rows(page)).toHaveCount(1);
    expect(await readStorage(page, 'scores')).toHaveLength(1);
  }
});

test('TC-0014-06 確認でキャンセル・Esc なら何も変わらない', async ({ page }) => {
  await writeStorage(page, { scores: [makeRecord(1, 1250)] });
  await openRanking(page);

  await chooseFile(page, 'valid.json');
  const dialog = page.locator('#import-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toHaveText('記録を読み込みますか？');
  await expect(page.locator('#import-cancel')).toBeFocused();
  await page.locator('#import-cancel').click();
  await expect(dialog).toBeHidden();
  await expect(rows(page)).toHaveCount(1);
  await expect(page.locator('#backup-import')).toBeFocused();

  await chooseFile(page, 'valid.json');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(rows(page)).toHaveCount(1);
  // Esc でダイアログだけが閉じ、タイトルには戻らない
  await expect(page.locator('#screen-ranking')).toBeVisible();
  expect(await readStorage(page, 'scores')).toHaveLength(1);
});

test('TC-0014-08 読み込みに成功したら件数を出し、表を作り直す', async ({ page }) => {
  await openRanking(page);
  await expect(page.locator('#ranking-empty')).toBeVisible();
  await chooseFile(page, 'valid.json');
  await page.locator('#import-confirm').click();
  await expect(message(page)).toHaveText('記録を読み込みました（3 件）');
  await expect(message(page)).toHaveClass(/is-success/);
  await expect(rows(page).locator('.ranking-name')).toHaveText(['HARU', 'TSUKU', 'AKI']);
  await expect(rows(page).nth(1).locator('.ranking-you')).toHaveText('（あなた）');
  // 開き直すとメッセージは消える
  await page.locator('#ranking-back').click();
  await openRanking(page);
  await expect(message(page)).toBeHidden();
});

test('バックアップの欄は 0 件・読み込み失敗のときも出て、ボタンは 44 px 以上', async ({ page }) => {
  await openRanking(page);
  await expect(page.locator('#ranking-backup')).toBeVisible();
  await page.locator('#ranking-back').click();
  await page.evaluate((key) => localStorage.setItem(key, '[{'), `${STORAGE_PREFIX}scores`);
  await openRanking(page);
  await expect(page.locator('#ranking-error')).toBeVisible();
  await expect(page.locator('#ranking-backup')).toBeVisible();
  for (const id of ['#backup-export', '#backup-import']) {
    const box = await page.locator(id).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  // 読み込みで、壊れた記録を戻せる
  await chooseFile(page, 'valid.json');
  await page.locator('#import-confirm').click();
  await expect(rows(page)).toHaveCount(3);
});
