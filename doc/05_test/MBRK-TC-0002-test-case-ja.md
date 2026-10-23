---
id: MBRK-TC-0002
type: Test Case
title: ボールを発射する
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0002
  - MBRK-TD-0002
  - MBRK-TD-0003
verified: null
---

# TC-0002 ボールを発射する

- 対象：[MBRK-US-0002](../02_requirements/MBRK-US-0002-user-story-ja.md)
- テストファイル：`tests/game.test.ts`、`tests/render.test.ts`
- 前提：`createGame()` で作った状態

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0002-01 | 開始直後の状態（§12.1-1） | 単体 | `createGame()` | `paddleX = 240`、ボール (240, 593)、`alive` が全部 true の 40 個、`broken = 0`、`elapsedMs = 0`、`status = 'ready'` |
| TC-0002-02 | 発射前は追従し、時間が増えない（§12.1-2） | 単体 | `pointerX = 100` で `step` を 120 回 | ボール (100, 593)、速度 0、`elapsedMs = 0`、`status = 'ready'` |
| TC-0002-03 | 発射直後の速度（§12.1-3） | 単体 | `launch = true` で `step` 1 回 | `status = 'playing'`、速度 ≈ (102.61, −281.91)（小数 2 桁）、出来事に `launch`、`elapsedMs = 0` |
| TC-0002-04 | 盤面の描画位置と色（§2、§3） | 単体 | 偽の Canvas に `render(createGame())` | 外枠、ブロック 40 個（1 列目 x = 18、1 行目 y = 88、幅 52 × 20、間隔 4、行ごとの色）、パドル (200, 600, 80, 12)、ボール (240, 593, 半径 6)、描く順が §2.2 のとおり |
| TC-0002-05 | 発射のヒント（§2.2） | 単体 | 偽の Canvas に発射前の状態を描く | 「タップ / Space で発射」を (240, 400) 付近に描く。プレイ中の状態では描かない |
