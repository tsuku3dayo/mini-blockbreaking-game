---
id: MBRK-AC-0024
type: Attested Computation
title: 操作空間の実施記録
status: draft
version: 1.0
updated: 2026-10-25
sources:
  - MBRK-TASK-0024
  - MBRK-TC-0007
  - MBRK-TC-0010
verified: null
---

# AC-0024 操作空間の実施記録

## 1. 実施概要

| 項目 | 内容 |
| --- | --- |
| タスク | [MBRK-TASK-0024](../06_plan/MBRK-TASK-0024-implementation-task-ja.md) 操作空間 |
| テストケース | TC-0007-09〜12（v1.1）、TC-0010-01・03（v1.1）。TC-0007-13・TC-0010-09 は WS-0009 の終わりの手動 |
| 実施者 | Claude Code（Opus 5.5） |
| 環境 | Windows 11 Pro、Node.js 24.0.0、Vitest 5、Playwright（Chrome for Testing 156） |
| ブランチ | `feat/0024-control-area` |

## 2. 確認結果（自動テスト・2026-10-25）

`tests/layout.test.ts`、`e2e/touch.spec.ts`、`e2e/layout.spec.ts`（pixel7・small の両プロジェクト。どちらもタッチ端末）。操作空間へのタッチは、操作空間の縦の真ん中に、論理 x にあたる横位置で `PointerEvent`（`pointerType: 'touch'`）を送った（`e2e/helpers.ts` の `controlPoint`）。

| 確認 ID | 種類 | 確かめたこと | 結果 |
| --- | --- | --- | --- |
| TC-0007-09 | E2E | 操作空間で x = 240 で押し → 100 → 300 → 離す → 押さずに 150 へ動かす：`paddleX` が 100・300、離したあとは 300 のまま | 成功 |
| TC-0007-10 | E2E | 操作空間で押して 20 動かして離すと `ready` のまま、押して 5 動かして離すと `playing`。ブラウザの本物のタッチ（`touchscreen.tap`）でも、操作空間のタップで発射し、パドルが x ≈ 144 に合う | 成功 |
| TC-0007-11 | E2E | タッチのプロジェクトで、操作空間が見え、高さ 96、Canvas と左右の端・幅がそろい、Canvas の下端から 8 下。`touch-action: none`・`user-select: none`。なぞっても `scrollY` が変わらず、`contextmenu` は止められる。マウスの端末（`hasTouch: false`）では操作空間が見えない | 成功 |
| TC-0007-12 | E2E | 操作空間で押してから右外まで動かす：`paddleX = 440` | 成功 |
| TC-0010-01 | 単体 | `computeDisplaySize`：操作空間あり（`controlsHeight` 160）で 375 × 667 → 343 × 457、375 × 548 → 288 × 384、412 × 839 → 380 × 506。操作空間なし（56）で 1280 × 800 → 448 × 597、375 × 548 → 339 × 452 | 成功 |
| TC-0010-03 | E2E | 各プロジェクトで START：横スクロールなし。Canvas・操作空間・一時停止ボタンの外形が表示領域の中 | 成功 |

そのほか：

- 既存の TC-0007-01〜07（ゲーム領域を触る操作）、TC-0010-04〜08 も、そのまま通った。
- 単体 92 件・E2E 175 件、`npm run verify` は成功。
- スクリーンショット：
  - 375 × 667（タッチ）：GUI-0003 §1.1 の形。ゲーム領域 343 × 457、その下に操作空間（案内の文字）、その下に操作欄。1 画面に収まる。
  - 375 × 548（タッチ、iPhone SE の Safari 相当）：ゲーム領域が最小の 288 × 384、全体は 584 で 36 px だけ縦にスクロールする（GUI-0003 §1.2 の注記のとおり）。
  - 1280 × 800（マウス）：操作空間は出ず、ゲーム領域 448 × 597 の下がすぐ操作欄（v1.1 までと同じ）。
  - 最初に撮った 375 × 548 の画像は、ページ全体を撮る撮り方（`fullPage`）にしたため、撮る間にブラウザのタッチの設定が外れ、パソコンの配置で撮れていた。画面内を 2 回撮る形にして撮り直し、そのときの状態（`pointer: coarse` が真、操作空間が見えている、Canvas の幅 288）も確かめた。
- 実装：
  - `index.html`：Canvas と操作欄の間に `#control-area`（`aria-hidden`、案内の文字）。タイトル画面の操作方法を「画面の下をなぞる」に。
  - `src/style.css`：操作空間の見た目（地 `--surface`、枠 `--border`、角丸 10、高さ 96、間 8、幅 `--stage-width`）とタッチの既定動作を止める CSS。
  - `src/input.ts`：`createInput` に操作空間を渡し、`pointerdown`・`lostpointercapture`・`contextmenu` を Canvas と同じに付ける。捕まえるのは押した要素。位置の変換は Canvas の外形のまま。
  - `src/play.ts`：`matchMedia('(pointer: coarse)')` で操作空間を出し分け、出すときは `controlsHeight` に 104 を足す。`change` で合わせ直す。
  - `src/config.ts`：`CONTROL_AREA_HEIGHT = 96`（仕様書 v1.2 §11）。

## 3. 確認できなかったこと

- 実機で操作空間を使った遊びやすさ（TC-0007-13）と、iPhone の Safari・ホーム画面のアプリでの収まり方（TC-0010-09）は、WS-0009 の終わりに確かめる。Android は端末がないため確かめない。
- タブレットにマウスをつないだときなど、`(pointer: coarse)` が途中で変わったときに出し直す処理は、E2E では確かめていない（エミュレーションで途中から切り替えられないため）。

## 4. 後片付け

- 撮影・状態の確認に使った一時的なテスト `e2e/zz-shot.spec.ts` は、コミットしていない（作業フォルダに残っている。削除してよい）。画像は `test-results/`（Git の対象外）。

## 5. 完了定義のチェックリスト

- [x] タスクの「やること」がすべてできている
- [x] TC-0007-09〜12、TC-0010-01・03 が、名前に確認 ID を付けて書かれ、通っている（既存の TC-0007・TC-0010 も通る）
- [x] 375 × 667 のスクリーンショットが GUI-0003 §1.1 の形になっている
- [x] `npm run verify` と `npm run test:e2e` が手元で通る
- [ ] PR の CI が緑
- [x] 設計と違う作りにしていない（設計書の修正なし）
- [ ] PR がマージされた
