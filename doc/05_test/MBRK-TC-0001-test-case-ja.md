---
id: MBRK-TC-0001
type: Test Case
title: タイトル画面からゲームを始める
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0001
  - MBRK-GUI-0002
  - MBRK-TD-0001
verified: null
---

# TC-0001 タイトル画面からゲームを始める

- 対象：[MBRK-US-0001](../02_requirements/MBRK-US-0001-user-story-ja.md)
- テストファイル：`e2e/title.spec.ts`
- 前提：保存データは空。`/` を開く

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0001-01 | タイトル画面の要素 | E2E | `/` を開く | 見出し「BREAKOUT」、START、RANKING、操作方法の 3 項目が見える |
| TC-0001-02 | START でゲームが始まる | E2E | START を押す | プレイ画面が見え、`body[data-game-state="ready"]` |
| TC-0001-03 | START の初期フォーカスと Enter | E2E | `/` を開き、何も押さずに Enter | `document.activeElement` が START。Enter でプレイ画面になる |
| TC-0001-04 | RANKING でランキング画面 | E2E | RANKING を押す | ランキング画面の見出しが見える |
| TC-0001-05 | ページタイトル | E2E | タイトル → プレイ → タイトル → ランキング | `document.title` が「ブロック崩し - タイトル / プレイ / ランキング」と変わる |
| TC-0001-06 | 存在しない画面はタイトルへ | E2E | `/#/unknown` を開く。`/#/play` を開く。起動後にハッシュを `#/xyz` に変える | どれもタイトル画面になる |
