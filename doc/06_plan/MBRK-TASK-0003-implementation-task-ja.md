---
id: MBRK-TASK-0003
type: Implementation Task
title: CI と GitHub Pages への公開
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0001
  - MBRK-TD-0001
  - MBRK-TS-0001
verified: null
---

# TASK-0003 CI と GitHub Pages への公開

- WS：[MBRK-WS-0001](MBRK-WS-0001-workstream-ja.md)　順番：3　大きさ：S
- ブランチ：`feat/0003-ci-pages`
- 依存：TASK-0002
- 対象のストーリー：なし（土台）
- 対象のテストケース：なし（CI が緑になり、公開 URL が開くことで確かめる）

## やること

1. `.github/workflows/test.yml`・`pages.yml`・`.github/dependabot.yml` を `simple_shogi` から写す（TD-0001 §6）。
2. GitHub の Settings → Pages の Source を「GitHub Actions」にする（`gh api` で設定するか、オーナーに画面で設定してもらう）。
3. PR で CI（lint・単体・build・check:dist・E2E）が緑になることを確かめ、マージして公開する。
4. 公開 URL を開いて確かめる（WS-0001 §4）。

## 完了の条件

- [ ] PR の CI（`check` と `e2e` のジョブ）が緑
- [ ] `main` へのマージで `pages` のワークフローが成功し、https://tsuku3dayo.github.io/mini-blockbreaking-game/ が開く
- [ ] 公開 URL でタイトル画面の骨組みと `v0.1.0` が出る（iPhone・Android・パソコン）
- [ ] WS-0001 §1.3 の共通の完了の定義
