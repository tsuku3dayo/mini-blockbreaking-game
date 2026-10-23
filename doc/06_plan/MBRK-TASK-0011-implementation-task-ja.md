---
id: MBRK-TASK-0011
type: Implementation Task
title: 一時停止・再開・自動一時停止
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0004
  - MBRK-TD-0003
  - MBRK-GUI-0003
  - MBRK-US-0009
verified: null
---

# TASK-0011 一時停止・再開・自動一時停止

- WS：[MBRK-WS-0004](MBRK-WS-0004-workstream-ja.md)　順番：11　大きさ：M
- ブランチ：`feat/0011-pause`
- 依存：TASK-0010
- 対象のストーリー：US-0009
- 対象のテストケース：TC-0009-01〜07、TC-0009-08（手動、段階の終わり）

## やること

1. 操作欄の一時停止ボタン（GUI-0003 §2.3：文字・アイコン・`aria-pressed`・押せる場面）。押したあと Canvas にフォーカスを戻す。
2. `play.ts`：一時停止・再開の処理（TD-0003 §1）、`visibilitychange` での自動一時停止、再開で発射要求を捨てて蓄積をやり直す。
3. P・Esc（`repeat` を無視）。このタスクでは P・Esc と Space だけを `input.ts` のキーボードに入れる（左右キーは TASK-0013）。
4. 一時停止の幕の描画（TD-0003 §4）。
5. `e2e/pause.spec.ts`（`page.clock` を使う）。

## 完了の条件

- [ ] TC-0009-01〜07 が通る
- [ ] WS-0001 §1.3 の共通の完了の定義
