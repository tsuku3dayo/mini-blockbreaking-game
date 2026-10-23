---
id: MBRK-TASK-0004
type: Implementation Task
title: パラメータと衝突判定
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0002
  - MBRK-TD-0002
  - MBRK-US-0003
  - MBRK-US-0004
verified: null
---

# TASK-0004 パラメータと衝突判定

- WS：[MBRK-WS-0002](MBRK-WS-0002-workstream-ja.md)　順番：4　大きさ：M
- ブランチ：`feat/0004-collision`
- 依存：TASK-0003
- 対象のストーリー：US-0003、US-0004
- 対象のテストケース：TC-0003-01〜07・09（`enforceMinVy` の部分）、TC-0004-01〜04（衝突の部分）

## やること

1. `src/config.ts`：仕様書 §11 のパラメータと派生の値（TD-0002 §1）。
2. `src/collision.ts`：`blockRect`、`circleRect`、`collideWalls`、`collidePaddle`、`collideBlocks`、`enforceMinVy`（TD-0002 §5）。この時点で必要な型（`Ball`、`GameEvent` のうち衝突が返すもの）は `src/game.ts` に置いて `collision.ts` から import する。
3. `tests/collision.test.ts`：上の確認 ID のテスト。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る
- [ ] `collision.ts` が DOM・時刻・乱数を使っていない（ESLint の `globals` で `src/collision.ts` を確かめる、または読み合わせ）
- [ ] WS-0001 §1.3 の共通の完了の定義
