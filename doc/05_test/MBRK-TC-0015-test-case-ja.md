---
id: MBRK-TC-0015
type: Test Case
title: 効果音で出来事が分かる
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0015
  - MBRK-TD-0005
verified: null
---

# TC-0015 効果音で出来事が分かる

- 対象：[MBRK-US-0015](../02_requirements/MBRK-US-0015-user-story-ja.md)
- テストファイル：`tests/sound-plan.test.ts`、`tests/collision.test.ts`、`e2e/sound.spec.ts`
- E2E の前提：`app:sound` イベントの `detail`（`name`・`muted`）を `addInitScript` で記録する

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0015-01 | 8 種類が鳴る（§12.6-1） | E2E | `/?debug=1` で、発射・パドル・壁・ブロック・加速（9 個壊した状態から 1 個）・クリア・ゲームオーバー・登録成功をそれぞれ起こす | それぞれ `launch`・`paddle`・`wall`・`block`・`speedUp`・`clear`・`gameOver`・`register` が記録される |
| TC-0015-02 | 2 個同時でも 1 回（§12.6-2） | 単体 | `planSounds([block(row 4, count 2)])`、`planSounds([block, block])` | `block` が 1 つだけ |
| TC-0015-03 | 最後のブロックはクリアだけ（§12.6-3） | 単体 | `planSounds([paddle, block, speedUp, clear])` | `[clear]` だけ |
| TC-0015-04 | 同上（画面） | E2E | 残り 1 個を壊すフレーム | そのフレームの記録が `clear` だけ |
| TC-0015-05 | 音が使えなくても遊べる（§12.6-7） | E2E | `AudioContext` を消して開く → 1 ゲーム終える | エラーなく結果パネルが出る（ページのエラーが 0 件） |
| TC-0015-06 | 行で高さが変わる | 単体 | `planSounds([block(row 0)])` と `(row 4)` | `row` が 0・4。音の高さの表（TD-0005）で 0 が最も高い |
| TC-0015-07 | 押し出しでは鳴らない | 単体 | `collidePaddle` が `'push'` になる状態で `step` | 出来事に `paddle` がない |
| TC-0015-08 | 1 フレームで同じ種類は 1 回 | 単体 | `planSounds([wall, wall, paddle, wall])` | `wall` と `paddle` が 1 つずつ |
| TC-0015-09 | 実機で鳴る・止まる | 手動 | iPhone・Android で、START を押してから 1 ゲーム。途中で一時停止、別のアプリに切り替え | 8 種類が聞き分けられる。ブロックは上の行ほど高い。一時停止・切替えで音が止まる |
| TC-0015-10 | 最初のタップから鳴る | 手動 | iPhone で、アプリを開いて最初に START を押して発射 | 発射の音が鳴る |
| TC-0015-11 | 遅れ（§10） | 手動 | パドル・ブロックに当たる瞬間を見ながら聞く | 遅れを感じない |
| TC-0015-12 | マナーモード | 手動 | iPhone のマナーモードをオン / オフで遊ぶ | 結果を AC に記録する（鳴らない場合はブラウザの仕様として「確認できなかったこと」に書く） |
