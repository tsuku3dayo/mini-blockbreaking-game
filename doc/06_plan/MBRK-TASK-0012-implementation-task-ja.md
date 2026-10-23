---
id: MBRK-TASK-0012
type: Implementation Task
title: 結果パネルの入力ガードと Enter の扱い
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0004
  - MBRK-TD-0004
  - MBRK-GUI-0004
  - MBRK-US-0011
verified: null
---

# TASK-0012 結果パネルの入力ガードと Enter の扱い

- WS：[MBRK-WS-0004](MBRK-WS-0004-workstream-ja.md)　順番：12　大きさ：S
- ブランチ：`feat/0012-result-guard`
- 依存：TASK-0011
- 対象のストーリー：US-0011
- 対象のテストケース：TC-0011-01〜04（登録が絡む確認は、REGISTER を出す TASK-0015 で登録の部分を足す）

## やること

1. `result-panel.ts`：表示から 500 ms の入力ガード（TD-0004 §5）。
2. フォーカスのある部品の Enter は部品だけ、フォーカスがないときの Enter は RETRY。
3. 終了したらゲーム用の入力の受付をやめる（TD-0003 §3.6）ことを確かめる。
4. `e2e/result.spec.ts` に足す。

## 完了の条件

- [ ] TC-0011-01〜04 が通る（この時点で確かめられる部分）
- [ ] WS-0001 §1.3 の共通の完了の定義
