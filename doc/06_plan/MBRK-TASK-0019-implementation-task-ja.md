---
id: MBRK-TASK-0019
type: Implementation Task
title: インストールとオフラインの仕上げ
status: stable
version: 1.1
updated: 2026-10-25
sources:
  - MBRK-WS-0007
  - MBRK-TD-0001
  - MBRK-GUI-0006
  - MBRK-US-0017
  - MBRK-US-0018
verified: null
---

# TASK-0019 インストールとオフラインの仕上げ

- WS：[MBRK-WS-0007](MBRK-WS-0007-workstream-ja.md)　順番：19　大きさ：M
- ブランチ：`feat/0019-install-offline`
- 依存：TASK-0025（仕様書 v1.2 の修正の WS-0009 を先に行う）
- 対象のストーリー：US-0017、US-0018
- 対象のテストケース：TC-0017-01〜04、TC-0018-01〜03、TC-0017-05・TC-0018-04（手動、段階の終わり）

## やること

1. インストール方法のダイアログの文言・今の端末の判定・「今すぐインストール」・インストール済みで入口を隠す（GUI-0006 §1）を確かめ、足りない所を直す。
2. オフラインで全画面が動くこと（Service Worker のキャッシュ対象）を確かめる。外部のリソースがないことを確かめる。
3. `e2e/pwa.spec.ts`（TC-0017-01〜03、TC-0018-01〜03）。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る
- [ ] WS-0001 §1.3 の共通の完了の定義
