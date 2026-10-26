import { expect, test, type Page } from '@playwright/test';
import { finishCleared, finishGameOver, makeRecord, openApp, openGame, setup, startGame, writeStorage } from './helpers';

// 前提：#announcer の文字の変化を MutationObserver で記録する（TC-0021）

declare global {
  interface Window {
    __announced?: string[];
  }
}

/** 通知領域に出た文を記録する。page.goto の前に呼ぶ */
async function recordAnnouncements(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__announced = [];
    document.addEventListener('DOMContentLoaded', () => {
      const region = document.getElementById('announcer');
      if (!region) return;
      new MutationObserver(() => {
        const text = region.textContent ?? '';
        if (text) window.__announced?.push(text);
      }).observe(region, { childList: true, characterData: true, subtree: true });
    });
  });
}

const announced = (page: Page) => page.evaluate(() => window.__announced ?? []);

test('TC-0021-01 ゲーム領域の代替テキスト', async ({ page }) => {
  await openGame(page);
  await expect(page.getByRole('img', { name: 'ブロック崩しミニのゲーム画面' })).toBeVisible();
});

test('TC-0021-02 スコア・一時停止・再開・クリアを読み上げる', async ({ page }) => {
  await recordAnnouncements(page);
  await openGame(page);
  // 最下段の 1 列目を下から壊す（ブロック得点 10）
  await setup(page, { status: 'playing', ball: { x: 44, y: 215, vx: 0, vy: -300 } });
  await expect.poll(() => announced(page)).toContain('スコア 10');

  await page.locator('#pause-button').click();
  await expect.poll(() => announced(page)).toContain('一時停止しました。再開ボタンで再開します');
  await page.locator('#pause-button').click();
  await expect.poll(() => announced(page)).toContain('再開しました');

  await finishCleared(page);
  await expect.poll(() => announced(page)).toContain('クリア。スコア 1,250');
  const list = await announced(page);
  const order = ['スコア 10', '一時停止しました。再開ボタンで再開します', '再開しました', 'クリア。スコア 1,250'].map((t) => list.indexOf(t));
  expect(order).toEqual([...order].sort((a, b) => a - b));
  // 通知領域は画面に出さず、aria-live で伝える
  await expect(page.locator('#announcer')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#announcer')).toHaveClass(/sr-only/);
});

test('TC-0021-03 ゲームオーバーを読み上げる', async ({ page }) => {
  await recordAnnouncements(page);
  await openGame(page);
  await finishGameOver(page);
  await expect.poll(() => announced(page)).toContain('ゲームオーバー。スコア 120');
});

test('TC-0021-04 トグルボタンの状態を aria-pressed で伝える', async ({ page }) => {
  await openGame(page);
  const pause = page.locator('#pause-button');
  const sound = page.locator('#play-sound');
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
});

test('TC-0021-05 色だけに頼らず、文字で伝える', async ({ page }) => {
  await openApp(page);
  await writeStorage(page, {
    scores: [makeRecord(1, 1250), makeRecord(2, 120)],
    lastRecordId: 2,
  });
  await page.locator('#title-ranking').click();
  const meta = page.locator('#ranking-table tbody .ranking-meta');
  await expect(meta.nth(0)).toContainText('CLEAR');
  await expect(meta.nth(1)).toContainText('GAME OVER');
  await expect(page.locator('#ranking-table tbody tr').nth(1).locator('.ranking-you')).toHaveText('（あなた）');

  await page.locator('#ranking-back').click();
  await startGame(page);
  await finishCleared(page);
  await expect(page.locator('#result-heading')).toHaveText('CLEAR!');
  await page.waitForTimeout(500);
  await page.locator('#result-retry').click();
  await finishGameOver(page);
  await expect(page.locator('#result-heading')).toHaveText('GAME OVER');
});

/** Tab を押していき、フォーカスが移った部品の名前と、フォーカスの輪があるかを集める */
async function tabThrough(page: Page, count: number): Promise<{ id: string; outline: boolean }[]> {
  const seen: { id: string; outline: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab');
    seen.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const s = el ? getComputedStyle(el) : null;
        return { id: el?.id || el?.textContent?.trim() || '', outline: !!s && s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 };
      }),
    );
  }
  return seen;
}

test.describe('キーボード（パソコン）', () => {
  test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 800 } });

  test('TC-0021-07 タイトル・ランキング・プレイ・結果のボタンに Tab で届き、フォーカスの輪が見える', async ({ page }) => {
    await openApp(page);
    await writeStorage(page, { scores: [makeRecord(1, 1250)] });
    // タイトル：START に初期フォーカス → RANKING → クレジット → 効果音 → 記録を全部消す → インストール方法
    const title = await tabThrough(page, 5);
    expect(title.map((s) => s.id)).toEqual(['title-ranking', 'title-credits', 'title-sound', 'title-clear', 'install-open']);
    expect(title.every((s) => s.outline)).toBe(true);

    // ランキング：見出しに初期フォーカス。見出しは BACK より後ろにあるので、Shift+Tab で BACK、
    // そこから Tab で 書き出す → 読み込む（見出しは tabindex="-1" なので Tab では止まらない）
    await page.locator('#title-ranking').click();
    await expect(page.locator('#ranking-heading')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#ranking-back')).toBeFocused();
    expect(await page.locator('#ranking-back').evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
    const ranking = await tabThrough(page, 2);
    expect(ranking.map((s) => s.id)).toEqual(['backup-export', 'backup-import']);
    expect(ranking.every((s) => s.outline)).toBe(true);

    // プレイ：ゲーム領域に初期フォーカス → 一時停止 → 効果音
    await page.locator('#ranking-back').click();
    await startGame(page);
    await expect(page.locator('#field')).toBeFocused();
    const play = await tabThrough(page, 2);
    expect(play.map((s) => s.id)).toEqual(['pause-button', 'play-sound']);
    expect(play.every((s) => s.outline)).toBe(true);

    // 結果：名前の入力欄に初期フォーカス（パソコン）→ REGISTER（押せないので飛ばす）→ RETRY → TITLE → RANKING
    await finishGameOver(page);
    await expect(page.locator('#result-name')).toBeFocused();
    await page.waitForTimeout(500);
    await page.keyboard.type('A');
    const result = await tabThrough(page, 4);
    expect(result.map((s) => s.id)).toEqual(['result-register', 'result-retry', 'result-title', 'result-ranking']);
    expect(result.every((s) => s.outline)).toBe(true);
  });
});

test('TC-0021-08 動きを減らす設定では、画面の切替えと結果パネルの動きがない', async ({ page }) => {
  // 既定の reducedMotion: 'reduce'（playwright.config.ts）
  await openGame(page);
  const durations = (selector: string) =>
    page.locator(selector).evaluate((el) => {
      const s = getComputedStyle(el);
      return { animation: s.animationDuration, transition: s.transitionDuration };
    });
  expect(await durations('#screen-play')).toEqual({ animation: '0s', transition: '0s' });
  await finishGameOver(page);
  expect(await durations('#result-panel')).toEqual({ animation: '0s', transition: '0s' });
});

test.describe('動きを減らさない設定', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('TC-0021-08 設定がなければ、画面の切替え 150 ms・結果パネル 200 ms の動きがある', async ({ page }) => {
    await openGame(page);
    expect(await page.locator('#screen-play').evaluate((el) => getComputedStyle(el).animationDuration)).toBe('0.15s');
    await finishGameOver(page);
    expect(await page.locator('#result-panel').evaluate((el) => getComputedStyle(el).animationDuration)).toBe('0.2s');
  });
});
