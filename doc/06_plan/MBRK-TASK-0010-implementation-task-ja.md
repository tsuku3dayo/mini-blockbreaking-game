---
id: MBRK-TASK-0010
type: Implementation Task
title: 結果パネル（表示とボタン）
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0003
  - MBRK-TD-0003
  - MBRK-TD-0004
  - MBRK-GUI-0004
  - MBRK-US-0006
verified: null
---

# TASK-0010 結果パネル（表示とボタン）

- WS：[MBRK-WS-0003](MBRK-WS-0003-workstream-ja.md)　順番：10　大きさ：M
- ブランチ：`feat/0010-result-panel`
- 依存：TASK-0009
- 対象のストーリー：US-0006
- 対象のテストケース：TC-0006-02・05〜08、TC-0010-04

## やること

1. `src/result-panel.ts`：`showResultPanel`・`hideResultPanel`（TD-0004 §5 のうち、表示・ボタン・初期フォーカス・Enter で RETRY）。名前の入力欄と REGISTER は場所だけ用意して隠しておく（TASK-0015）。
2. `play.ts`：終了したら `summarize` → 暗くして描く → 結果パネル。RETRY で `start()`、TITLE・RANKING で画面の切替え。
3. 結果パネルの見た目（GUI-0004 §1・§2）と、登場の動き（GUI-0001 §7）。
4. `e2e/result.spec.ts`。

## 完了の条件

- [ ] TC-0006-02・05〜08、TC-0010-04 が通る
- [ ] クリア・ゲームオーバーの結果パネルのスクリーンショットが GUI-0004 の形になっている
- [ ] WS-0001 §1.3 の共通の完了の定義
