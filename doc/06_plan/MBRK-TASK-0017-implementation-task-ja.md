---
id: MBRK-TASK-0017
type: Implementation Task
title: 効果音の合成と鳴らし方
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0006
  - MBRK-TD-0005
  - MBRK-ADR-0005
  - MBRK-US-0015
verified: null
---

# TASK-0017 効果音の合成と鳴らし方

- WS：[MBRK-WS-0006](MBRK-WS-0006-workstream-ja.md)　順番：17　大きさ：M
- ブランチ：`feat/0017-sound`
- 依存：TASK-0016
- 対象のストーリー：US-0015
- 対象のテストケース：TC-0015-01〜08、TC-0015-09〜12（手動、段階の終わり）

## やること

1. `src/sound-plan.ts`：`planSounds`（TD-0005 §1）。`tests/sound-plan.test.ts`。
2. `src/sound.ts`：`unlock`・`play`・`playFrame`・`stopAll`、8 種類の音（TD-0005 §2・§3）。`app:sound` イベント。例外を外に出さない。
3. `play.ts`：1 フレームの出来事から `playFrame`、一時停止・画面の非表示・画面を離れるときに `stopAll`。`result-panel.ts`：登録成功で `register`。
4. `e2e/sound.spec.ts`（`app:sound` の記録、`AudioContext` を消した環境）。

## 完了の条件

- [ ] TC-0015-01〜08 が通る
- [ ] WS-0001 §1.3 の共通の完了の定義
