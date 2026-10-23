# ブロック崩し（mini-blockbreaking-game）

スマートフォンで遊べる、1 ステージのブロック崩しです。ブラウザだけで動く PWA で、サーバーは使いません。ホーム画面に追加すると、オフラインでも遊べます。

- 公開 URL：https://tsuku3dayo.github.io/mini-blockbreaking-game/
- 仕様：[doc/specification.md](doc/specification.md)

## 起動方法

Node.js 24 が必要です。

```sh
npm ci
npm run dev
```

表示された URL（例：http://localhost:5173/）をブラウザで開きます。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発用サーバーを起動する |
| `npm run build` | 型を検査して、`dist/` に本番用の成果物を作る |
| `npm run preview` | `dist/` を配信して確かめる |
| `npm run lint` | ESLint で検査する |
| `npm test` | 単体テスト（Vitest） |
| `npm run test:e2e` | 画面のテスト（Playwright。Pixel 7 と 375 × 667 の 2 つ） |
| `npm run verify` | lint → 単体テスト → build をまとめて行う |

初めて E2E を動かすときは、`npx playwright install chromium` でブラウザを入れてください。
