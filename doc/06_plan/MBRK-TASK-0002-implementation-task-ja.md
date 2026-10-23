---
id: MBRK-TASK-0002
type: Implementation Task
title: PWA の骨組み
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0001
  - MBRK-TD-0001
  - MBRK-GUI-0002
  - MBRK-GUI-0006
  - MBRK-ADR-0007
verified: null
---

# TASK-0002 PWA の骨組み

- WS：[MBRK-WS-0001](MBRK-WS-0001-workstream-ja.md)　順番：2　大きさ：M
- ブランチ：`feat/0002-pwa-base`
- 依存：TASK-0001
- 対象のストーリー：US-0017・0018・0019・0020 の土台（仕上げと確認は TASK-0019・0020）
- 対象のテストケース：TC-0017-04、TC-0019-01・02、TC-0020-05（ビルド検査とバージョン表示）

## やること

1. `vite.config.ts` に PWA の設定（TD-0001 §5：アプリ名・色・`orientation: portrait`・`registerType: 'prompt'`）。
2. `scripts/make-icons.mjs` を流用し、図柄をブロック崩しにして `public/icons/` を作る（192・512・maskable・apple-touch-icon・svg）。
3. `public/boot.js`・`src/pwa.ts`・`src/install.ts` を流用。`index.html` に `#install-open`・`#install-dialog`・`#update-banner`・`#boot-error` を置く（GUI-0006 の文言）。
4. タイトル画面にバージョン（`#version`）とインストール方法の入口を置く（GUI-0002）。
5. `scripts/check-dist.mjs` を流用し、アプリ ID の確認を `mini-blockbreaking-game` にする。`package.json` の `verify` で `check:dist` まで通す。
6. E2E：TC-0019-01（バージョン表示）。

## 完了の条件

- [ ] `npm run verify`（lint → test → build → check:dist）が通る
- [ ] TC-0017-04、TC-0019-01・02、TC-0020-05 が通る
- [ ] `npm run preview` でインストール方法のダイアログが開く
- [ ] WS-0001 §1.3 の共通の完了の定義
