---
id: MBRK-AC-0001
type: Attested Computation
title: プロジェクトの土台の実施記録
status: review
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-TASK-0001
verified: null
---

# AC-0001 プロジェクトの土台の実施記録

## 1. 実施概要

| 項目 | 内容 |
| --- | --- |
| タスク | [MBRK-TASK-0001](../06_plan/MBRK-TASK-0001-implementation-task-ja.md) プロジェクトの土台 |
| テストケース | なし（`npm run verify` と E2E の仮のテストで確かめる） |
| 実施者 | Claude Code（Opus 5.5） |
| 環境 | Windows 11 Pro、Node.js 24.0.0、npm 11.3.0、Vite 8.3.5、Vitest 5.0.5、Playwright（Chrome for Testing 156） |
| ブランチ | `feat/0001-scaffold` |

## 2. 確認結果（自動テスト・2026-10-23）

| 確認 | 結果 |
| --- | --- |
| `npm ci` | 成功（492 パッケージ、脆弱性 0） |
| `npm run lint` | 成功（警告・エラーなし） |
| `npm test` | 成功（1 件：`tests/smoke.test.ts`） |
| `npm run build` | 成功（`tsc --noEmit` と `vite build`） |
| `npm run test:e2e` | 成功（2 件：`pixel7`・`small` の各プロジェクトで「タイトル画面が開く」） |
| `npm run dev` の画面 | 375 × 667（iPhone SE 相当）で、暗い背景にロゴ「BREAKOUT」・5 色の飾り・START（フォーカスの輪あり）・RANKING が出ることをスクリーンショットで確かめた。横スクロールなし（E2E でも確認） |

PR #9 は、2026-10-23 18:01 にオーナーが Sourcetree でマージした。

### 2.1 手動の確認（WS-0001 の終わり、2026-10-23）

公開 URL で、オーナーがパソコン（Chrome）と iPhone（Safari）で開き、タイトル画面の骨組みが出ることを目で確かめた（OK）。詳しくは [MBRK-AC-0003](MBRK-AC-0003-attested-computation-ja.md) §2.2。

## 3. 確認できなかったこと

- **TASK-0001 やること 7（`CLAUDE.md` に `simple_shogi` の共通ルールを足す）は行っていない。** 作業フォルダの外にある `simple_shogi/CLAUDE.md` を読む許可が得られず、オーナーの指示で読まずに進めた（2026-10-23）。あとで読めるようになったときに足す。
- `src/style.css`・`e2e/smoke.spec.ts`・`README.md` は `simple_shogi` から写さず、設計書（GUI-0001・TD-0001）をもとに新しく書いた。`simple_shogi` の書き方と細部が違う所がありうる。
- `package.json` の `scripts` は `simple_shogi` から `check:dist`・`icons` を除き、`verify` を lint → test → build にした。これらのスクリプトは TASK-0002 で、対応するファイルと一緒に足す。
- `vite.config.ts` に PWA の設定はまだない（TASK-0002）。
- この PR の時点では CI がなかった（TASK-0003 で用意）ので、PR #9 の CI の結果はない。同じコードは、のちの PR #11 の CI（`check`・`e2e`）で通っている。
- Android の実機では確かめていない（AC-0003 §3）。

## 4. 後片付け

- 確認に使った開発用サーバーは止めた。スクリーンショット用の一時スクリプトは `test-results/`（Git の対象外）に置いた。

## 5. 完了定義のチェックリスト

- [ ] タスクの「やること」がすべてできている（やること 7 が未了。§3）
- [x] `npm ci`・`npm run lint`・`npm test`・`npm run build` が通る
- [x] `npm run dev` でタイトル画面の骨組み（暗い背景）が出る
- [x] `npm run test:e2e` が 2 つのプロジェクトで通る
- [ ] PR の CI が緑（CI は TASK-0003 から。PR #11 の CI で同じコードが通った）
- [x] 画面に関わる変更を、スクリーンショットで確かめた（375 × 667）
- [x] 設計と違う作りにしていない（設計書の修正なし）
- [x] PR がマージされた（PR #9）
