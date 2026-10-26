---
id: MBRK-TC-0001
type: Test Case
title: タイトル画面からゲームを始める
status: stable
version: 1.1
updated: 2026-10-26
sources:
  - MBRK-US-0001（v1.1）
  - MBRK-GUI-0001（v1.3）
  - MBRK-GUI-0002（v1.3）
  - MBRK-TD-0001
verified: null
---

# TC-0001 タイトル画面からゲームを始める

- 対象：[MBRK-US-0001](../02_requirements/MBRK-US-0001-user-story-ja.md)
- テストファイル：`e2e/title.spec.ts`
- 前提：保存データは空。`/` を開く

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0001-01 | タイトル画面の要素 | E2E | `/` を開く | 見出し「ブロック崩しミニ」、START、RANKING、操作方法の 3 項目が見える |
| TC-0001-02 | START でゲームが始まる | E2E | START を押す | プレイ画面が見え、`body[data-game-state="ready"]` |
| TC-0001-03 | START の初期フォーカスと Enter | E2E | `/` を開き、何も押さずに Enter | `document.activeElement` が START。Enter でプレイ画面になる |
| TC-0001-04 | RANKING でランキング画面 | E2E | RANKING を押す | ランキング画面の見出しが見える |
| TC-0001-05 | ページタイトル | E2E | タイトル → プレイ → タイトル → ランキング | `document.title` が「ブロック崩しミニ - タイトル / プレイ / ランキング」と変わる |
| TC-0001-06 | 存在しない画面はタイトルへ | E2E | `/#/unknown` を開く。`/#/play` を開く。起動後にハッシュを `#/xyz` に変える | どれもタイトル画面になる |
| TC-0001-07 | 見出しが 1 行に収まる（v1.1 で追加） | E2E | 幅 375 × 高さ 667 で `/` を開く | 見出しの高さが 1 行分（文字の大きさの 2 倍未満）で、見出しの右端が画面の内側に収まる |
