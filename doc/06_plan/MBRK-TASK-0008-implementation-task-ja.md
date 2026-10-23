---
id: MBRK-TASK-0008
type: Implementation Task
title: 指の操作の仕上げ
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0003
  - MBRK-TD-0003
  - MBRK-US-0007
verified: null
---

# TASK-0008 指の操作の仕上げ

- WS：[MBRK-WS-0003](MBRK-WS-0003-workstream-ja.md)　順番：8　大きさ：M
- ブランチ：`feat/0008-touch`
- 依存：TASK-0007
- 対象のストーリー：US-0007
- 対象のテストケース：TC-0007-01〜07、TC-0007-08（手動、段階の終わり）

## やること

1. `input.ts`：`setPointerCapture`、最初の指だけを使う、領域の外で押したら追従しない、`pointercancel` / `lostpointercapture`、`blur` で追従をやめる（TD-0003 §3.3・§3.6）。リスナーを `AbortController` でまとめて外す。
2. Canvas の CSS（`touch-action: none` など）と `contextmenu` の抑止。
3. `e2e/touch.spec.ts`。タッチの `PointerEvent` を送る小物を `e2e/helpers.ts` に足す。

## 完了の条件

- [ ] TC-0007-01〜07 が両プロジェクトで通る
- [ ] WS-0001 §1.3 の共通の完了の定義
