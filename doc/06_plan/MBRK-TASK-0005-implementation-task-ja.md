---
id: MBRK-TASK-0005
type: Implementation Task
title: ゲームの状態・1 ステップ・スコア・ループの時間計算
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0002
  - MBRK-TD-0002
  - MBRK-US-0002
  - MBRK-US-0004
  - MBRK-US-0005
  - MBRK-US-0006
verified: null
---

# TASK-0005 ゲームの状態・1 ステップ・スコア・ループの時間計算

- WS：[MBRK-WS-0002](MBRK-WS-0002-workstream-ja.md)　順番：5　大きさ：L
- ブランチ：`feat/0005-game-step`
- 依存：TASK-0004
- 対象のストーリー：US-0002、US-0003、US-0004、US-0005（US-0006 のスコア計算）
- 対象のテストケース：TC-0002-01〜03、TC-0003-08・09（全体の不変条件）、TC-0004-05・06、TC-0005-01〜07・10、TC-0006-01・03・04（単体）、TC-0008-03、TC-0009-06

## やること

1. `src/game.ts`：型（TD-0002 §2）、`createGame`、`step`、`pause`、`resume`、`currentSpeed`、`blockScore`（TD-0002 §3・§4）。
2. `src/score.ts`：`timeBonus`、`summarize`（TD-0002 §6）。
3. `src/loop.ts`：`createAccumulator`、`resetAccumulator`、`advance`（TD-0002 §7）。
4. `src/format.ts`：`formatNumber`、`formatSeconds`（残りは TASK-0016）。
5. テスト：`tests/game.test.ts`、`tests/score.test.ts`、`tests/loop.test.ts`、`tests/format.test.ts`。TASK-0001 の仮のテストを消す。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る（TC-0004-07 の 3 桁区切りも含む）
- [ ] 決定性のテスト（TC-0005-04）と、フレームの間隔によらないテスト（TC-0005-05）が通る
- [ ] WS-0001 §1.3 の共通の完了の定義
