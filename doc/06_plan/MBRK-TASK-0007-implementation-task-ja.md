---
id: MBRK-TASK-0007
type: Implementation Task
title: 表示サイズと高密度画面
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0003
  - MBRK-TD-0003
  - MBRK-GUI-0003
  - MBRK-GUI-0006
  - MBRK-US-0010
verified: null
---

# TASK-0007 表示サイズと高密度画面

- WS：[MBRK-WS-0003](MBRK-WS-0003-workstream-ja.md)　順番：7　大きさ：M
- ブランチ：`feat/0007-layout`
- 依存：TASK-0006
- 対象のストーリー：US-0010
- 対象のテストケース：TC-0010-01〜08（TC-0010-04 の結果パネルの部分は TASK-0010 で通す）、TC-0010-09（手動、段階の終わり）

## やること

1. `src/layout.ts`：`computeDisplaySize`（TD-0003 §5）。`tests/layout.test.ts`。
2. `play.ts`：画面の大きさから Canvas の CSS の大きさと実ピクセルを決める。`resize`・`orientationchange` で計算し直す。結果パネルの間は幅の変化だけで計算し直す仕組みを用意する。
3. 横向きの案内（`#orientation-notice`。GUI-0006 §5）。
4. 操作欄の場所（ボタンは TASK-0011・0018 で中身を入れる。この時点では一時停止ボタンの枠だけでよい）。
5. `e2e/layout.spec.ts`。

## 完了の条件

- [ ] TC-0010-01〜03・05〜08 が通る（TC-0010-05 は、この時点にあるボタンについて）
- [ ] 375 × 667・412 × 915 のスクリーンショットで、GUI-0003 の形になっている
- [ ] WS-0001 §1.3 の共通の完了の定義
