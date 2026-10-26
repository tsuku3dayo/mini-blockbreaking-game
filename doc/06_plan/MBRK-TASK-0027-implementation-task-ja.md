---
id: MBRK-TASK-0027
type: Implementation Task
title: アプリの名前を「ブロック崩しミニ」にする
status: stable
version: 1.0
updated: 2026-10-26
sources:
  - MBRK-WS-0008
  - MBRK-TD-0001（v1.2）
  - MBRK-ADR-0007（v1.1）
  - MBRK-GUI-0001（v1.3）
  - MBRK-GUI-0002（v1.3）
  - MBRK-GUI-0003（v1.4）
  - MBRK-US-0001（v1.1）
  - MBRK-US-0017（v1.1）
  - MBRK-US-0021（v1.1）
  - MBRK-US-0023（v1.1）
verified: null
---

# TASK-0027 アプリの名前を「ブロック崩しミニ」にする

- WS：[MBRK-WS-0008](MBRK-WS-0008-workstream-ja.md)　順番：27（TASK-0023 の全体の手動確認のあと、オーナーの指示で足す）　大きさ：S
- ブランチ：`feat/0027-rename-app`
- 依存：TASK-0026
- 対象のストーリー：US-0001・0017・0021・0023（いずれも v1.1）
- 対象のテストケース：TC-0001-01・05・07、TC-0017-04、TC-0021-01、TC-0024-02、TC-0017-05（手動）

## やること

1. `vite.config.ts`：`APP_NAME` を「ブロック崩しミニ」にする（manifest の `name`・`short_name`）。
2. `index.html`：`<title>`、`apple-mobile-web-app-title`、見出し `h1`、ゲーム領域の `aria-label` を新しい名前にする。
3. `src/main.ts`・`src/play.ts`：ページタイトルの前半を「ブロック崩しミニ」にする。
4. `src/style.css`：ロゴを本文と同じ書体・32px・太字・字間 0.04em にする（GUI-0001 §4）。
5. テスト：E2E と `scripts/check-dist.mjs` の名前を直し、TC-0001-07（見出しが 1 行に収まる）を足す。
6. `README.md` の見出しを新しい名前にする。
7. 版は 1.0.0 のまま（オーナー決定）。公開し直したあと、ホーム画面の名前・見出し・ページタイトルを実機で確かめる。

## 完了の条件

- [ ] 上の対象のテストケース（自動）が通る
- [ ] タイトル画面のスクリーンショット（375 × 667）で、見出しが 1 行に収まっている
- [ ] WS-0001 §1.3 の共通の完了の定義
