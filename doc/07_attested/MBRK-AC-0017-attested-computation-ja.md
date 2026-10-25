---
id: MBRK-AC-0017
type: Attested Computation
title: 効果音の合成と鳴らし方の実施記録
status: draft
version: 1.0
updated: 2026-10-25
sources:
  - MBRK-TASK-0017
  - MBRK-TC-0015
verified: null
---

# AC-0017 効果音の合成と鳴らし方の実施記録

## 1. 実施概要

| 項目 | 内容 |
| --- | --- |
| タスク | [MBRK-TASK-0017](../06_plan/MBRK-TASK-0017-implementation-task-ja.md) 効果音の合成と鳴らし方 |
| テストケース | TC-0015-01〜08（TC-0015-09〜12 は WS-0006 の終わりの手動） |
| 実施者 | Claude Code（Opus 5.5） |
| 環境 | Windows 11 Pro、Node.js 24.0.0、Vitest 5、Playwright（Chrome for Testing 156） |
| ブランチ | `feat/0017-sound` |

## 2. 確認結果（自動テスト・2026-10-25）

`tests/sound-plan.test.ts` と `e2e/sound.spec.ts`（pixel7・small の両プロジェクト）。E2E は `app:sound` イベントの `detail`（`name`・`muted`）を記録して確かめた。

| 確認 ID | 種類 | 確かめたこと | 結果 |
| --- | --- | --- | --- |
| TC-0015-01 | E2E | 発射（Space）・パドル（真上から落とす）・壁（左の壁へ）・ブロック（最下段を下から）・加速（9 個壊した状態から 1 個）・クリア・登録成功・ゲームオーバーで、それぞれ `launch`・`paddle`・`wall`・`block`・`speedUp`・`clear`・`register`・`gameOver` が記録される。発射の音は `muted: false`（START のクリックで鳴らせる状態になっている） | 成功 |
| TC-0015-02 | 単体 | `planSounds([block(row 4, count 2)])`・`planSounds([block, block])` → `block` 1 つ（row は最初の出来事の行） | 成功 |
| TC-0015-03 | 単体 | `planSounds([paddle, block, speedUp, clear])` → `[clear]` だけ。ゲームオーバーも同じ | 成功 |
| TC-0015-04 | E2E | 残り 1 個を壊すフレーム（壊した数 39 → 40）の記録が `clear` だけ | 成功 |
| TC-0015-05 | E2E | `AudioContext`・`webkitAudioContext` を消して開き、発射してゲームオーバーまで → 結果パネルが出て、ページのエラーは 0 件。音はすべて `muted: true` | 成功 |
| TC-0015-06 | 単体 | `planSounds([block(row 0)])`・`(row 4)` → `row` が 0・4。音の高さの表は行 0 が 1047 Hz で最も高い | 成功 |
| TC-0015-07 | 単体 | 上向きのボールがパドルに重なる状態で `step` → 押し出された（y = 594、vy = −300 のまま）うえで、出来事に `paddle` がない | 成功 |
| TC-0015-08 | 単体 | `planSounds([wall, wall, paddle, wall])` → `paddle` と `wall` が 1 つずつ（launch → paddle → wall → block → speedUp の順） | 成功 |

そのほか：

- 単体 91 件・E2E 149 件、`npm run verify` は成功。
- 実装：
  - `src/sound-plan.ts`（ロジック層）：TD-0005 §1 のとおり。
  - `src/sound.ts`：オシレーター 1 つと音量の包絡（立ち上がり 5 ms、指数で減衰）で 1 音を作り、複数の音は時間をずらして並べる。主音量 0.25。音の高さ・長さは TD-0005 §2 の表のとおり。鳴っているオシレーターを `Set` で持ち、`stopAll()` で全部止める。画面が隠れたら `stopAll()` と `suspend()`、戻ったら `resume()`。中の処理はすべて `try/catch` で、例外を外に出さない。オン / オフの設定は起動時に `load('sound', true)` を読む（切り替えのボタンは TASK-0018）。
  - `play.ts`：1 フレームのステップのあとに `playFrame(events)`。一時停止と画面を離れるときに `stopAll()`。`result-panel.ts`：登録に成功したら `register`。

**設計と少し違う作り（1 点）**：

- TD-0005 §3 は「最初の `pointerdown`・`keydown` で 1 回だけ `unlock()`」としている。実装では、`pointerdown`・`pointerup`・`touchend`・`click`・`keydown` のどれでも `unlock()` を試し、`AudioContext` が鳴らせる状態（`running`）になったら外すようにした。
- 理由：Chrome などでは、タッチの `pointerdown` は「利用者の操作」と認められず、そこで `resume()` しても音を鳴らせないことがある。指を離したとき・クリックで試せば、最初の START のタップから鳴らせる（TC-0015-10 のため）。
- 設計書（TD-0005）はまだ直していない。この作りでよければ、TD-0005 §3 の表を直す。

## 3. 確認できなかったこと

- 実際の音（8 種類の聞き分け・ブロックの行ごとの高さ・遅れ・マナーモード・最初のタップから鳴るか）は、WS-0006 の終わりに iPhone で確かめる（TC-0015-09〜12）。Android は端末がないため確かめない。
- 画面が隠れたときに音が止まることは、E2E では確かめていない（音そのものは E2E で聞けないため）。手動（TC-0015-09）で確かめる。
- オン / オフの切り替え（ボタン）は TASK-0018。

## 4. 後片付け

- なし（一時ファイルは作っていない。前のタスクの `e2e/zz-shot.spec.ts` は作業フォルダに残ったままで、コミットしていない）。

## 5. 完了定義のチェックリスト

- [x] タスクの「やること」がすべてできている
- [x] TC-0015-01〜08 が、名前に確認 ID を付けて書かれ、通っている
- [x] `npm run verify` と `npm run test:e2e` が手元で通る
- [ ] PR の CI が緑
- [ ] 設計と違う作りにしていない（`unlock()` を試すイベントを増やした。§2 のとおり、オーナーの判断を待つ）
- [ ] PR がマージされた
