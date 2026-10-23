---
id: MBRK-TC-0008
type: Test Case
title: マウス・キーボードでも遊ぶ
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0008
  - MBRK-TD-0002
  - MBRK-TD-0003
verified: null
---

# TC-0008 マウス・キーボードでも遊ぶ

- 対象：[MBRK-US-0008](../02_requirements/MBRK-US-0008-user-story-ja.md)
- テストファイル：`tests/game.test.ts`、`e2e/keyboard-mouse.spec.ts`
- E2E の前提：`/?debug=1` で START。マウスは `page.mouse`、キーは `page.keyboard`

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0008-01 | 最後に使った入力に従う（§12.2-4） | E2E | マウスを論理 x = 100 へ → → を 0.5 秒押す → マウスを x = 400 へ | `paddleX` が 100 → 約 310（100 + 420 × 0.5）→ 400 |
| TC-0008-02 | A / D でも動く | E2E | D を 0.5 秒、A を 0.5 秒 | 右に約 210、左に約 210 動く |
| TC-0008-03 | 速さと両方押し（§4.1-1） | 単体 | `dir = 1` で 120 ステップ。`dir = 0`（両方押し）で 120 ステップ | 420 動く（上限まで）／動かない |
| TC-0008-04 | Space の押しっぱなし（§12.2-5） | E2E | 発射前に `keydown`（`repeat: true`）の Space だけを送る | `status = 'ready'` のまま。続けて `repeat: false` の Space で `playing` |
| TC-0008-05 | マウスはボタンなしで追従、外でも追従（§4.1-2） | E2E | ボタンを押さずに動かす。Canvas の左外まで動かす | 追従する。左外では `paddleX = 40` |
| TC-0008-06 | クリックで発射、動かしながらは発射しない（§4.1-4） | E2E | 押して 30 px 動かして離す → その場でクリック | 前者は ready のまま、後者で playing |
| TC-0008-07 | スクロールしない（§4.1-7） | E2E | プレイ中に ←・→・Space の `keydown` を送り、`defaultPrevented` を記録 | すべて `true` |
| TC-0008-08 | カーソルを隠す（§2.2） | E2E | マウスで動かしてプレイ中にする。一時停止にする | プレイ中は Canvas の `cursor` が `none`、一時停止中は `none` でない |
| TC-0008-09 | フォーカスを失ったら離した扱い（§4.1-6） | E2E | → を押したまま `window` に `blur` を送る | `paddleX` がそれ以上増えない |
| TC-0008-10 | パソコンで遊ぶ | 手動 | パソコンの Chrome / Edge で、マウスとキーボードでそれぞれ 1 ゲーム | どちらでも最後まで遊べる。キー配列・IME がオンでも ← → A D が効く |
