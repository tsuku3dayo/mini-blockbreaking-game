---
id: MBRK-TASK-0009
type: Implementation Task
title: タイトル画面と画面の切替え
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0003
  - MBRK-TD-0001
  - MBRK-GUI-0001
  - MBRK-GUI-0002
  - MBRK-US-0001
verified: null
---

# TASK-0009 タイトル画面と画面の切替え

- WS：[MBRK-WS-0003](MBRK-WS-0003-workstream-ja.md)　順番：9　大きさ：M
- ブランチ：`feat/0009-title-routing`
- 依存：TASK-0008
- 対象のストーリー：US-0001
- 対象のテストケース：TC-0001-01〜06

## やること

1. `main.ts`：`showScreen`、ハッシュでの画面の切替え（TD-0001 §3）、ページタイトル、初期フォーカス。開いたらタイトル画面から始める（TASK-0006 の仮の動きを直す）。
2. タイトル画面の中身（GUI-0002）：ロゴ、START（Enter のヒント）、RANKING、操作方法。効果音ボタンの場所は空けておく（TASK-0018）。
3. ランキング画面の骨組み：上部のバー（BACK・見出し）と「まだ記録がありません」だけ（中身は TASK-0016）。
4. 画面全体の Enter（タイトルで START）。フォーカスのある部品の Enter は部品だけ（仕様書 §4.1-9）。
5. `src/ui.ts`・`src/icons.ts`：要素の作成・アイコン（GUI-0001 §5.3）。
6. `e2e/title.spec.ts`。

## 完了の条件

- [ ] TC-0001-01〜06 が通る
- [ ] 既存の E2E（TASK-0006〜0008）を、タイトル画面から START する形に直して通す
- [ ] WS-0001 §1.3 の共通の完了の定義
