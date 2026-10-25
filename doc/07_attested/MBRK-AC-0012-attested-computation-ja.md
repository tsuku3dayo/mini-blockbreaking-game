---
id: MBRK-AC-0012
type: Attested Computation
title: 結果パネルの入力ガードと Enter の扱いの実施記録
status: review
version: 1.0
updated: 2026-10-25
sources:
  - MBRK-TASK-0012
  - MBRK-TC-0011
verified: null
---

# AC-0012 結果パネルの入力ガードと Enter の扱いの実施記録

## 1. 実施概要

| 項目 | 内容 |
| --- | --- |
| タスク | [MBRK-TASK-0012](../06_plan/MBRK-TASK-0012-implementation-task-ja.md) 結果パネルの入力ガードと Enter の扱い |
| テストケース | TC-0011-01〜04（この時点で確かめられる部分。登録が絡む部分は TASK-0015） |
| 実施者 | Claude Code（Opus 5.5） |
| 環境 | Windows 11 Pro、Node.js 24.0.0、Playwright（Chrome for Testing 156） |
| ブランチ | `feat/0012-result-guard` |

## 2. 確認結果（自動テスト・2026-10-23）

`e2e/result.spec.ts` の「誤操作を防ぐ（TC-0011、page.clock）」（pixel7・small の両プロジェクト）。時計は `page.clock` で止め、`runFor` で進めた。

| 確認 ID | 確かめたこと | 結果 |
| --- | --- | --- |
| TC-0011-01 | ゲームオーバーで終わってから 400 ms 以内に、Enter・Space・RETRY のタップ・RETRY のクリックをしても、結果パネルのまま | 成功 |
| TC-0011-02 | 続けて 200 ms 進めて Enter で、新しいゲーム（`ready`） | 成功 |
| TC-0011-03 | TITLE にフォーカスして Enter でタイトル画面（リトライしない） | 成功（入力欄の Enter は §3） |
| TC-0011-04 | 終わったあとは、ゲーム用の入力（マウス・P）で状態が変わらず、Space の既定の動きも止められない | 成功（入力欄への「A B」の入力は §3） |

そのほか：

- 入力ガードを外した（時間を 0 にした）作りで TC-0011-01 を動かし、失敗することを確かめた（テストがガードを見分けられる）。確かめたあと元に戻した。
- 最初は TC-0011-01 がときどき失敗した。`page.clock.install()` だけでは時計が実時間でも進み続け、Playwright の操作の待ち時間で 500 ms を超えることがあったため。終わらせる前に `page.clock.pauseAt` で時計を止める形に直し、4 回繰り返して 24 件すべて通ることを確かめた。
- 単体 57 件・E2E 84 件、`npm run verify` は成功。
- 実装（`src/result-panel.ts`）：パネルを出した時刻を覚え、500 ms 以内の Enter・Space（`keydown`・`keyup`、`window` のキャプチャ段階）と、パネル上の `pointerdown`・`pointerup`・`click`（パネルのキャプチャ段階）を `preventDefault()` と `stopImmediatePropagation()` で止める。見た目は変えない。フォーカスのない Enter は RETRY、部品にフォーカスがあるときの Enter は部品だけ（TASK-0010 で入れたもの）。終わったらゲーム用の入力の受付をやめる（TASK-0006 の `input.detach()`）。

PR #32 の CI（`check`・`e2e`）は緑。2026-10-23 にマージ。

### 2.1 段階の終わりの確認（WS-0004、手動、2026-10-25）

オーナーが iPhone で公開 URL を開き、結果パネルが出てから 0.5 秒ほどはボタンが反応しないことを確かめた（OK とオーナーが報告）。

## 3. 確認できなかったこと

- **名前の入力欄と REGISTER がまだない（TASK-0015）ので、次は確かめていない。** TASK-0015 で足す。
  - TC-0011-01 の「REGISTER のクリックが効かず、登録されない」
  - TC-0011-03 の「名前の入力欄で Enter → 登録され、結果パネルのまま」
  - TC-0011-04 の「入力欄に『A B』と入力できる」（代わりに、終わったあと Space の既定の動きが止められていないことを確かめた）
- 実機での確認は iPhone だけ。Android は端末がないため確かめていない。

## 4. 後片付け

- ガードを外した確認のための変更は元に戻した（`git diff` で確認）。

## 5. 完了定義のチェックリスト

- [x] タスクの「やること」がすべてできている
- [x] TC-0011-01〜04 のうち、この時点で確かめられる部分が、名前に確認 ID を付けて書かれ、通っている
- [x] `npm run verify` と `npm run test:e2e` が手元で通る
- [x] PR の CI が緑
- [x] 設計と違う作りにしていない（設計書の修正なし）
- [x] PR がマージされた（PR #32）
- [x] 実機（iPhone）で入力ガードを確かめた
