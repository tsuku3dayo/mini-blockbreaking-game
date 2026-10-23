---
id: MBRK-TASK-0006
type: Implementation Task
title: 描画・ゲームループ・ポインタの基本・テスト用の入口
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0002
  - MBRK-TD-0001
  - MBRK-TD-0003
  - MBRK-GUI-0003
  - MBRK-US-0002
  - MBRK-US-0005
verified: null
---

# TASK-0006 描画・ゲームループ・ポインタの基本・テスト用の入口

- WS：[MBRK-WS-0002](MBRK-WS-0002-workstream-ja.md)　順番：6　大きさ：L
- ブランチ：`feat/0006-render-loop`
- 依存：TASK-0005
- 対象のストーリー：US-0002、US-0005（画面につなぐ部分）
- 対象のテストケース：TC-0002-04・05、TC-0004-08、TC-0005-08・09、TC-0005-10（HUD の文字）

## やること

1. `src/render.ts`：`readPalette`、`render`（TD-0003 §4）。`tests/render.test.ts` に偽の Canvas を作る。
2. `src/play.ts`：`createPlayScreen` の `start`・`stop`、1 フレームの処理（TD-0003 §1・§2）。表示サイズは仮に固定（448 × 597）でよい（TASK-0007 で直す）。
3. `src/input.ts`：ポインタの基本だけ（Canvas での `pointerdown` / `pointermove` / `pointerup`、追従、10 px 以内のタップで発射。TD-0003 §3.3）。キャプチャ・2 本目の指・中断・キーボードは後のタスク。
4. `src/debug.ts`：`?debug=1` で `window.__breakout`（`snapshot`・`setup`）、`app:state` イベント、`body[data-game-state]`（TD-0001 §7）。
5. `src/main.ts`：この段階では、開いたらすぐプレイ画面にする（段階 2 の TASK-0009 でタイトルからに直す）。
6. E2E：`e2e/play.spec.ts`（TC-0005-09）。E2E 用の小物（`snapshot` を読む、論理座標を画面座標に直す、`app:*` を記録する）を `e2e/helpers.ts` にまとめる。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る
- [ ] パソコンの Chrome でマウスを使って 1 ゲーム遊べる（スクリーンショットで確かめる）
- [ ] WS-0001 §1.3 の共通の完了の定義
