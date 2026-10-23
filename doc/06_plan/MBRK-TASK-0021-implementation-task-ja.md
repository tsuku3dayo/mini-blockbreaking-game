---
id: MBRK-TASK-0021
type: Implementation Task
title: 記録の書き出し・読み込み
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0008
  - MBRK-TD-0004
  - MBRK-GUI-0005
  - MBRK-GUI-0006
  - MBRK-US-0014
verified: null
---

# TASK-0021 記録の書き出し・読み込み

- WS：[MBRK-WS-0008](MBRK-WS-0008-workstream-ja.md)　順番：21　大きさ：M
- ブランチ：`feat/0021-backup`
- 依存：TASK-0020
- 対象のストーリー：US-0014
- 対象のテストケース：TC-0014-01〜09、TC-0014-10（手動、TASK-0023）

## やること

1. `src/backup.ts`：`createBackup`・`parseBackup`・`backupFileName`（TD-0004 §4）。`tests/backup.test.ts`。
2. `ranking-view.ts`：バックアップの欄、書き出し（`Blob` + `<a download>`）、読み込み（ファイル選択 → 検証 → 確認ダイアログ → 保存 → 表を作り直す）、結果のメッセージ。
3. `index.html` の `#import-dialog`（GUI-0006 §2）。
4. `e2e/backup.spec.ts` と `e2e/fixtures/` の 5 つのファイル。

## 完了の条件

- [ ] TC-0014-01〜09 が通る
- [ ] WS-0001 §1.3 の共通の完了の定義
