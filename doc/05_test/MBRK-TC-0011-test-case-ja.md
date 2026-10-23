---
id: MBRK-TC-0011
type: Test Case
title: 結果画面での誤操作を防ぐ
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0011
  - MBRK-GUI-0004
  - MBRK-TD-0004
verified: null
---

# TC-0011 結果画面での誤操作を防ぐ

- 対象：[MBRK-US-0011](../02_requirements/MBRK-US-0011-user-story-ja.md)
- テストファイル：`e2e/result.spec.ts`
- E2E の前提：`/?debug=1`、`page.clock` を使う。`setup` で終了の直前を作り、時計を進めて終わらせる

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0011-01 | 500 ms 以内は効かない（§12.2-9） | E2E | 終わった直後（時計を 400 ms 進めた時点）に Enter・Space・RETRY のタップ・REGISTER のクリック | 結果パネルのまま。登録されない（保存データが空のまま） |
| TC-0011-02 | 500 ms を過ぎれば効く（§4.1-8） | E2E | 続けて時計を 200 ms 進め、Enter | 新しいゲーム（`ready`） |
| TC-0011-03 | フォーカスのある部品の Enter（§4.1-9） | E2E | TITLE にフォーカスして Enter。別のゲームで、名前の入力欄で Enter | 前者はタイトル画面（リトライしない）。後者は登録され、結果パネルのまま |
| TC-0011-04 | ゲーム用の入力が邪魔しない（§4.1-7） | E2E | 結果パネルの入力欄に「A B」と入力（空白を含む） | 入力欄の値が「A B」（Space の既定動作が止められていない） |
