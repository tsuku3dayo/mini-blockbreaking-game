# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

スマートフォン向けのブロック崩し（PWA、サーバーなし）。仕様は `doc/specification.md`、目的・範囲は `doc/00_brief/MBRK-PB-0001-project-brief-ja.md`。

## 基本方針

- ユーザー向けの文言・説明・成果物は日本語。
- 技術構成と共通ルールは `C:\Users\はる\Documents\Git\simple_shogi` の `CLAUDE.md` と同じにする（詳細は 01 システム構成の成果物で決める）。

## 開発フロー

`doc/InputOutput_Text.txt` の順に進める。**「承認」の地点では、オーナーが承認するまで次の段階に進まない。** 成果物を作ったら、承認を求めて止まる。

00 project-brief → 01 システム構成（承認）→ 02 要件・ユーザーストーリー（承認）→ 03 画面設計（承認）→ 04 詳細設計 → 05 テスト / 06 作業計画（並行）→ 07 実装・自動テスト → 手動テスト（承認）→ attested-computation（承認）

## 成果物の書式

### ID とファイル名

- ID は `MBRK-<種類>-<4 桁の通し番号>`（例：`MBRK-US-0001`）。通し番号は種類ごとに 0001 から振り、欠番を再利用しない。
- ファイル名は `<ID>-<種類名>-ja.md`（例：`MBRK-US-0001-user-story-ja.md`）。

| 種類名 | ID の種類 | フォルダ |
| --- | --- | --- |
| project-brief | PB | `doc/00_brief/` |
| system-architecture | SA | `doc/01_architecture/` |
| technology-stack | TS | `doc/01_architecture/` |
| architecture-decision | ADR | `doc/01_architecture/` |
| epic | EP | `doc/02_requirements/` |
| user-story | US | `doc/02_requirements/` |
| gui-design | GUI | `doc/03_gui/` |
| technical-design | TD | `doc/04_design/` |
| test-strategy | TST | `doc/05_test/` |
| test-case | TC | `doc/05_test/` |
| workstream | WS | `doc/06_plan/` |
| implementation-task | TASK | `doc/06_plan/` |
| attested-computation | AC | `doc/07_attested/` |

### frontmatter

```yaml
---
id: MBRK-US-0001
type: User Story            # 種類名を英語の見出し形で
title: 〜                    # 日本語の短い名前
status: draft               # draft（作成中）→ review（承認待ち）→ stable（承認済み）
version: 1.0
updated: 2026-10-23
sources:                    # 根拠にした成果物の ID・資料
  - MBRK-EP-0001
verified: null              # 承認されたら { by: "tsuku3dayo", at: "<日時（ISO 8601、+09:00）>" }
---
```

- 承認を求めるときは `status: review` にする。オーナー（`tsuku3dayo`）がチャットで承認したら `status: stable` にし、`verified` に承認者 `tsuku3dayo` と承認日時を記入する。
- 承認後に中身を変えるときは `version` を上げ、`status` を `review` に戻して再承認を受ける。

### attested-computation

- 説明は `doc/Attested_Computation.md`。implementation-task（何をやるか）・test-case（どう確かめるか）に対する「実際にやって確かめた結果」。
- 本文：実施概要（タスク・実施者・環境）／確認結果（テストケースの手順ごと）／**確認できなかったこと**（正直に書く）／後片付け／完了定義のチェックリスト。
- `sources` に対応する TASK と TC の ID を書く。
