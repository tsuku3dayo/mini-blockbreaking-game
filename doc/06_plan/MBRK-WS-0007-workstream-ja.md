---
id: MBRK-WS-0007
type: Workstream
title: 段階 6 アプリとして配る
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-EP-0001
  - MBRK-EP-0005
  - MBRK-TD-0001
verified: null
---

# WS-0007 段階 6 アプリとして配る

- 進め方・完了の定義は [WS-0001 §1](MBRK-WS-0001-workstream-ja.md) を参照。

## 目的

WS-0001 で用意した PWA の骨組みを仕上げ、インストール・オフライン・更新・起動失敗の復旧を E2E と実機で確かめる。

## ストーリー

US-0017 インストール（16）、US-0018 オフライン（17）、US-0019 更新（18）、US-0020 復旧（19）。

## タスク

| TASK | 内容 | 対象 TC | 大きさ |
| --- | --- | --- | --- |
| [TASK-0019](MBRK-TASK-0019-implementation-task-ja.md) | インストールとオフラインの仕上げ | TC-0017、TC-0018 | M |
| [TASK-0020](MBRK-TASK-0020-implementation-task-ja.md) | 更新の帯と起動失敗の復旧の仕上げ | TC-0019、TC-0020 | M |

## 段階の終わりの確認（手動）

TC-0017-05、TC-0018-04 を iPhone・Android で行う。TC-0019-04 は最初のアップデート時に行う（TST-0001 §8）。
