---
id: MBRK-GUI-0007
type: GUI Design
title: クレジット画面
status: review
version: 1.1
updated: 2026-10-29
sources:
  - MBRK-GUI-0001
  - MBRK-US-0023
  - doc/specification.md (v1.5) §8、§8.8
verified: null
---

# GUI-0007 クレジット画面

## 1. 画面の形（幅 375）

```
┌─────────────────────────────────────┐
│ [← BACK]  クレジット                 │ ← 上部のバー（GUI-0001 §5.4）
│                                     │
│              PRODUCER               │ ← 役職（--muted、14、字間 0.08em）
│           つくだ よしはる           │ ← 名前（--text、18、太字）
│                                     │ ← 役職ごとの間 24
│              DIRECTOR               │
│           つくだ よしはる           │
│                                     │
│            GAME DESIGNER            │
│           つくだ よしはる           │
│                                     │
│          GRAPHIC DESIGNER           │
│             CLAUDE CODE             │
│                                     │
│            SOUND CREATOR            │
│             CLAUDE CODE             │
│                                     │
│             PROGRAMMER              │
│             CLAUDE CODE             │
└─────────────────────────────────────┘
```

内容が画面の高さに収まらない場合は、縦にスクロールする。

## 2. 要素

| 要素 | 内容・振る舞い | ストーリー |
| --- | --- | --- |
| BACK | 普通のボタン（arrow-left +「BACK」）。タイトル画面へ。Esc でも同じ | US-0023 |
| 見出し | `h2`「クレジット」。`tabindex="-1"` で初期フォーカス | US-0023 |
| クレジットの一覧 | 定義リスト（`dl`）。役職は `dt`（`--muted`、14、字間 0.08em）、名前は `dd`（`--text`、18、太字）。すべて中央揃え。役職ごとに間 24 | US-0023 |

- 役職と名前は仕様書 §8.8 の表のとおり、`index.html` に文字として書く（画像にしない）。
- 長い名前は折り返す（横スクロールを出さない）。

## 3. キー操作

| キー | 動き |
| --- | --- |
| Esc | タイトル画面へ（BACK と同じ） |
| Tab | BACK だけ（ほかに押せる部品はない） |

## 4. 読み上げ

- `section` に `aria-labelledby` で見出しを結ぶ。
- 役職と名前は `dt`・`dd` の組で、「PRODUCER、つくだ よしはる」のように読める。
