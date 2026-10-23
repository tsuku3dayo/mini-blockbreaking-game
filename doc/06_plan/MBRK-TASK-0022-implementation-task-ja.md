---
id: MBRK-TASK-0022
type: Implementation Task
title: 読み上げ・キーボード操作の仕上げ
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0008
  - MBRK-TD-0003
  - MBRK-GUI-0001
  - MBRK-US-0021
verified: null
---

# TASK-0022 読み上げ・キーボード操作の仕上げ

- WS：[MBRK-WS-0008](MBRK-WS-0008-workstream-ja.md)　順番：22　大きさ：M
- ブランチ：`feat/0022-a11y`
- 依存：TASK-0021
- 対象のストーリー：US-0021
- 対象のテストケース：TC-0021-01〜08、TC-0021-09（手動、TASK-0023）

## やること

1. `src/announce.ts`：通知領域（TD-0003 §6）。スコア・一時停止・再開・終了の読み上げを `play.ts` からつなぐ。
2. 全画面で、Tab の順・フォーカスの輪・`aria-*` を見直す（GUI-0001 §5・§6）。
3. `prefers-reduced-motion` で動きを止める（GUI-0001 §7）。
4. TC-0021-06 の対応表を作り、AC に載せる。
5. `e2e/a11y.spec.ts`。

## 完了の条件

- [ ] TC-0021-01〜08 が通る
- [ ] WS-0001 §1.3 の共通の完了の定義
