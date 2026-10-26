---
id: MBRK-WS-0008
type: Workstream
title: 段階 7 仕上げとリリース
status: stable
version: 1.2
updated: 2026-10-26
sources:
  - MBRK-EP-0001
  - MBRK-EP-0002
  - MBRK-EP-0003
  - MBRK-TST-0001
verified: null
---

# WS-0008 段階 7 仕上げとリリース

- 進め方・完了の定義は [WS-0001 §1](MBRK-WS-0001-workstream-ja.md) を参照。

## 目的

記録のバックアップと、読み上げ・キーボードでの使いやすさを仕上げ、全体の手動テストをして v1.0.0 を公開する。

## ストーリー

US-0014 バックアップ（20）、US-0021 アクセシビリティ（21）、US-0023 クレジット（23、仕様書 v1.3 で追加）。非機能（TC-0022）。

## タスク

| TASK | 内容 | 対象 TC | 大きさ |
| --- | --- | --- | --- |
| [TASK-0021](MBRK-TASK-0021-implementation-task-ja.md) | 記録の書き出し・読み込み | TC-0014 | M |
| [TASK-0022](MBRK-TASK-0022-implementation-task-ja.md) | 読み上げ・キーボード操作の仕上げ | TC-0021 | M |
| [TASK-0023](MBRK-TASK-0023-implementation-task-ja.md) | リリース v1.0.0（全体の手動テスト・README・公開） | TC-0022、全 TC の手動 | M |
| [TASK-0026](MBRK-TASK-0026-implementation-task-ja.md) | クレジット画面（v1.0.0 の公開のあと、全体の手動テストの前に足す。版は 1.0.0 のまま） | TC-0024 | S |
| [TASK-0027](MBRK-TASK-0027-implementation-task-ja.md) | アプリの名前を「ブロック崩しミニ」にする（全体の手動テストのあと、仕様書 v1.4 で足す。版は 1.0.0 のまま） | TC-0001・0017・0021・0024 の該当の確認 | S |

## 段階の終わりの確認（手動）

TASK-0023 で、全テストケースの手動の確認（TC-0019-04 を除く）をまとめて行う。TASK-0026（クレジット画面）を公開し直してから行い、TC-0024-07 も含める。TASK-0027（名前の変更）は全体の手動テストのあとに足したので、公開し直したあと、名前に関わる所（TC-0017-05、見出し・ページタイトル）だけを実機でもう一度確かめる。
