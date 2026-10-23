---
id: MBRK-AC-0008
type: Attested Computation
title: 指の操作の仕上げの実施記録
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-TASK-0008
  - MBRK-TC-0007
verified: { by: "tsuku3dayo", at: "2026-10-23T21:03:34+09:00" }
---

# AC-0008 指の操作の仕上げの実施記録

## 1. 実施概要

| 項目 | 内容 |
| --- | --- |
| タスク | [MBRK-TASK-0008](../06_plan/MBRK-TASK-0008-implementation-task-ja.md) 指の操作の仕上げ |
| テストケース | TC-0007-01〜07（TC-0007-08 は WS-0003 の終わりの手動） |
| 実施者 | Claude Code（Opus 5.5） |
| 環境 | Windows 11 Pro、Node.js 24.0.0、Playwright（Chrome for Testing 156） |
| ブランチ | `feat/0008-touch` |

## 2. 確認結果（自動テスト・2026-10-23）

`e2e/touch.spec.ts`。タッチは `pointerType: 'touch'` の `PointerEvent` を、ページ上のその位置にある要素に送った（`e2e/helpers.ts` の `touch`・`touchAt`）。

| 確認 ID | 確かめたこと | 結果 |
| --- | --- | --- |
| TC-0007-01 | 240 で押し → 100 → 300 と動かすとパドルが 100・300。離したあと同じ id で動いても 300 のまま | 成功（pixel7・small） |
| TC-0007-02 | 240 で押して 260 に動かして離すと、発射前のまま | 成功 |
| TC-0007-03 | 続けて 260 で押し、5 px 動かして離すと発射。ブラウザの本物のタッチ（`page.touchscreen.tap`）でも発射し、パドルがタップした位置に合う | 成功 |
| TC-0007-04 | Canvas の `touch-action: none`・`user-select: none`。なぞる前後で `scrollY` が変わらない。`contextmenu` が抑止される | 成功 |
| TC-0007-05 | Canvas 内で押して右の外まで動かすとパドル 440。操作欄（一時停止ボタン）で押して Canvas 上へ動かしても変わらない | 成功 |
| TC-0007-06 | 1 本目を 100 で押したまま、2 本目を 400 で押して動かしても 100 のまま | 成功 |
| TC-0007-07 | 動かしている途中の `pointercancel` のあと、動かしても変わらず、離しても発射しない | 成功 |

そのほか：単体 57 件・E2E 30 件、`npm run verify` は成功。

実装（`src/input.ts`）：押したら `setPointerCapture`、最初の指（`isPrimary` で、追従中でない）だけを使う、押すのは Canvas だけで受ける（外で押したら追従しない）、`pointercancel`・`lostpointercapture`・`window` の `blur` で追従をやめる。リスナーは `AbortController` でまとめて外す。Canvas の CSS と `contextmenu` の抑止は TASK-0006 で入れたものを確かめた。

PR #26 の CI（`check`・`e2e`）は緑。2026-10-23 にマージ。

### 2.1 段階の終わりの確認（WS-0003、手動、2026-10-23）

| 確認 ID | 端末 | 結果 |
| --- | --- | --- |
| TC-0007-08 | iPhone（Safari） | OK（案内した確認項目「指でパドルが動く・位置を合わせてからタップで発射できる・なぞってもページが動かず拡大しない・長押ししてもメニューや文字選択が出ない」を含め、すべて OK とオーナーが報告） |
| TC-0007-08 | Android | 未実施（§3） |

## 3. 確認できなかったこと

- **Android の実機では確かめていない**（オーナーが Android の端末を持っていないため、2026-10-23）。Android の Chrome での指の操作は、E2E（Pixel 7 の設定、組み立てた `PointerEvent`）だけで確かめた。
- E2E のタッチは、ほとんどが組み立てた `PointerEvent` で、ブラウザのスクロールや拡大の振る舞いそのものは再現していない（本物のタッチは `touchscreen.tap` の 1 件だけ）。iPhone の実機の確認で補った。
- 手順の前提「START」は、この PR の時点ではタイトル画面からの流れがなかったので、開いてすぐのプレイ画面で確かめた。TASK-0009 で START からの形に直し、通っている（AC-0009）。
- 動かす・離すは、TD-0003 §3.3 の「Canvas（キャプチャ中）」ではなく `window` で受けている。捕まえた Canvas のイベントは `window` に伝わるので、動きは同じ。組み立てたイベントでは捕まえが効かないため、この形にした。

## 4. 後片付け

- なし（一時ファイルは作っていない）。

## 5. 完了定義のチェックリスト

- [x] タスクの「やること」がすべてできている
- [x] TC-0007-01〜07 が、名前に確認 ID を付けて書かれ、両プロジェクトで通っている
- [x] `npm run verify` と `npm run test:e2e` が手元で通る
- [x] PR の CI が緑
- [x] 設計と違う作りにしたところ（動かす・離すを `window` で受ける）は §3 に書いた。動きは設計と同じなので、設計書は直していない
- [x] PR がマージされた（PR #26）
