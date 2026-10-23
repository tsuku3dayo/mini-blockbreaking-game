---
id: MBRK-TASK-0014
type: Implementation Task
title: 保存とランキングの規則
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0005
  - MBRK-TD-0004
  - MBRK-ADR-0006
  - MBRK-US-0012
  - MBRK-US-0013
verified: null
---

# TASK-0014 保存とランキングの規則

- WS：[MBRK-WS-0005](MBRK-WS-0005-workstream-ja.md)　順番：14　大きさ：M
- ブランチ：`feat/0014-storage-ranking`
- 依存：TASK-0013
- 対象のストーリー：US-0012、US-0013
- 対象のテストケース：TC-0012-01・03・04・06・07・09・13、TC-0013-01・05（`rankLabel`）

## やること

1. `src/storage.ts`：`load`・`tryLoad`・`save`（成否を返す）・`saveAll`（元に戻す）・`migrateStorage`・`requestPersist`（TD-0004 §1）。`simple_shogi` の `storage.ts` を土台にする。
2. `src/ranking.ts`：`normalizeName`・`countChars`・`validateName`・`validateScore`・`validateRecord`・`compareRecords`・`rankOf`・`addRecord`（TD-0004 §2）。
3. `src/records.ts`：`loadRanking`・`register`・`loadLastName`（TD-0004 §3）。
4. `src/format.ts` に `rankLabel` を足す。
5. テスト：`tests/storage.test.ts`（偽の localStorage・失敗する偽物）、`tests/ranking.test.ts`、`tests/records.test.ts`。
6. `main.ts` の起動の手順に `migrateStorage()`・`requestPersist()` を足す（TD-0001 §8）。

## 完了の条件

- [ ] 上の確認 ID のテストがすべて通る
- [ ] WS-0001 §1.3 の共通の完了の定義
