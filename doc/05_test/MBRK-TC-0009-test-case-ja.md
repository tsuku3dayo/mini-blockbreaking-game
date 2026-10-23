---
id: MBRK-TC-0009
type: Test Case
title: 一時停止・再開する
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0009
  - MBRK-GUI-0003
  - MBRK-TD-0002
  - MBRK-TD-0003
verified: null
---

# TC-0009 一時停止・再開する

- 対象：[MBRK-US-0009](../02_requirements/MBRK-US-0009-user-story-ja.md)
- テストファイル：`tests/game.test.ts`、`tests/render.test.ts`、`e2e/pause.spec.ts`
- E2E の前提：`/?debug=1` で START → 発射。時計は `page.clock` で進める

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0009-01 | ボタン・P・Esc で止まり、時間が増えない（§12.2-6） | E2E | 一時停止ボタンを押す → 時計を 5 秒進める → 再開。P・Esc でも同じ | 止めている間 `elapsedMs` が変わらない。再開後は増える |
| TC-0009-02 | 画面が隠れたら自動で止まり、戻っても再開しない（§12.2-7） | E2E | `visibilitychange`（hidden）→ 時計を進める →（visible） | `status = 'paused'` のまま、`elapsedMs` は変わらない |
| TC-0009-03 | 一時停止中の Space で発射しない（§12.2-8） | E2E | 発射前に一時停止 → Space → 再開 → 時計を 1 秒進める | `status = 'ready'` のまま |
| TC-0009-04 | 一時停止の幕と文字（§2.2） | 単体 | 偽の Canvas に一時停止中の状態を描く | 全面の幕、「PAUSED」、「再開ボタン / P / Esc で再開」 |
| TC-0009-05 | ボタンの表示と押せる場面（§8.3） | E2E | 一時停止・再開・終了後 | 文字が「一時停止」⇔「再開」、`aria-pressed` が false ⇔ true。終了後は `disabled` |
| TC-0009-06 | 止める前の状態に戻る（§7.1） | 単体 | 発射前で `pause` → `resume`、プレイ中で `pause` → `resume`、終了後に `pause` | `ready` に戻る／`playing` に戻る／`false` を返して変わらない |
| TC-0009-07 | P の押しっぱなし（§4.1-5） | E2E | P（repeat なし）→ P（`repeat: true`）を 3 回 | 一時停止のまま（再開と一時停止を繰り返さない） |
| TC-0009-08 | 実機での中断 | 手動 | プレイ中に別のアプリに切り替えて戻る。画面をロックして戻る | どちらも一時停止になっていて、再開ボタンで続きから遊べる |
