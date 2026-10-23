---
id: MBRK-WS-0005
type: Workstream
title: 段階 4 記録を残す
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-EP-0001
  - MBRK-EP-0003
  - MBRK-TD-0004
verified: null
---

# WS-0005 段階 4 記録を残す

- 進め方・完了の定義は [WS-0001 §1](MBRK-WS-0001-workstream-ja.md) を参照。

## 目的

結果を名前つきで端末に保存し、ランキングで見比べられるようにする。

## ストーリー

US-0012 登録（12）、US-0013 ランキング（13）。

## タスク

| TASK | 内容 | 対象 TC | 大きさ |
| --- | --- | --- | --- |
| [TASK-0014](MBRK-TASK-0014-implementation-task-ja.md) | 保存とランキングの規則 | TC-0012・0013 の単体 | M |
| [TASK-0015](MBRK-TASK-0015-implementation-task-ja.md) | 結果パネルでのスコア登録 | TC-0012 の E2E、TC-0011 の登録の部分 | M |
| [TASK-0016](MBRK-TASK-0016-implementation-task-ja.md) | ランキング画面 | TC-0013 の E2E | M |

## 段階の終わりの確認（手動）

TC-0012-16（パソコン）。iPhone・Android で、登録 → ランキング → アプリを閉じて開き直しても残っていることを確かめる。
