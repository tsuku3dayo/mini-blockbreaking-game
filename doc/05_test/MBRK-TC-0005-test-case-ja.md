---
id: MBRK-TC-0005
type: Test Case
title: クリア・ゲームオーバーで終わる
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0005
  - MBRK-TD-0002
  - MBRK-TD-0003
verified: null
---

# TC-0005 クリア・ゲームオーバーで終わる

- 対象：[MBRK-US-0005](../02_requirements/MBRK-US-0005-user-story-ja.md)
- テストファイル：`tests/game.test.ts`、`tests/loop.test.ts`、`tests/render.test.ts`、`e2e/play.spec.ts`

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0005-01 | クリア（§12.1-10） | 単体 | 残り 1 個にして、その 1 個に当たる位置・速度で `step` | `status = 'cleared'`、出来事 `clear` |
| TC-0005-02 | ゲームオーバー（§12.1-10） | 単体 | ボール y = 645、vy = 300（下向き）で `step` | 上端（y − 6）が 640 を超えたステップで `status = 'gameOver'`、出来事 `gameOver`。超える前のステップでは playing のまま |
| TC-0005-03 | 同じステップならクリア（§12.1-11） | 単体 | 最後のブロックを壊すステップで、ボールが下端の外に出る状態を作る | `status = 'cleared'`、出来事に `gameOver` がない |
| TC-0005-04 | 決定性（§12.1-12） | 単体 | 同じ入力列（5,000 ステップ分）を、新しいゲーム 2 つに与える | 2 つの状態（JSON にしたもの）と出来事の列が一致 |
| TC-0005-05 | フレームの間隔によらない（§5.1、§10） | 単体 | `advance` に 1 秒分の時刻を 7 ms・16.7 ms・33.3 ms 刻みで渡し、返った回数だけ `step` | どの刻みでも合計 120 ステップ、最後の状態が一致 |
| TC-0005-06 | 1 フレームの上限 100 ms（§5.1） | 単体 | `advance` に 1 回で 500 ms 進めた時刻 | 返る回数は 12（100 ms 分） |
| TC-0005-07 | 再開で止まっていた時間を進めない | 単体 | `resetAccumulator` のあと、10 秒後の時刻で `advance` | 0 を返す |
| TC-0005-08 | 終了後は暗く表示（§7.1） | 単体 | 偽の Canvas に `render(state, dimmed = true)` | 盤面を不透明度 0.5 で描く |
| TC-0005-09 | 終了で物理が止まる | E2E | `/?debug=1`、`setup` で落ちる直前にする、時計を進める | `data-game-state = "gameOver"`。さらに時計を進めても `snapshot()` が変わらない |
| TC-0005-10 | TIME はプレイ中だけ増え、切り捨て（§6） | 単体 | 発射前に 120 ステップ、発射後に 5,039 ステップ | `elapsedMs` ≈ 41,991.7、HUD の文字は「TIME : 41」 |
