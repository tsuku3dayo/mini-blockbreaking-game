---
id: MBRK-TS-0001
type: Technology Stack
title: ブロック崩し 技術スタック
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-PB-0001
  - MBRK-SA-0001
  - simple_shogi package.json (v1.3.2)、doc/architecture.md、CLAUDE.md
verified: { by: "tsuku3dayo", at: "2026-10-23T16:38:45+09:00" }
---

# 技術スタック（technology-stack）

`simple_shogi`（v1.3.2）と同じ技術・版をそろえる（[ADR-0002](MBRK-ADR-0002-architecture-decision-ja.md)）。版は 2026-10-23 時点の `simple_shogi` の `package.json` に合わせ、実装の開始時に最新の版を確認する。

## 1. アプリ

| 分野 | 使うもの | 版 | 備考 |
| --- | --- | --- | --- |
| 言語 | TypeScript | ~6.0 | `strict`。UI フレームワークなし（DOM を直接操作） |
| ビルド | Vite | ^8.3 | `base: './'`（GitHub Pages のサブパス配信） |
| PWA | vite-plugin-pwa + workbox-window | ^2.0 / ^7.4 | `registerType: 'prompt'`（「更新」ボタンで切り替え） |
| 描画 | Canvas 2D（ブラウザ標準） | — | [ADR-0003](MBRK-ADR-0003-architecture-decision-ja.md) |
| 入力 | Pointer Events・KeyboardEvent（`code` で判定）（ブラウザ標準） | — | タッチ・マウス・ペンを Pointer Events でまとめて扱う |
| 効果音 | Web Audio API（ブラウザ標準） | — | 音声ファイルなし。[ADR-0005](MBRK-ADR-0005-architecture-decision-ja.md) |
| 保存 | localStorage（ブラウザ標準） | — | [ADR-0006](MBRK-ADR-0006-architecture-decision-ja.md) |
| ファイルの書き出し・読み込み | Blob + `<a download>`、`<input type="file">`（ブラウザ標準） | — | 仕様書 §9.6 |

外部のライブラリ（ゲームエンジン・物理エンジン・UI フレームワーク・Web フォント）は使わない。

## 2. 開発・テスト

| 分野 | 使うもの | 版 | 備考 |
| --- | --- | --- | --- |
| 実行環境 | Node.js（npm） | 24 | CI と同じメジャー。手元は v24.0.0 をインストール済み |
| 単体テスト | Vitest | ^5.0 | Node 環境。`tests/*.test.ts`。ロジック層を対象 |
| 画面テスト（E2E） | Playwright（Chromium） | ^1.64 | build 済みの成果物を `vite preview` で配信してテスト。端末は Pixel 7 と、iPhone SE 相当の画面サイズ（375 × 667、タッチあり）の 2 つ。[ADR-0008](MBRK-ADR-0008-architecture-decision-ja.md) |
| Lint | ESLint + typescript-eslint | ^10.12 / ^8.71 | `innerHTML` / `outerHTML` への代入を禁止。フォーマッタは入れない |
| PWA 成立チェック | `scripts/check-dist.mjs`（simple_shogi から流用） | — | manifest・アイコン・バージョン表示・インストール方法の入口・`boot.js` 等を確認 |
| アイコン生成 | `scripts/make-icons.mjs`（simple_shogi から流用） | — | 192 / 512 / maskable / apple-touch-icon を生成 |

## 3. 道具とプラットフォーム

| 用途 | 使うもの | 備考 |
| --- | --- | --- |
| ソースコードの管理 | Git + GitHub（`tsuku3dayo/mini-blockbreaking-game`） | 手元の Git は Sourcetree 同梱（2.51.0）。作業は feature ブランチ → PR → main |
| 公開 | GitHub Pages | https://tsuku3dayo.github.io/mini-blockbreaking-game/ |
| CI | GitHub Actions `test.yml` | main への push と全 PR で lint / 単体テスト / build / check:dist / E2E |
| 公開の自動化 | GitHub Actions `pages.yml` | main への push で同じ検査をし、通ったときだけ `dist/` を公開 |
| 依存の更新 | Dependabot | `vite`・`vitest`・`vite-plugin-pwa`・`workbox-window` は 1 つの PR にまとめる |
| 開発支援 | Claude Code | ルールは `CLAUDE.md` |

## 4. コマンド

`simple_shogi` と同じ。

| やりたいこと | コマンド |
| --- | --- |
| 開発サーバー | `npm run dev` |
| 型チェック + ビルド | `npm run build`（成果物は `dist/`） |
| Lint | `npm run lint` |
| 単体テスト | `npm test` |
| 画面テスト | `npm run test:e2e`（初回は `npx playwright install chromium`） |
| PWA 成立チェック | `npm run check:dist`（build のあと） |
| まとめて確認 | `npm run verify`（lint → test → build → check:dist） |
| アイコン再生成 | `npm run icons` |

## 5. simple_shogi との違い

| 項目 | simple_shogi | このアプリ | 理由 |
| --- | --- | --- | --- |
| 画面の描き方 | DOM（盤・駒を要素で組む） | ゲーム領域は Canvas 2D、それ以外は DOM | 毎フレーム動くゲームのため（ADR-0003） |
| 時間の扱い | ターン制 | 固定タイムステップのゲームループ | 仕様書 §5.1 |
| 音 | 効果音 + BGM | 効果音だけ | BGM は範囲外（MBRK-PB-0001 §4.2） |
| 保存の書き込み | 失敗しても何も返さない | 成否を返す | 登録の失敗を画面に出すため（ADR-0006） |
| バックアップの形 | アプリの保存キーをそのまま書き出す | 仕様書 §9.6 の形（記録の一覧） | 読み込み時に記録ごとに検証するため（ADR-0006） |
| E2E の端末 | Pixel 7 | Pixel 7 + 375 × 667 | 仕様書 §12.7 の画面サイズを確かめるため（ADR-0008） |
| 物語・CPU・チュートリアル | あり | なし | 将棋に固有の機能 |
