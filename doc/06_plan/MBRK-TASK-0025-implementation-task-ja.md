---
id: MBRK-TASK-0025
type: Implementation Task
title: 記録の全消去
status: stable
version: 1.0
updated: 2026-10-25
sources:
  - MBRK-WS-0009
  - MBRK-TD-0004（v1.1）
  - MBRK-GUI-0001（v1.1）
  - MBRK-GUI-0002（v1.1）
  - MBRK-GUI-0006（v1.1）
  - MBRK-US-0022
verified: null
---

# TASK-0025 記録の全消去

- WS：[MBRK-WS-0009](MBRK-WS-0009-workstream-ja.md)　順番：25　大きさ：S
- ブランチ：`feat/0025-clear-ranking`
- 依存：TASK-0024
- 対象のストーリー：US-0022
- 対象のテストケース：TC-0023-01〜08、TC-0023-09（手動、段階の終わり）

## やること

1. `src/records.ts`：`clearRanking()`（TD-0004 §3）。
2. `index.html`：タイトル画面に「記録を全部消す」（`#title-clear`）と結果のメッセージ（`#title-clear-message`、`role="status"`）、確認ダイアログ（`#clear-dialog`、GUI-0006 §2.1）。
3. `src/style.css`：危険のボタン（GUI-0001 §5.1）、ボタンの文字の色、メッセージの色。
4. `src/main.ts`：ボタン・ダイアログ・メッセージの処理（TD-0004 §6.1）。
5. テスト：`tests/records.test.ts`（TC-0023-01〜03）、`e2e/clear.spec.ts`（TC-0023-04〜08）。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る
- [ ] タイトル画面とダイアログのスクリーンショット（375 × 667）が GUI-0002・GUI-0006 の形になっている
- [ ] WS-0001 §1.3 の共通の完了の定義
