---
id: MBRK-TASK-0015
type: Implementation Task
title: 結果パネルでのスコア登録
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0005
  - MBRK-TD-0004
  - MBRK-GUI-0004
  - MBRK-US-0012
  - MBRK-US-0011
verified: null
---

# TASK-0015 結果パネルでのスコア登録

- WS：[MBRK-WS-0005](MBRK-WS-0005-workstream-ja.md)　順番：15　大きさ：M
- ブランチ：`feat/0015-register`
- 依存：TASK-0014
- 対象のストーリー：US-0012（US-0011 の登録が絡む部分）
- 対象のテストケース：TC-0012-02・05・08・10〜12・14・15・17・18、TC-0011-01・03（登録の部分）、TC-0012-16（手動、段階の終わり）

## やること

1. `result-panel.ts`：名前の入力欄・REGISTER・補助の文字・文字数・エラー・結果のメッセージ（GUI-0004 §2・§3）、登録の処理、二重登録の防止、成功で RETRY にフォーカス（TD-0004 §5）。
2. 初期フォーカス（パソコンは入力欄、スマホは見出し）と、入力欄の初期値（前回の名前）。
3. `e2e/register.spec.ts`。保存を失敗させる小物と、記録を入れる小物を `e2e/helpers.ts` に足す。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る（TC-0011-01・03 の登録の部分を含む）
- [ ] WS-0001 §1.3 の共通の完了の定義
