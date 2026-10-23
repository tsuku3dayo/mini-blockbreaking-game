---
id: MBRK-TC-0020
type: Test Case
title: 起動できなくなっても自動で直る
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0020
  - MBRK-GUI-0006
  - simple_shogi public/boot.js
verified: null
---

# TC-0020 起動できなくなっても自動で直る

- 対象：[MBRK-US-0020](../02_requirements/MBRK-US-0020-user-story-ja.md)
- テストファイル：`e2e/boot.spec.ts`、`scripts/check-dist.mjs`
- E2E の前提：`addInitScript` で `window.__bootWaitMs` を短くする。メインのスクリプト（`assets/*.js`）を `page.route` で読めなくして、起動の失敗を作る

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0020-01 | 1 回目は自動で読み込み直す | E2E | メインのスクリプトを読めなくして開く | 自動で読み込み直す（`sessionStorage` に復旧の時刻が入る）。「なおす」は出ない |
| TC-0020-02 | 2 分以内の 2 回目は「なおす」 | E2E | 続けて、もう一度起動に失敗させる | 「うまく起動できませんでした。」と「なおす」が見える。押すと読み込み直す |
| TC-0020-03 | 記録が消えない | E2E | 記録・前回の名前・効果音の設定を入れた状態で復旧させる | 3 つとも残っている |
| TC-0020-04 | ほかのアプリのキャッシュを消さない | E2E | `caches.open('other-app-precache')` を作ってから復旧させる | `other-app-precache` が残っている |
| TC-0020-05 | 起動の見張りの有無 | ビルド検査 | `npm run check:dist` | 通る（`boot.js`、`app-id`、`__appStarted`） |
