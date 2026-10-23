import { expect, test } from '@playwright/test';
import { appEvents, openGame, recordAppEvents, setup, snapshot } from './helpers';

test('TC-0005-09 終わったら物理が止まる', async ({ page }) => {
  // 時計を止めて、テストから進める（requestAnimationFrame も止まる）
  await page.clock.install();
  await recordAppEvents(page);
  await openGame(page);

  // パドル（200〜280）から離れた所で、下端の直前から落とす
  await setup(page, { status: 'playing', ball: { x: 100, y: 630, vx: 0, vy: 300 } });
  await page.clock.runFor(500);
  await expect(page.locator('body')).toHaveAttribute('data-game-state', 'gameOver');
  expect((await appEvents(page)).filter((e) => e.type === 'app:state').map((e) => e.detail)).toEqual(['ready', 'playing', 'gameOver']);

  // さらに時計を進めても、状態は変わらない
  const before = await snapshot(page);
  await page.clock.runFor(1000);
  expect(await snapshot(page)).toEqual(before);
});
