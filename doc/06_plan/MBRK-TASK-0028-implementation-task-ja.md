---
id: MBRK-TASK-0028
type: Implementation Task
title: クレジットの名前をひらがなにし、v1.0.1 を公開する
status: stable
version: 1.0
updated: 2026-10-29
sources:
  - MBRK-WS-0008
  - MBRK-GUI-0007（v1.1）
  - MBRK-TC-0019（v1.1）
  - MBRK-TC-0024（v1.3）
  - doc/specification.md (v1.5) §8.8
  - doc/requests/2026-10-29-credits-name.md
verified: null
---

# TASK-0028 クレジットの名前をひらがなにし、v1.0.1 を公開する

- WS：[MBRK-WS-0008](MBRK-WS-0008-workstream-ja.md)　順番：28（プロジェクト完了のあと、変更の依頼 2026-10-29 で足す）　大きさ：S
- ブランチ：`feat/0028-credits-name-hiragana`
- 依存：TASK-0027
- 対象のストーリー：US-0023（v1.1）
- 対象のテストケース：TC-0024-03、TC-0019-01・02、TC-0024-07（手動）、TC-0019-04（手動）

## やること

1. `index.html`：クレジットの `dd` の「YOSHIHARU TSUKUDA」3 か所を「つくだ よしはる」にする。
2. `e2e/credits.spec.ts`：TC-0024-03 の期待する名前を直す。
3. `package.json`・`package-lock.json`：`version` を 1.0.1 に上げる（オーナー決定）。
4. 公開のあと、実機（iPhone）で確かめる。
   - TC-0024-07：クレジットの名前がひらがなで、中央揃えで読みやすい。
   - TC-0019-04：1.0.0 を開いて遊んでいる間に 1.0.1 を公開し、プレイ中は読み込み直されず、タイトルで「新しい版があります」→「更新」で v1.0.1 になる。**PR のマージの前に、iPhone で 1.0.0 を開いて遊び始めてもらう。**

## 完了の条件

- [ ] 上の対象のテストケース（自動）が通る
- [ ] クレジット画面のスクリーンショット（375 × 667）で、名前が 1 行に収まっている
- [ ] TC-0024-07・TC-0019-04 の結果を AC-0028 に書く
- [ ] WS-0001 §1.3 の共通の完了の定義
