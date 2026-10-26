---
id: MBRK-TASK-0024
type: Implementation Task
title: 操作空間
status: stable
version: 1.1
updated: 2026-10-26
sources:
  - MBRK-WS-0009
  - MBRK-TD-0003（v1.2）
  - MBRK-GUI-0003（v1.4）
  - MBRK-US-0007（v1.1）
  - MBRK-US-0010（v1.1）
verified: null
---

# TASK-0024 操作空間

- WS：[MBRK-WS-0009](MBRK-WS-0009-workstream-ja.md)　順番：24　大きさ：M
- ブランチ：`feat/0024-control-area`
- 依存：TASK-0018
- 対象のストーリー：US-0007 v1.1、US-0010 v1.1
- 根拠の版の見直し（v1.1、2026-10-26）：GUI-0003 v1.3・TD-0003 v1.2（結果パネルの間は操作空間を出さない）は、このタスクの直し（`fix/0024-hide-control-area-on-result`、PR #46、TC-0007-14）で対応した。GUI-0003 v1.4（代替テキストの名前）は TASK-0027 で対応した
- 対象のテストケース：TC-0007-09〜12、TC-0010-01・03（v1.1）、TC-0007-13・TC-0010-09（手動、段階の終わり）

## やること

1. `index.html`：Canvas と操作欄の間に `#control-area`（案内の文字「ここをなぞって移動・タップで発射」、`aria-hidden`）。
2. `src/style.css`：操作空間の見た目（GUI-0003 §2.3）と、タッチの既定動作を止める CSS。幅は `--stage-width`。
3. `src/input.ts`：操作空間でも `pointerdown`・`lostpointercapture`・`contextmenu` を受ける（TD-0003 §3.7）。
4. `src/play.ts`：`(pointer: coarse)` のときだけ操作空間を出し、`controlsHeight` に 104 を足す。`change` で合わせ直す。
5. `index.html`：タイトル画面の操作方法を「画面の下をなぞる」に（GUI-0002 v1.1）。
6. テスト：`tests/layout.test.ts`（TC-0010-01 の値）、`e2e/touch.spec.ts`（TC-0007-09〜12）、`e2e/layout.spec.ts`（TC-0010-03）。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る（既存の TC-0007・TC-0010 も通る）
- [ ] 375 × 667 のスクリーンショットが GUI-0003 §1.1 の形になっている
- [ ] WS-0001 §1.3 の共通の完了の定義
