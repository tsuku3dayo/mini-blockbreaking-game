---
id: MBRK-TD-0005
type: Technical Design
title: 効果音
status: stable
version: 1.1
updated: 2026-10-25
sources:
  - MBRK-TD-0001
  - MBRK-TD-0002
  - MBRK-ADR-0005
  - MBRK-US-0015
  - MBRK-US-0016
  - doc/specification.md (v1.1) §8.7、§10
verified: null
---

# TD-0005 効果音

対象のファイルは `sound-plan.ts`（ロジック層）と `sound.ts`（画面層）。

## 1. 鳴らす音を決める（`sound-plan.ts`）

```ts
export type SoundName = 'launch' | 'paddle' | 'wall' | 'block' | 'speedUp' | 'clear' | 'gameOver' | 'register';
export interface PlannedSound { name: SoundName; row?: number }   // row は block のときだけ（0 = 最上段）

/** 1 フレームの出来事から、鳴らす音の一覧を返す（仕様書 §8.7 の規則） */
export function planSounds(events: GameEvent[]): PlannedSound[];
```

- `clear` か `gameOver` があれば、それだけを返す。
- それ以外は、種類ごとに 1 回だけ、`launch` → `paddle` → `wall` → `block` → `speedUp` の順に返す。
- `block` の `row` は、そのフレームで最初に起きた `block` の出来事の代表ブロックの行。
- `register` はゲームの出来事ではないので、`planSounds` を通さず結果パネルから直接鳴らす。

## 2. 音の作り（`sound.ts`）

オシレーター 1 つと音量の包絡（立ち上がり 5 ms、指数で減衰）で 1 音を作る。複数の音は時間をずらして並べる。全体の音量は主音量のゲイン 0.25 を通す。

| 音 | 波形 | 音の高さ（Hz）と長さ |
| --- | --- | --- |
| `launch` | square | 440 → 880 へ 80 ms で上げる |
| `paddle` | triangle | 330、70 ms |
| `wall` | square | 1200、25 ms（音量 0.4 倍） |
| `block` | square | 行 0〜4 の順に 1047 / 880 / 784 / 659 / 523、60 ms |
| `speedUp` | square | 660 → 990、各 60 ms |
| `clear` | triangle | 523 → 659 → 784 → 1047、各 120 ms（最後は 300 ms） |
| `gameOver` | sawtooth | 392 → 330 → 262、各 200 ms（最後は 400 ms） |
| `register` | triangle | 784 → 1047、各 80 ms |

音の高さと長さは、手動テストで聞いて調整してよい（この表が正しい値の基準ではない）。

## 3. 再生の仕組み

```ts
export interface Sound {
  enabled: boolean;
  setEnabled(on: boolean): void;   // 保存もする。オフにしたら stopAll()
  unlock(): void;                  // 最初の操作で呼ぶ（AudioContext の作成・resume）
  playFrame(events: GameEvent[]): void; // planSounds → play
  play(name: SoundName, row?: number): void;
  stopAll(): void;                 // 一時停止・画面の非表示・オフ
}
```

| 項目 | 処理 |
| --- | --- |
| `AudioContext` の作成 | `pointerdown`・`pointerup`・`touchend`・`click`・`keydown`（`document` にキャプチャで付ける）で `unlock()` を試し、鳴らせる状態（`running`）になったら外す。タッチの `pointerdown` は「利用者の操作」と認められないブラウザがあるため、指を離したとき・クリックでも試す。作成に失敗したら、以後 `play` は何もしない |
| `play` | `enabled` でない、または `AudioContext` がないときは何もしない（ただし `app:sound` イベントは出す。E2E で鳴らす判断を確かめるため。`detail` に `{ name, muted }`） |
| 鳴っている音 | 作ったオシレーターを `Set` で持ち、`ended` で外す。`stopAll()` は全部 `stop()` して空にする |
| 画面の非表示 | `visibilitychange` で `hidden` なら `stopAll()`、`AudioContext.suspend()`。表示に戻ったら `resume()` |
| 例外 | `sound.ts` の中で `try/catch` し、外に出さない（音が鳴らなくてもゲームは続ける。仕様書 §8.7） |

## 4. オン / オフの設定

- 起動時に `load('sound', true)` を読む。保存に失敗しても、その時点の `enabled` の値で動く。
- 効果音ボタン（タイトル・操作欄の 2 つ）は、押すと `setEnabled(!enabled)` し、両方のボタンの文字・アイコン・`aria-pressed` をそろえる。
- 効果音ボタンを押しても、ゲームの一時停止・フォーカスは変えない（操作欄のボタンは押したあと Canvas にフォーカスを戻す。TD-0003 §3.2）。

## 5. テスト

| 対象 | 方法 |
| --- | --- |
| `planSounds` | 単体テスト：同じ種類は 1 回、クリア・ゲームオーバー優先、`row` の決め方 |
| 鳴らす判断・オフ | E2E：`app:sound` イベントの `name` と `muted` を記録して確かめる |
| 実際の音・遅れ・マナーモード | 手動テスト（iPhone・Android の実機） |
