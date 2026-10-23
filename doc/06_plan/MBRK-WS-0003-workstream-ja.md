---
id: MBRK-WS-0003
type: Workstream
title: 段階 2 スマホで最後まで遊べる
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-EP-0001
  - MBRK-TD-0001
  - MBRK-TD-0003
  - MBRK-TD-0004
verified: null
---

# WS-0003 段階 2 スマホで最後まで遊べる

- 進め方・完了の定義は [WS-0001 §1](MBRK-WS-0001-workstream-ja.md) を参照。

## 目的

スマートフォンで、タイトル → 指で遊ぶ → 結果 → もう一度、が通しでできるようにする。

## ストーリー

US-0010 画面サイズ（5）、US-0007 指の操作（6）、US-0001 タイトル（7）、US-0006 結果（8）。

## タスク

| TASK | 内容 | 対象 TC | 大きさ |
| --- | --- | --- | --- |
| [TASK-0007](MBRK-TASK-0007-implementation-task-ja.md) | 表示サイズと高密度画面 | TC-0010 | M |
| [TASK-0008](MBRK-TASK-0008-implementation-task-ja.md) | 指の操作の仕上げ | TC-0007 | M |
| [TASK-0009](MBRK-TASK-0009-implementation-task-ja.md) | タイトル画面と画面の切替え | TC-0001 | M |
| [TASK-0010](MBRK-TASK-0010-implementation-task-ja.md) | 結果パネル（表示とボタン） | TC-0006 | M |

## 段階の終わりの確認（手動）

TC-0007-08、TC-0010-09 を、iPhone・Android の実機で行う。あわせて、タイトル → 遊ぶ → 結果 → RETRY / TITLE が途切れずにできることを確かめる。
