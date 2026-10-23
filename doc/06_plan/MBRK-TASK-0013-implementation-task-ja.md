---
id: MBRK-TASK-0013
type: Implementation Task
title: キーボード操作とマウスの仕上げ
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0004
  - MBRK-TD-0003
  - MBRK-US-0008
verified: null
---

# TASK-0013 キーボード操作とマウスの仕上げ

- WS：[MBRK-WS-0004](MBRK-WS-0004-workstream-ja.md)　順番：13　大きさ：M
- ブランチ：`feat/0013-keyboard-mouse`
- 依存：TASK-0012
- 対象のストーリー：US-0008
- 対象のテストケース：TC-0008-01・02・04〜09、TC-0008-10（手動、段階の終わり）

## やること

1. `input.ts`：← → A D（`code` で判定）、`source` の切替え、Space の `repeat` を無視、`preventDefault`、`blur` で離した扱い（TD-0003 §3.2）。
2. マウス：ボタンなしの追従（`window` の `pointermove`）、カーソルを隠す（TD-0003 §3.5）。
3. フォーカスが入力欄・ボタンにあるときはキーをゲームに渡さない。
4. `e2e/keyboard-mouse.spec.ts`。

## 完了の条件

- [ ] TC-0008-01・02・04〜09 が通る
- [ ] WS-0001 §1.3 の共通の完了の定義
