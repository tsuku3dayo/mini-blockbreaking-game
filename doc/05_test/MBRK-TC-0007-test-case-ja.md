---
id: MBRK-TC-0007
type: Test Case
title: 指でパドルを動かし、タップで発射する
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0007
  - MBRK-TD-0003
verified: null
---

# TC-0007 指でパドルを動かし、タップで発射する

- 対象：[MBRK-US-0007](../02_requirements/MBRK-US-0007-user-story-ja.md)
- テストファイル：`e2e/touch.spec.ts`
- E2E の前提：`/?debug=1` で START。タッチは `pointerType: 'touch'` の `PointerEvent` を送る。位置は Canvas の論理座標から画面座標に直して送る

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0007-01 | なぞると追従、離すと止まる（§12.2-1） | E2E | 論理 x = 240 で押し → 100 → 300 と動かし → 離す → 離したあと別の位置で `pointermove`（同じ id・押していない） | 動かすたびに `paddleX` が 100・300。離したあとは 300 のまま |
| TC-0007-02 | 動かして離しても発射しない（§12.2-2） | E2E | 発射前に x = 240 で押し → 260 に動かして離す | `status = 'ready'` のまま |
| TC-0007-03 | タップで発射（§12.2-2） | E2E | 続けて x = 260 で押し、5 px 動かして離す | `status = 'playing'` |
| TC-0007-04 | スクロール・拡大しない（§12.2-3） | E2E | Canvas の CSS を読む。なぞる操作の前後で `scrollY` を比べる | `touch-action: none`、`user-select: none`。`scrollY` は変わらない |
| TC-0007-05 | 領域の外に出ても追従 / 外で押したら追従しない（§4.1-2） | E2E | Canvas 内で押してから Canvas の右外まで動かす。別に、Canvas の外（操作欄）で押して Canvas 上へ動かす | 前者：`paddleX = 440`。後者：`paddleX` は変わらない |
| TC-0007-06 | 2 本目の指は無視（§4.1-2） | E2E | 1 本目を x = 100 で押したまま、2 本目（別の id）を x = 400 で押して動かす | `paddleX = 100` のまま |
| TC-0007-07 | 中断で追従をやめる（§4.1-6） | E2E | 押して動かしている途中で `pointercancel` | 以後の `pointermove` で `paddleX` が変わらない。発射しない |
| TC-0007-08 | 実機の操作感 | 手動 | iPhone・Android の実機で 1 ゲーム遊ぶ | 指で思った位置にパドルが動く。なぞってもページが動かない・拡大しない・長押しメニューや文字選択が出ない。発射前に位置を合わせてからタップで発射できる |
