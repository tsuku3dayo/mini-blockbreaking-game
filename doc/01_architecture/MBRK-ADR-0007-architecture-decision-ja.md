---
id: MBRK-ADR-0007
type: Architecture Decision
title: アプリ識別子を mini-blockbreaking-game にする
status: stable
version: 1.1
updated: 2026-10-26
sources:
  - MBRK-PB-0001 §10
  - simple_shogi CLAUDE.md（同じサイトに載るアプリ）
  - doc/specification.md (v1.4) §8.6
verified: { by: "tsuku3dayo", at: "2026-10-26T09:30:40+09:00" }
---

# ADR-0007 アプリ識別子を mini-blockbreaking-game にする

## 状況

GitHub Pages では、同じアカウントのアプリはすべて同じサイト（`tsuku3dayo.github.io`）に載り、`localStorage`・Service Worker・キャッシュを共有する。`simple_shogi` のテンプレートでは、アプリ識別子（`package.json` の `name`）を、保存キーの接頭辞・バックアップの `app` 名・起動失敗時に消すキャッシュの範囲の 3 か所に使い、ほかのアプリと混ざらないようにしている。識別子を後から変えると、記録が引き継がれない。

## 決定

アプリ識別子は `mini-blockbreaking-game` とする。リポジトリ名（`tsuku3dayo/mini-blockbreaking-game`）・公開 URL のパスと同じにする。

- `package.json` の `name`：`mini-blockbreaking-game`
- 保存キー：`mini-blockbreaking-game-<名前>`
- バックアップの `app`：`mini-blockbreaking-game`
- バックアップのファイル名：`mini-blockbreaking-game-backup-YYYYMMDD.json`
- 表示名（manifest の `name`・`short_name`）：「ブロック崩しミニ」（v1.1 で「ブロック崩し」から変更。表示名は保存キーに使わないので、変えても記録は引き継がれる）

## 検討した選択肢

| 選択肢 | 良い点 | 悪い点 |
| --- | --- | --- |
| **A. `mini-blockbreaking-game`（採用）** | リポジトリ名・URL と一致して分かりやすい | 少し長い（使うのはコードの中だけ） |
| B. `breakout` | 短い | ほかのブロック崩しのアプリを作ったときにぶつかりやすい |

## 結果

- 公開後は変えない。変える必要が出たら、保存データの移行と合わせて新しい ADR で決める。
