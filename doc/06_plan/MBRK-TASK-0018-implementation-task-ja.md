---
id: MBRK-TASK-0018
type: Implementation Task
title: 効果音のオン / オフ
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-WS-0006
  - MBRK-TD-0005
  - MBRK-GUI-0002
  - MBRK-GUI-0003
  - MBRK-US-0016
verified: null
---

# TASK-0018 効果音のオン / オフ

- WS：[MBRK-WS-0006](MBRK-WS-0006-workstream-ja.md)　順番：18　大きさ：S
- ブランチ：`feat/0018-sound-toggle`
- 依存：TASK-0017
- 対象のストーリー：US-0016
- 対象のテストケース：TC-0016-01・03〜08、TC-0016-02（手動、段階の終わり）

## やること

1. 効果音ボタンをタイトル画面と操作欄に置く（GUI-0002・GUI-0003：文字・アイコン・`aria-pressed`）。2 つの表示をそろえる。
2. `sound.ts`：`setEnabled`（保存、オフで `stopAll`）、起動時に設定を読む（TD-0005 §4）。
3. 操作欄のボタンを押してもゲームを止めず、Canvas にフォーカスを戻す。
4. `e2e/sound.spec.ts` に足す。

## 完了の条件

- [ ] TC-0016-01・03〜08 が通る
- [ ] WS-0001 §1.3 の共通の完了の定義
