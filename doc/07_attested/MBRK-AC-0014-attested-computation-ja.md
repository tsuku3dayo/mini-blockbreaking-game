---
id: MBRK-AC-0014
type: Attested Computation
title: 保存とランキングの規則の実施記録
status: draft
version: 1.0
updated: 2026-10-25
sources:
  - MBRK-TASK-0014
  - MBRK-TC-0012
  - MBRK-TC-0013
verified: null
---

# AC-0014 保存とランキングの規則の実施記録

## 1. 実施概要

| 項目 | 内容 |
| --- | --- |
| タスク | [MBRK-TASK-0014](../06_plan/MBRK-TASK-0014-implementation-task-ja.md) 保存とランキングの規則 |
| テストケース | TC-0012-01・03・04・06・07・09・13、TC-0013-01・05（`rankLabel`） |
| 実施者 | Claude Code（Opus 5.5） |
| 環境 | Windows 11 Pro、Node.js 24.0.0、Vitest 5、Playwright（Chrome for Testing 156） |
| ブランチ | `feat/0014-storage-ranking` |

## 2. 確認結果（自動テスト・2026-10-25）

単体テスト（`tests/ranking.test.ts`・`tests/storage.test.ts`・`tests/records.test.ts`・`tests/format.test.ts`）。localStorage は偽物（`tests/fake-storage.ts`。指定した回数目の `setItem`・`getItem` を例外にできる）を `vi.stubGlobal` で入れた。

| 確認 ID | 確かめたこと | 結果 |
| --- | --- | --- |
| TC-0012-01 | `validateName(' TSUKU ')`、全角空白で囲んだ名前 → `{ ok: true, name: 'TSUKU' }` | 成功 |
| TC-0012-03 | 13 文字 → `tooLong`、空・空白だけ → `empty`、U+200B・U+0007 を含む → `invalidChar`。12 文字ちょうどは通る | 成功 |
| TC-0012-04 | 13 文字でゼロ幅文字を含む名前 → `invalidChar` | 成功 |
| TC-0012-06 | `countChars('𠮷'.repeat(12)) = 12`、12 個は ok、13 個は `tooLong` | 成功 |
| TC-0012-07 | 10 件（最下位 500）に 400 → `rank = null`、一覧は同じもの | 成功 |
| TC-0012-09 | 10 件に 950 → 6 位、新しい一覧は 10 件で元の 10 位（500）がない | 成功 |
| TC-0012-13 | 3 つ目の `setItem` で失敗 → `saveAll` は `false`、全部のキーが書く前の値（もとになかったキーは消える） | 成功 |
| TC-0013-01 | 同点は createdAt が先の方が上、createdAt も同じなら id が小さい方が上（`compareRecords`・`rankOf`） | 成功 |
| TC-0013-05 | `rankLabel(1〜4, 10)` → `1st`・`2nd`・`3rd`・`4`・`10` | 成功 |

そのほかに確かめたこと（確認 ID なし）：

- スコアの規則（仕様書 §9.3）：0〜2,200 の 10 の倍数、ゲームオーバーは 400 以下、クリアは 400 以上。数でないもの・知らない result は通さない。
- 記録の規則：id は 1 以上の整数、名前は前後に空白がなく規則に通る、日時は `toISOString()` の形でありえる日付（2026-02-29・24 時は通さず、2028-02-29 は通す）。
- `register`：空のランキングに 1 位で保存（記録・次の id・前回の名前・自分の記録 id）。同点の 2 回目は 2 位。圏外のときは `scores`・`lastRecordId` を書かず、`nextId`・`lastName` だけ書く。保存できないときは `{ ok: false }` で何も変わらない。
- `loadRanking`：0 件は空の一覧、`scores` が壊れた JSON・配列でない・規則に合わない記録を含むときは `{ ok: false }`。
- 元に戻すのにも失敗したとき・読み出しから失敗するときも、`saveAll` は例外を出さず `false`。`migrateStorage` は未保存なら版 1 を書き、新しい版はそのまま、保存できなくても例外を出さない。
- 単体 85 件・E2E 102 件、`npm run verify` は成功。

実装：

- `src/storage.ts`：キーは `mini-blockbreaking-game-<名前>`、値は JSON。`load`・`tryLoad`（値がないときは `value: undefined`）・`save`・`saveAll`・`migrateStorage`・`requestPersist`（`navigator.storage.persist()`、対応していなければ何もしない）。
- `src/ranking.ts`：TD-0004 §2 のとおり。ロジック層では `Date` を使わない決まり（ESLint）なので、日時の形は正規表現と月の日数で確かめた。
- `src/records.ts`：TD-0004 §3 のとおり。次の id は、保存値が壊れていても保存済みの最大の id + 1 以上にそろえる（id を重ねないため。設計に書いていない守りを足した）。`loadLastName` は規則に合わない名前を `''` にする。
- `src/format.ts` に `rankLabel`、`src/main.ts` の起動の手順の最初に `migrateStorage()`・`requestPersist()` を足した。

## 3. 確認できなかったこと

- 画面（結果パネルでの登録・ランキング画面）はまだないので、TC-0012・0013 の E2E は TASK-0015・0016 で行う。
- `requestPersist()` が実機のブラウザで受け入れられるかは確かめていない（結果は画面に出さず、失敗しても何もしないため）。
- `simple_shogi` の `storage.ts` は読まずに、TD-0004 §1 から書いた（オーナーの指示）。

## 4. 後片付け

- なし（一時ファイルは作っていない）。

## 5. 完了定義のチェックリスト

- [x] タスクの「やること」がすべてできている
- [x] TC-0012-01・03・04・06・07・09・13、TC-0013-01・05 が、名前に確認 ID を付けて書かれ、通っている
- [x] `npm run verify` と `npm run test:e2e` が手元で通る
- [ ] PR の CI が緑
- [x] 設計と違う作りにしていない（設計書の修正なし。次の id の守りは設計の範囲内の追加）
- [ ] PR がマージされた
