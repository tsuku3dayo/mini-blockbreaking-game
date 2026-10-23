---
id: MBRK-WS-0004
type: Workstream
title: 段階 3 中断・誤操作に強くする
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-EP-0001
  - MBRK-TD-0003
  - MBRK-TD-0004
verified: null
---

# WS-0004 段階 3 中断・誤操作に強くする

- 進め方・完了の定義は [WS-0001 §1](MBRK-WS-0001-workstream-ja.md) を参照。

## 目的

中断しても損をせず、誤操作で画面が進まないようにする。パソコンのキーボードでも遊べるようにする。

## ストーリー

US-0009 一時停止（9）、US-0011 誤操作防止（10）、US-0008 マウス・キーボード（11）。

## タスク

| TASK | 内容 | 対象 TC | 大きさ |
| --- | --- | --- | --- |
| [TASK-0011](MBRK-TASK-0011-implementation-task-ja.md) | 一時停止・再開・自動一時停止 | TC-0009 | M |
| [TASK-0012](MBRK-TASK-0012-implementation-task-ja.md) | 結果パネルの入力ガードと Enter の扱い | TC-0011 | S |
| [TASK-0013](MBRK-TASK-0013-implementation-task-ja.md) | キーボード操作とマウスの仕上げ | TC-0008 | M |

## 段階の終わりの確認（手動）

TC-0009-08（iPhone・Android）、TC-0008-10（パソコン）。
