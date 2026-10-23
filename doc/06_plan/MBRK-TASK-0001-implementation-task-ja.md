---
id: MBRK-TASK-0001
type: Implementation Task
title: プロジェクトの土台
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0001
  - MBRK-TD-0001
  - MBRK-GUI-0001
  - MBRK-ADR-0002
  - MBRK-ADR-0007
verified: null
---

# TASK-0001 プロジェクトの土台

- WS：[MBRK-WS-0001](MBRK-WS-0001-workstream-ja.md)　順番：1　大きさ：M
- ブランチ：`feat/0001-scaffold`
- 依存：なし
- 対象のストーリー：なし（土台）
- 対象のテストケース：なし（`npm run verify` が通ることで確かめる）

## やること

1. `simple_shogi` から次を写し、このアプリ用に直す（TD-0001 §5）。
   - `package.json`（`name` = `mini-blockbreaking-game`、`version` = `0.1.0`、`scripts`・`devDependencies` は同じ。`pwaTemplate` の印は付けない）、`package-lock.json` は `npm install` で作り直す
   - `tsconfig.json`、`eslint.config.js`、`vite.config.ts`（PWA の部分は TASK-0002）、`playwright.config.ts`（プロジェクト 2 つ。TD-0001 §6）、`src/vite-env.d.ts`
2. `index.html` の骨組み（TD-0001 §4）：3 つの `section`、Canvas、操作欄、通知領域、ダイアログの置き場所。中身は空でよい。
3. `src/style.css`：GUI-0001 §3 の色の変数、文字、余白（`--safe-top`）、ボタン・入力欄の基本、`[hidden]`、`.sr-only`、`prefers-reduced-motion`。
4. `src/main.ts`：起動して、タイトル画面の骨組みを出し、`window.__appStarted = true` にする。
5. `tests/smoke.test.ts`（`config` などが読み込めることだけ確かめる仮のテスト。以後のタスクで本物のテストに置き換えたら消す）、`e2e/smoke.spec.ts`（タイトル画面が開くこと）。
6. `README.md` の骨組み（アプリの説明・公開 URL・起動方法・コマンド）。
7. `CLAUDE.md` に、`simple_shogi` の共通ルールのうちこのアプリで守るもの（技術スタック・PWA 要件・デザイン・テスト・入力と表示・CI・Lint）を足す。

## 完了の条件

- [ ] `npm ci`・`npm run lint`・`npm test`・`npm run build` が通る
- [ ] `npm run dev` でタイトル画面の骨組み（暗い背景）が出る
- [ ] `npm run test:e2e` が 2 つのプロジェクトで通る
- [ ] WS-0001 §1.3 の共通の完了の定義（`check:dist` は TASK-0002 から）
