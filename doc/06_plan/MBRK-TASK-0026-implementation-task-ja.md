---
id: MBRK-TASK-0026
type: Implementation Task
title: クレジット画面
status: stable
version: 1.1
updated: 2026-10-26
sources:
  - MBRK-WS-0008
  - MBRK-TD-0001（v1.2）
  - MBRK-GUI-0001（v1.3）
  - MBRK-GUI-0002（v1.3）
  - MBRK-GUI-0007
  - MBRK-US-0023
verified: null
---

# TASK-0026 クレジット画面

- WS：[MBRK-WS-0008](MBRK-WS-0008-workstream-ja.md)　順番：26（TASK-0023 の v1.0.0 の公開のあと、全体の手動確認の前に行う）　大きさ：S
- ブランチ：`feat/0026-credits`
- 依存：TASK-0023
- 対象のストーリー：US-0023
- 対象のテストケース：TC-0024-01〜06、TC-0024-07（手動、TASK-0023 の全体の手動確認に含める）
- 根拠の版の見直し（v1.1、2026-10-26）：TD-0001 v1.2・GUI-0001 v1.3・GUI-0002 v1.3（アプリの名前の変更）は TASK-0027 で対応した。クレジット画面の作りは変わらない

## やること

1. `index.html`：タイトル画面の RANKING の下に「クレジット」（`#title-credits`）。クレジット画面の `section#screen-credits`（上部のバー、見出し、`dl` の 6 組。GUI-0007）。
2. `src/main.ts`：画面 `credits`（`#/credits`、ページタイトル、初期フォーカス、Esc・BACK でタイトル）（TD-0001 §3）。
3. `src/style.css`：クレジットの一覧（中央揃え、役職と名前の文字の大きさ・色、間）。
4. `e2e/credits.spec.ts`（TC-0024-01〜06）。既存の Tab の順のテスト（TC-0021-07）にクレジットを足す。
5. 版は 1.0.0 のまま（オーナー決定）。公開し直したあと、TASK-0023 の全体の手動確認を行う。

## 完了の条件

- [ ] TC-0024-01〜06 が通る
- [ ] クレジット画面のスクリーンショット（375 × 667）が GUI-0007 の形になっている
- [ ] WS-0001 §1.3 の共通の完了の定義
