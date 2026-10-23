---
id: MBRK-TC-0006
type: Test Case
title: 結果とスコアの内訳を見る
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0006
  - MBRK-GUI-0004
  - MBRK-TD-0002
  - MBRK-TD-0004
verified: null
---

# TC-0006 結果とスコアの内訳を見る

- 対象：[MBRK-US-0006](../02_requirements/MBRK-US-0006-user-story-ja.md)
- テストファイル：`tests/score.test.ts`、`tests/format.test.ts`、`e2e/result.spec.ts`
- E2E の前提：`/?debug=1` で START、`setup` で終了の直前を作り、時計を進めて終わらせる

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0006-01 | 95,789 ms でクリア（§12.3-1） | 単体 | `summarize`（cleared、broken 40、elapsedMs 95,789）、`formatSeconds(95789)` | blockScore 400、timeBonus 850、total 1,250、「95.7」 |
| TC-0006-02 | 同上の表示 | E2E | クリアの直前・経過 95,789 ms にして終わらせる | パネルに「400」「850」「1,250」「95.7 秒」「40 / 40」 |
| TC-0006-03 | 180 秒以上（§12.3-2） | 単体 | `timeBonus('cleared', 180000)`・`(…, 250000)`・`(…, 179999)` | 0・0・10 |
| TC-0006-04 | ゲームオーバー（§12.3-3） | 単体 | `summarize`（gameOver、broken 12） | total = 120、timeBonus = 0 |
| TC-0006-05 | ゲームオーバーの表示 | E2E | 12 個壊した状態で落とす | 「GAME OVER」、合計「120」、「12 / 40」。「ブロック」「時間ボーナス」「タイム」の行がない |
| TC-0006-06 | 見出し | E2E | クリア / ゲームオーバー | 「CLEAR!」/「GAME OVER」の文字とアイコン（`svg`）がある |
| TC-0006-07 | パネルの位置 | E2E | 両プロジェクトで終わらせる | パネルの外形がゲーム領域の外形の中に収まる。パネルの中身がはみ出すときはパネルがスクロールできる（`overflow-y: auto`） |
| TC-0006-08 | RETRY / TITLE / RANKING | E2E | それぞれ押す（500 ms 待ってから） | RETRY：`data-game-state = "ready"`・得点 0。TITLE：タイトル画面。RANKING：ランキング画面 |
