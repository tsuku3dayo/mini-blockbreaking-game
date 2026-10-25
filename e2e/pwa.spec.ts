import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { finishGameOver, openApp, startGame } from './helpers';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

test('TC-0019-01 タイトル画面に package.json のバージョンが出る', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#version')).toHaveText(version);
  await expect(page.locator('.version')).toHaveText(`v${version}`);
});

test('TC-0019-03 更新の帯はタイトル・ランキングだけに出し、プレイ画面では出さない', async ({ page }) => {
  await openApp(page);
  const banner = page.locator('#update-banner');
  await expect(banner).toBeHidden();
  await page.evaluate(() => window.__breakout?.showUpdateBanner());
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('新しい版があります');
  await expect(banner.getByRole('button', { name: '更新' })).toBeVisible();

  // プレイ画面（結果パネルを含む）では出さない
  await startGame(page);
  await expect(banner).toBeHidden();
  await finishGameOver(page);
  await expect(banner).toBeHidden();

  // ランキング・タイトルに移ると出る
  await page.waitForTimeout(500);
  await page.locator('#result-ranking').click();
  await expect(banner).toBeVisible();
  await page.locator('#ranking-back').click();
  await expect(page.locator('#screen-title')).toBeVisible();
  await expect(banner).toBeVisible();
});

// ── インストール（TC-0017） ──

test('TC-0017-01 インストール方法の入口が出る', async ({ page }) => {
  await openApp(page, './');
  await expect(page.locator('#install-open')).toBeVisible();
});

test.describe('インストール済みのアプリとして開いたとき', () => {
  test.beforeEach(async ({ page }) => {
    // display-mode: standalone だけを真にする（ほかの問い合わせはそのまま）
    await page.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = (query: string) => {
        const result = original(query);
        if (!query.includes('display-mode: standalone')) return result;
        // MediaQueryList の matches は読み取り専用なので、同じ形のふつうのオブジェクトを返す
        return {
          matches: true,
          media: query,
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => false,
        } as MediaQueryList;
      };
    });
  });

  test('TC-0017-01 インストール済みでは入口が出ない', async ({ page }) => {
    await openApp(page, './');
    await expect(page.locator('#title-start')).toBeVisible();
    await expect(page.locator('#install-open')).toBeHidden();
  });
});

test('TC-0017-02 3 つの手順があり、今の端末（Android）の項目が開いている', async ({ page }) => {
  await openApp(page, './');
  await page.locator('#install-open').click();
  const dialog = page.locator('#install-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toHaveText('アプリとしてインストールする方法');
  await expect(dialog.locator('details summary')).toHaveText(['iPhone / iPad（Safari）', 'Android（Chrome）', 'パソコン（Chrome / Edge）']);
  // 両プロジェクトとも Pixel 7 の UA（Android）
  expect(await dialog.locator('details').evaluateAll((els) => els.map((el) => (el as HTMLDetailsElement).open))).toEqual([false, true, false]);
  await expect(dialog.locator('details[data-platform="android"] li')).toHaveCount(3);
  await expect(dialog).toContainText('ホーム画面から開くと、電波がなくても遊べます。');
  // 閉じると入口にフォーカスが戻る
  await dialog.getByRole('button', { name: '閉じる' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#install-open')).toBeFocused();
});

test('TC-0017-03 「今すぐインストール」は beforeinstallprompt を受けたときだけ出る', async ({ page }) => {
  await openApp(page, './');
  await page.locator('#install-open').click();
  await expect(page.locator('#install-now')).toBeHidden();
  await page.locator('#install-dialog').getByRole('button', { name: '閉じる' }).click();

  // ブラウザがインストールを促すイベントを出したことにする
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt(): Promise<void> };
    (window as unknown as { __prompted: number }).__prompted = 0;
    event.prompt = () => {
      (window as unknown as { __prompted: number }).__prompted += 1;
      return Promise.resolve();
    };
    window.dispatchEvent(event);
  });
  await page.locator('#install-open').click();
  await expect(page.locator('#install-now')).toBeVisible();
  await page.locator('#install-now').click();
  expect(await page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);
  // 一度使ったら隠す
  await expect(page.locator('#install-now')).toBeHidden();
});

// ── オフライン（TC-0018） ──

/** Service Worker が入り、このページを制御するまで待つ（初回は読み込み直して制御させる） */
async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test('TC-0018-01 オフラインでも起動・プレイ・登録・ランキング表示ができる', async ({ page, context }) => {
  await openApp(page);
  await waitForServiceWorker(page);

  await context.setOffline(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__appStarted === true)).toBe(true);
  await expect(page.locator('#title-start')).toBeVisible();

  await startGame(page);
  await finishGameOver(page);
  await page.waitForTimeout(500);
  await page.locator('#result-name').fill('OFFLINE');
  await page.locator('#result-register').click();
  await expect(page.locator('#result-message')).toHaveText('1 位で登録しました');
  await page.locator('#result-ranking').click();
  await expect(page.locator('#ranking-table tbody .ranking-name')).toHaveText(['OFFLINE']);
  await context.setOffline(false);
});

test('TC-0018-02・03 外部のリソースを読まず、GET 以外を送らない', async ({ page, baseURL }) => {
  const requests: { url: string; method: string }[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));

  // 全画面を回る：タイトル → インストール方法 → プレイ → 結果（登録）→ ランキング → タイトル
  await openApp(page);
  await page.locator('#install-open').click();
  await page.locator('#install-dialog').getByRole('button', { name: '閉じる' }).click();
  await startGame(page);
  await finishGameOver(page);
  await page.waitForTimeout(500);
  await page.locator('#result-name').fill('A');
  await page.locator('#result-register').click();
  await page.locator('#result-ranking').click();
  await expect(page.locator('#ranking-table')).toBeVisible();
  await page.locator('#ranking-back').click();
  await expect(page.locator('#screen-title')).toBeVisible();

  const origin = new URL(baseURL ?? 'http://localhost:4173').origin;
  const http = requests.filter((r) => r.url.startsWith('http'));
  expect(http.length).toBeGreaterThan(0);
  expect(http.filter((r) => new URL(r.url).origin !== origin)).toEqual([]);
  expect(requests.filter((r) => r.method !== 'GET')).toEqual([]);
});
