---
id: MBRK-ADR-0008
type: Architecture Decision
title: E2E は Chromium で 2 つの画面サイズを試し、iPhone は実機で確かめる
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - doc/specification.md (v1.1) §10、§12.7
  - simple_shogi playwright.config.ts
verified: { by: "tsuku3dayo", at: "2026-10-23T16:38:45+09:00" }
---

# ADR-0008 E2E は Chromium で 2 つの画面サイズを試し、iPhone は実機で確かめる

## 状況

仕様書 §12.7 は、375 × 667（iPhone SE 相当）と 412 × 915（Pixel 7 相当）の縦画面での表示を求めている。対応ブラウザには iPhone の Safari が含まれる（§10）。`simple_shogi` の E2E は Chromium・Pixel 7 の 1 種類だけで動かしている。Playwright の WebKit は、Windows の手元と CI で動くが、本物の iPhone の Safari と同じではない（PWA のインストール・音・タッチの細かな動きは違う）。

## 決定

- E2E は Chromium で、次の 2 つの設定（Playwright のプロジェクト）で動かす。
  - Pixel 7（`devices['Pixel 7']`）
  - 375 × 667・タッチあり・モバイル（iPhone SE 相当の画面サイズ）
- iPhone の Safari での動き（インストール・オフライン・効果音・タッチ操作・60 fps）は、手動テストで実機を使って確かめ、attested-computation に結果を残す。

## 検討した選択肢

| 選択肢 | 良い点 | 悪い点 |
| --- | --- | --- |
| **A. Chromium × 2 画面 + iPhone は実機（採用）** | CI が軽く、`simple_shogi` に近い。画面サイズの受け入れ基準を自動で確かめられる | Safari 固有の不具合は手動テストまで分からない |
| B. Chromium + WebKit の両方 | Safari に近い描画を自動で確かめられる | CI が倍近く重くなる。本物の iPhone とは違うので、実機の確認は結局必要 |
| C. Pixel 7 だけ（simple_shogi と同じ） | いちばん軽い | 小さい画面の受け入れ基準を自動で確かめられない |

## 結果

- 良い点：自動テストで画面サイズの基準まで確かめられる。
- 注意点：手動テストの手順書に、iPhone 実機での確認項目を必ず入れる。Safari 固有の不具合が多く見つかったら、WebKit の追加を新しい ADR で検討する。
