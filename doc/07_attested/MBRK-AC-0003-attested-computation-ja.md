---
id: MBRK-AC-0003
type: Attested Computation
title: CI と GitHub Pages への公開の実施記録
status: review
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-TASK-0003
  - MBRK-WS-0001
verified: null
---

# AC-0003 CI と GitHub Pages への公開の実施記録

## 1. 実施概要

| 項目 | 内容 |
| --- | --- |
| タスク | [MBRK-TASK-0003](../06_plan/MBRK-TASK-0003-implementation-task-ja.md) CI と GitHub Pages への公開 |
| テストケース | なし（CI が緑になり、公開 URL が開くことで確かめる）。WS-0001 §4 の段階の終わりの確認を含む |
| 実施者 | 自動テスト・公開：Claude Code（Opus 5.5）／ Pages の設定・マージ・実機の確認：オーナー（tsuku3dayo） |
| 環境 | GitHub Actions（ubuntu-latest、Node.js 24）、GitHub Pages ／ 実機：パソコン（Chrome）、iPhone（Safari） |
| PR | #11（`feat/0003-ci-pages`）、2026-10-23 18:26 にマージ |

## 2. 確認結果

### 2.1 自動テスト・公開（2026-10-23）

| 確認 | 結果 |
| --- | --- |
| PR #11 の CI：`check`（`npm run verify`） | 成功（19 秒） |
| PR #11 の CI：`e2e`（pixel7・small） | 成功（44 秒） |
| `main` へのマージ後の `test` | 成功 |
| `main` へのマージ後の `pages`（build → check:dist → 公開） | 成功 |
| 公開 URL（https://tsuku3dayo.github.io/mini-blockbreaking-game/） | HTTP 200。`app-id` が `mini-blockbreaking-game`、manifest と `boot.js` を読み込む。375 × 667 で開き、タイトル画面の骨組みと `v0.1.0` が出ること、Service Worker がこのアプリの範囲で登録されることを確かめた |

### 2.2 段階の終わりの確認（WS-0001 §4、手動、2026-10-23）

オーナーが公開 URL を開いて、目で確かめた。

| 端末 | ブラウザ | 結果 |
| --- | --- | --- |
| パソコン | Chrome | OK |
| iPhone | Safari | OK |
| Android | — | 未実施（§3） |

確かめた内容：暗い背景に「BREAKOUT」・5 色の飾り・START・RANKING、インストール方法の入口と `v0.1.0`、横スクロールがないこと、インストール方法のダイアログが開いて今の端末の項目が開いていること。

## 3. 確認できなかったこと

- **Android の実機では確かめていない。** Android（Pixel 7 の設定）での表示は、E2E（`pixel7` プロジェクト）とスクリーンショットでだけ確かめた。
- ワークフロー（`test.yml`・`pages.yml`・`dependabot.yml`）は、`simple_shogi` から写さずに TD-0001 §6 をもとに新しく書いた（オーナーの指示、2026-10-23）。
- `pages` の公開で「`actions/deploy-pages@v4` は Node.js 20 向けで、Node.js 24 で動かしている（Node.js 20 は非推奨）」という注意が出た。公開は成功している。Dependabot の PR（#12〜#16）で Actions の版を上げると消える見込み。
- Dependabot の PR #17（TypeScript 7、@types/node 26）は CI が失敗している。扱いはオーナーと決める。

## 4. 後片付け

- 確認に使った一時スクリプトは `test-results/`（Git の対象外）に置いた。

## 5. 完了定義のチェックリスト

- [x] タスクの「やること」がすべてできている（Pages の Source の設定はオーナーが手動で行った）
- [x] PR の CI（`check` と `e2e` のジョブ）が緑
- [x] `main` へのマージで `pages` のワークフローが成功し、公開 URL が開く
- [ ] 公開 URL でタイトル画面の骨組みと `v0.1.0` が出る（iPhone・Android・パソコン）：iPhone・パソコンは OK、Android は未実施
- [x] PR がマージされ、AC を作った
