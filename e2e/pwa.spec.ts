import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

test('TC-0019-01 タイトル画面に package.json のバージョンが出る', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#version')).toHaveText(version);
  await expect(page.locator('.version')).toHaveText(`v${version}`);
});
