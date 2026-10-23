---
id: MBRK-AC-0002
type: Attested Computation
title: PWA の骨組みの実施記録
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-TASK-0002
  - MBRK-TC-0017
  - MBRK-TC-0019
  - MBRK-TC-0020
verified: { by: "tsuku3dayo", at: "2026-10-23T18:34:10+09:00" }
---

# AC-0002 PWA の骨組みの実施記録

## 1. 実施概要

| 項目 | 内容 |
| --- | --- |
| タスク | [MBRK-TASK-0002](../06_plan/MBRK-TASK-0002-implementation-task-ja.md) PWA の骨組み |
| テストケース | TC-0017-04、TC-0019-01・02、TC-0020-05 |
| 実施者 | Claude Code（Opus 5.5） |
| 環境 | Windows 11 Pro、Node.js 24.0.0、Vite 8.3.5、vite-plugin-pwa 2.0.0、Playwright（Chrome for Testing 156） |
| ブランチ | `feat/0002-pwa-base` |

## 2. 確認結果（自動テスト・2026-10-23）

| 確認 ID | 種類 | 結果 |
| --- | --- | --- |
| TC-0017-04 | ビルド検査（`npm run check:dist`） | 成功：manifest（name・standalone・start_url・orientation: portrait）、アイコン 192・512・maskable 512、apple-touch-icon、`sw.js`、インストール方法の入口 |
| TC-0019-01 | E2E（`e2e/pwa.spec.ts`） | 成功（pixel7・small）：`#version` が `0.1.0`、表示は `v0.1.0` |
| TC-0019-02 | ビルド検査 | 成功：`#version` がある |
| TC-0020-05 | ビルド検査 | 成功：`boot.js` があり index.html が読み込む、`app-id` が `mini-blockbreaking-game`、`boot.js` が `__appStarted` を見る、`#boot-error` がある |

そのほか：

- `npm run verify`（lint → test → build → check:dist）：成功
- `npm run test:e2e`：4 件成功（TC-0019-01 と仮のテストを、それぞれ 2 つのプロジェクトで）
- `npm run preview` で、375 × 667・Android の UA でタイトル画面を開き、次をスクリーンショットと画面の状態で確かめた
  - タイトルにインストール方法の入口と `v0.1.0` が出る
  - 入口を押すとダイアログが開き、Android の項目が最初から開いている。「閉じる」で閉じる
  - Service Worker が登録される
- アイコン（512・maskable）を画像で確かめた。maskable は図柄を中央の 70% に収めた

PR #10 は、2026-10-23 18:21 にオーナーが Sourcetree でマージした。

### 2.1 手動の確認（WS-0001 の終わり、2026-10-23）

公開 URL で、オーナーがパソコン（Chrome）と iPhone（Safari）で開き、インストール方法の入口と `v0.1.0` が出ること、ダイアログが開いて今の端末の項目が開いていることを目で確かめた（OK）。詳しくは [MBRK-AC-0003](MBRK-AC-0003-attested-computation-ja.md) §2.2。

## 3. 確認できなかったこと

- **`simple_shogi` から流用するはずの `public/boot.js`・`src/pwa.ts`・`src/install.ts`・`scripts/check-dist.mjs`・`scripts/make-icons.mjs` は、`simple_shogi` を読まずに、設計書（TD-0001・GUI-0006・US-0020・TC-0017/0019/0020）をもとに新しく書いた**（オーナーの指示、2026-10-23）。`simple_shogi` と動きの細部が違う所がありうる。
  - `boot.js`：読み込みが終わってから 8 秒（`window.__bootWaitMs` で変えられる）たっても起動しなければ失敗とみなす。消すのは、範囲（scope）がこのアプリの URL で始まる Service Worker と、名前にこのアプリの URL を含むキャッシュ（Workbox の名前の付け方による）。
- 起動失敗からの復旧の動き（TC-0020-01〜04）は、まだ E2E で確かめていない（TASK-0020）。
- 更新の帯（TC-0019-03・04）、「今すぐインストール」（TC-0017-03）は、まだ確かめていない（TASK-0019・0020）。
- `npm run build` で「`<script src="./boot.js">` は `type="module"` がないのでまとめられない」という注意が出る。`boot.js` はわざとビルドを通さずそのまま配信するので、問題はない。
- この PR の時点では CI がなかった（TASK-0003 で用意）。同じコードは、のちの PR #11 の CI（`check`・`e2e`）で通っている。
- Android の実機では確かめていない（AC-0003 §3）。実機でのインストール（TC-0017-05）は TASK-0019 で行う。

## 4. 後片付け

- 確認に使った preview のサーバーは止めた。スクリーンショット用の一時スクリプトは `test-results/`（Git の対象外）に置いた。

## 5. 完了定義のチェックリスト

- [x] タスクの「やること」がすべてできている（流用ではなく新しく書いた。§3）
- [x] `npm run verify`（lint → test → build → check:dist）が通る
- [x] TC-0017-04、TC-0019-01・02、TC-0020-05 が通る
- [x] `npm run preview` でインストール方法のダイアログが開く
- [ ] PR の CI が緑（CI は TASK-0003 から。PR #11 の CI で同じコードが通った）
- [x] 画面に関わる変更を、スクリーンショットで確かめた（375 × 667）
- [x] 設計と違う作りにしていない（設計書の修正なし）
- [x] PR がマージされた（PR #10）
