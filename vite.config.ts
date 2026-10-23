/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const { version, name: appId } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string; name: string };

// PWA（manifest・Service Worker）の設定は TASK-0002 で足す（TD-0001 §5）

export default defineConfig({
  // GitHub Pages のサブパス配信でも動くよう、相対パスにする
  base: './',
  // 画面に表示するバージョン（package.json の version）
  define: {
    __APP_VERSION__: JSON.stringify(version),
    // アプリの ID（package.json の name）。保存データのキー・バックアップの app 名・起動失敗の復旧の範囲に使う。
    // GitHub Pages では、すべてのアプリが同じサイトに載るので、アプリごとに別の名前にする。
    __APP_ID__: JSON.stringify(appId),
  },
  plugins: [
    {
      // public/boot.js（Vite を通らない）が読めるように、アプリの ID を index.html に埋め込む
      name: 'app-id-meta',
      transformIndexHtml: (html) => html.replace('__APP_ID__', appId),
    },
  ],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
