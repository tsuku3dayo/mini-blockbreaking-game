---
id: MBRK-TC-0014
type: Test Case
title: 記録をファイルに書き出して戻す
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0014
  - MBRK-GUI-0005
  - MBRK-GUI-0006
  - MBRK-TD-0004
verified: null
---

# TC-0014 記録をファイルに書き出して戻す

- 対象：[MBRK-US-0014](../02_requirements/MBRK-US-0014-user-story-ja.md)
- テストファイル：`tests/backup.test.ts`、`e2e/backup.spec.ts`
- テスト用のファイル：`e2e/fixtures/` に、正しいファイル・別のアプリ・新しすぎる版・壊れた JSON・不正なスコアの 5 種類

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0014-01 | 書き出して戻す（§12.5-1） | E2E | 3 件登録 → 書き出す（`download` を受け取る）→ 保存データを消す → 読み込む → 確認で「読み込む」 | 同じ 3 件の表、「（あなた）」も同じ行 |
| TC-0014-02 | 断るファイル（§12.5-2） | 単体 | `parseBackup` に、JSON でない文字列・`app` が違う・`schemaVersion` = 2・`scores` がない | `unreadable`・`otherApp`・`tooNew`・`unreadable` |
| TC-0014-03 | 同上（画面） | E2E | 1 件ある状態で、別のアプリ・新しすぎる版・壊れたファイルを選ぶ | 確認ダイアログを出さず、それぞれの理由の文を表示。表は 1 件のまま |
| TC-0014-04 | 不正なスコア（§12.5-3） | 単体 | score 401 + gameOver、390 + cleared、1,255 を 1 件ずつ含むファイル | どれも `invalidRecord` |
| TC-0014-05 | 同上（画面） | E2E | 不正なスコアのファイルを選ぶ | 「記録の内容が正しくありません」、表は変わらない |
| TC-0014-06 | 確認の取り消し（§12.5-4） | E2E | 正しいファイルを選ぶ → 確認で「キャンセル」。もう一度選んで Esc | どちらも表は変わらない。最初のフォーカスは「キャンセル」 |
| TC-0014-07 | ファイル名（§9.6） | 単体・E2E | `backupFileName(new Date(2026, 9, 23))`。書き出しの `download.suggestedFilename()` | `mini-blockbreaking-game-backup-20261023.json`。画面の書き出しも同じ形 |
| TC-0014-08 | 成功の表示（§9.6） | E2E | 3 件のファイルを読み込む | 「記録を読み込みました（3 件）」 |
| TC-0014-09 | 10 件を超える・nextId（§9.6） | 単体 | 12 件・`nextId = 5`（最大 id 30）のファイル | 上位 10 件だけ、`nextId = 31` |
| TC-0014-10 | 実機での書き出し・読み込み | 手動 | iPhone・Android で書き出し、ファイルアプリに保存できるか、そのファイルを読み込めるか | 保存でき、読み込める。できなかった場合は AC に端末とブラウザを書く |
