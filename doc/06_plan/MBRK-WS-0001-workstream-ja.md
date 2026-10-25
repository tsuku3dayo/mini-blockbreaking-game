---
id: MBRK-WS-0001
type: Workstream
title: 段階 0 土台（プロジェクト・CI・公開・PWA の骨組み）
status: stable
version: 1.2
updated: 2026-10-25
sources:
  - MBRK-EP-0001（優先順位）
  - MBRK-TD-0001
  - MBRK-TST-0001
verified: null
---

# WS-0001 段階 0 土台

## 1. 作業計画の全体

実装は 8 つのワークストリーム（WS）に分け、WS-0001 から順に進める。仕様書 v1.2（2026-10-25）の修正のため WS-0009 を足し、WS-0006 と WS-0007 の間に行う。WS-0002〜0008 は EP-0001 の「優先順位」の段階 1〜7 にあたる。WS-0001 は、段階 1 の前に用意する土台（EP-0001 の注記：「PWA・CI・公開の土台は最初に用意する」）。

| WS | 段階 | ストーリー | タスク |
| --- | --- | --- | --- |
| **WS-0001** | 0 土台 | — | TASK-0001〜0003 |
| [WS-0002](MBRK-WS-0002-workstream-ja.md) | 1 ゲームの芯 | US-0002〜0005 | TASK-0004〜0006 |
| [WS-0003](MBRK-WS-0003-workstream-ja.md) | 2 スマホで最後まで遊べる | US-0010、0007、0001、0006 | TASK-0007〜0010 |
| [WS-0004](MBRK-WS-0004-workstream-ja.md) | 3 中断・誤操作に強くする | US-0009、0011、0008 | TASK-0011〜0013 |
| [WS-0005](MBRK-WS-0005-workstream-ja.md) | 4 記録を残す | US-0012、0013 | TASK-0014〜0016 |
| [WS-0006](MBRK-WS-0006-workstream-ja.md) | 5 効果音 | US-0015、0016 | TASK-0017〜0018 |
| [WS-0009](MBRK-WS-0009-workstream-ja.md) | 5.5 修正（仕様書 v1.2） | US-0007・0010（v1.1）、US-0022 | TASK-0024〜0025 |
| [WS-0007](MBRK-WS-0007-workstream-ja.md) | 6 アプリとして配る | US-0017〜0020 | TASK-0019〜0020 |
| [WS-0008](MBRK-WS-0008-workstream-ja.md) | 7 仕上げとリリース | US-0014、0021、0023、非機能 | TASK-0021〜0023、0026 |

### 1.1 タスクの進め方（全 WS 共通）

1. タスクごとに作業ブランチ `feat/<TASK 番号>-<内容>`（例：`feat/0004-collision`）を切る。
2. テストケースの確認 ID を名前に付けたテストを書き、実装し、`npm run verify` と `npm run test:e2e` を通す。
3. PR を作り、CI が緑なのを確かめて `main` にマージする（GitHub Pages に自動で公開される）。
4. タスクの attested-computation（`MBRK-AC-<TASK と同じ番号>`）を `status: draft` で作り、自動テストの結果を書く。

### 1.2 段階の終わり（全 WS 共通）

1. WS のタスクがすべてマージされたら、公開 URL で、その WS のストーリーの手動テストを行う（オーナーが実機で操作し、Claude Code が手順を案内して結果を記録する）。
2. 結果を、各タスクの AC の「確認結果」「確認できなかったこと」に書き、`status: review` にする。
3. オーナーが AC を承認したら `status: stable`・`verified` を記入し、PR でマージする（承認ゲート）。
4. 承認を受けてから次の WS に進む。

### 1.3 タスクの完了の定義（全タスク共通）

- [ ] タスクの「やること」がすべてできている
- [ ] 対象のテストケースの単体・E2E が、確認 ID を名前に付けて書かれ、通っている
- [ ] `npm run verify` と `npm run test:e2e` が手元で通り、PR の CI が緑
- [ ] 画面に関わる変更は、`npm run dev` で動かしてスクリーンショットで確かめた（スマホの幅・iPhone SE の大きさ）
- [ ] 設計と違う作りにしたときは、該当の設計書（TD・GUI）を直した（承認済みの GUI は再承認を受ける）
- [ ] PR がマージされ、AC（draft）を作った

## 2. この WS の目的

`simple_shogi` から土台を流用して、テスト・CI・公開・PWA の検査が通る「空のアプリ」を作り、公開 URL で開けるようにする。以後のタスクは、すべてこの上に積む。

## 3. タスク

| TASK | 内容 | 大きさ |
| --- | --- | --- |
| [TASK-0001](MBRK-TASK-0001-implementation-task-ja.md) | プロジェクトの土台（ビルド・型・Lint・テストの設定、画面の骨組み、色の変数） | M |
| [TASK-0002](MBRK-TASK-0002-implementation-task-ja.md) | PWA の骨組み（manifest・アイコン・Service Worker・起動の見張り・インストール方法・バージョン・PWA 検査） | M |
| [TASK-0003](MBRK-TASK-0003-implementation-task-ja.md) | CI と GitHub Pages への公開 | S |

大きさ：S = 半日程度、M = 1 日程度、L = 2 日程度（目安）。

## 4. 段階の終わりの確認

- 公開 URL（https://tsuku3dayo.github.io/mini-blockbreaking-game/）を iPhone・Android・パソコンで開いて、タイトル画面の骨組みとバージョンが出ること。
- この WS にはストーリーがないので、手動テストは上の確認だけ。結果は TASK-0003 の AC に書く。
