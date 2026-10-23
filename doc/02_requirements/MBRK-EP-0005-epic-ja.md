---
id: MBRK-EP-0005
type: Epic
title: アプリとしてインストールし、オフラインでも使う
status: review
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-PB-0001
  - MBRK-SA-0001
  - MBRK-ADR-0002
  - doc/specification.md (v1.1) §8.6
verified: null
---

# EP-0005 アプリとしてインストールし、オフラインでも使う

## 目的

ホーム画面に追加して、普通のアプリのように開け、電波がなくても遊べるようにする。新しい版は利用者のタイミングで取り込め、起動の不具合からも自動で立ち直れるようにする。

## 範囲

- インストール可能な PWA（manifest・アイコン）とインストール方法の説明
- オフライン動作（Service Worker のキャッシュ）
- 「更新」ボタンによる更新、バージョン表示
- 起動失敗からの復旧

## ユーザーストーリー

| ID | ストーリー | 優先度 |
| --- | --- | --- |
| [MBRK-US-0017](MBRK-US-0017-user-story-ja.md) | ホーム画面に追加して開く | P3 |
| [MBRK-US-0018](MBRK-US-0018-user-story-ja.md) | 電波がなくても遊ぶ | P3 |
| [MBRK-US-0019](MBRK-US-0019-user-story-ja.md) | 新しい版に自分のタイミングで更新する | P3 |
| [MBRK-US-0020](MBRK-US-0020-user-story-ja.md) | 起動できなくなっても自動で直る | P3 |

優先度の意味は [EP-0001](MBRK-EP-0001-epic-ja.md) と同じ。

## 仕様書 §12 との対応

| 受け入れ基準 | ストーリー |
| --- | --- |
| §12.7 の 4〜6 項目目（バージョンと入口・オフライン・更新） | US-0017、US-0018、US-0019 |

## 完了の条件

- 上のストーリーがすべて完了している。
- `npm run check:dist` が通る。
- 公開 URL から iPhone と Android の実機にインストールし、機内モードで起動して遊べる（手動テスト）。
