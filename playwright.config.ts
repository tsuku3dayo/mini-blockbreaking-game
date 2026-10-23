import { defineConfig, devices } from '@playwright/test';

// 本番と同じ build 済みの成果物を preview で配信してテストする（Service Worker も本物が動く）
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // アニメーションは既定で無効。見たいテストだけ test.use({ reducedMotion: 'no-preference' }) で解除する
    reducedMotion: 'reduce',
  },
  // 標準のスマホ（Pixel 7）と、小さい画面（iPhone SE 相当の 375 × 667）の 2 つで動かす（ADR-0008）
  projects: [
    { name: 'pixel7', use: { ...devices['Pixel 7'] } },
    {
      name: 'small',
      use: {
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
        userAgent: devices['Pixel 7'].userAgent,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
