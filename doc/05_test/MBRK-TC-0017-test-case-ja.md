---
id: MBRK-TC-0017
type: Test Case
title: ホーム画面に追加して開く
status: stable
version: 1.1
updated: 2026-10-26
sources:
  - MBRK-US-0017（v1.1）
  - MBRK-GUI-0006
  - MBRK-TD-0001
verified: null
---

# TC-0017 ホーム画面に追加して開く

- 対象：[MBRK-US-0017](../02_requirements/MBRK-US-0017-user-story-ja.md)
- テストファイル：`e2e/pwa.spec.ts`、`scripts/check-dist.mjs`

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0017-01 | 入口が出る / インストール済みでは出ない（§12.7-4） | E2E | 普通に開く。`addInitScript` で `matchMedia('(display-mode: standalone)')` を真にして開く | 前者は入口が見える。後者は見えない |
| TC-0017-02 | 3 つの手順と今の端末（§8.6） | E2E | 入口を押す（`pixel7` プロジェクト = Android） | ダイアログに 3 つの項目、Android の項目が開いている |
| TC-0017-03 | 今すぐインストール（§8.6） | E2E | `beforeinstallprompt` を送ってからダイアログを開く | 「今すぐインストール」が見える。送らなければ見えない |
| TC-0017-04 | manifest とアイコン | ビルド検査 | `npm run build && npm run check:dist` | 通る（manifest、192 / 512 / maskable、apple-touch-icon） |
| TC-0017-05 | 実機でインストール | 手動 | 公開 URL を iPhone（Safari：共有 → ホーム画面に追加）・Android（Chrome：アプリをインストール）で開いて追加 | ホーム画面に「ブロック崩しミニ」とアイコン（端末が名前を「…」で切る場合は、そのことを記録する）。開くとブラウザの枠がなく、縦向き。タイトルに入口が出ない |
