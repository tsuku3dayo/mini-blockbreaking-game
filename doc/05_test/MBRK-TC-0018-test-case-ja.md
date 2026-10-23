---
id: MBRK-TC-0018
type: Test Case
title: 電波がなくても遊ぶ
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-US-0018
  - MBRK-TD-0001
verified: null
---

# TC-0018 電波がなくても遊ぶ

- 対象：[MBRK-US-0018](../02_requirements/MBRK-US-0018-user-story-ja.md)
- テストファイル：`e2e/pwa.spec.ts`

| 確認 ID | 確かめること | 種類 | 手順・入力 | 期待結果 |
| --- | --- | --- | --- | --- |
| TC-0018-01 | オフラインで全機能（§12.7-5） | E2E | 開いて Service Worker の準備を待つ → `context.setOffline(true)` → 読み込み直す → START → `?debug` で終わらせて登録 → ランキング | タイトルが出る。遊べる。登録できる。ランキングに出る |
| TC-0018-02 | 外部のリソースを読まない（§8.6） | E2E | 全画面を回る間の `request` をすべて記録 | 全部が同じオリジン（`localhost:4173`） |
| TC-0018-03 | 外部へ送らない（§1.2） | E2E | 同上 | `GET` 以外のリクエストがない |
| TC-0018-04 | 実機の機内モード | 手動 | インストールしたアプリを一度開く → 機内モード → アプリを終了して開き直す → 1 ゲーム遊んで登録 | すべてできる |
