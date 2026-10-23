---
id: MBRK-TASK-0020
type: Implementation Task
title: 更新の帯と起動失敗の復旧の仕上げ
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0007
  - MBRK-TD-0001
  - MBRK-GUI-0006
  - MBRK-US-0019
  - MBRK-US-0020
verified: null
---

# TASK-0020 更新の帯と起動失敗の復旧の仕上げ

- WS：[MBRK-WS-0007](MBRK-WS-0007-workstream-ja.md)　順番：20　大きさ：M
- ブランチ：`feat/0020-update-repair`
- 依存：TASK-0019
- 対象のストーリー：US-0019、US-0020
- 対象のテストケース：TC-0019-03、TC-0020-01〜04（TC-0019-04 は最初のアップデート時）

## やること

1. 更新の帯をタイトル・ランキング画面だけに出す（GUI-0006 §3、TD-0001 §3.2 の 6）。`?debug` から帯を出す入口を足す。
2. `boot.js` の復旧画面の文言と色（GUI-0006 §4）。
3. `e2e/pwa.spec.ts`（TC-0019-03）、`e2e/boot.spec.ts`（TC-0020-01〜04）。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る
- [ ] WS-0001 §1.3 の共通の完了の定義
