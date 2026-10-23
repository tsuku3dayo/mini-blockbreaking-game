---
id: MBRK-TASK-0016
type: Implementation Task
title: ランキング画面
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0005
  - MBRK-TD-0004
  - MBRK-GUI-0005
  - MBRK-US-0013
verified: null
---

# TASK-0016 ランキング画面

- WS：[MBRK-WS-0005](MBRK-WS-0005-workstream-ja.md)　順番：16　大きさ：M
- ブランチ：`feat/0016-ranking-view`
- 依存：TASK-0015
- 対象のストーリー：US-0013
- 対象のテストケース：TC-0013-02〜10（TC-0013-05・07 の単体を含む）

## やること

1. `src/ranking-view.ts`：表（2 段の行、順位・名前・「（あなた）」・結果・日時・スコア）、0 件・読み込み失敗の表示、再読み込み、Esc・BACK、見出しへの初期フォーカス（GUI-0005、TD-0004 §6）。バックアップの欄は場所だけ（TASK-0021）。
2. `src/format.ts` に `formatDateTime` を足す。
3. `e2e/ranking.spec.ts`。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る
- [ ] 12 文字の名前 10 件のランキングのスクリーンショット（375 幅）が GUI-0005 の形になっている
- [ ] WS-0001 §1.3 の共通の完了の定義
