---
id: MBRK-TD-0003
type: Technical Design
title: プレイ画面（入力・ゲームループ・描画・一時停止・表示サイズ・読み上げ）
status: stable
version: 1.1
updated: 2026-10-25
sources:
  - MBRK-TD-0001
  - MBRK-TD-0002
  - MBRK-GUI-0003
  - MBRK-ADR-0003
  - MBRK-US-0005
  - MBRK-US-0007（v1.1）
  - MBRK-US-0008
  - MBRK-US-0009
  - MBRK-US-0010（v1.1）
  - MBRK-US-0011
  - MBRK-US-0021
  - doc/specification.md (v1.2) §2、§4、§5.1、§7、§8.3、§8.5
verified: null
---

# TD-0003 プレイ画面

対象のファイルは `play.ts`・`input.ts`・`render.ts`・`layout.ts`・`announce.ts`。

## 1. プレイ画面の流れ（`play.ts`）

```ts
export interface PlayScreen {
  start(): void;   // 新しいゲームを始める（画面を開いたとき・RETRY）
  stop(): void;    // 画面を離れるとき（ループ・入力・音を止める）
}
export function createPlayScreen(deps: { onTitle(): void; onRanking(): void; sound: Sound; announce: Announce }): PlayScreen;
```

| 場面 | 処理 |
| --- | --- |
| `start()` | `createGame()`、結果パネルを隠す、入力の受付を始める、表示サイズを合わせる、Canvas にフォーカス、ループを始める |
| ループ（`requestAnimationFrame`） | 下の §2 |
| 一時停止（ボタン・P・Esc・画面の非表示） | `pause(state)` が `true` なら：ループを止める、入力の押下を離した扱いにする、音を止める、描き直す、ボタンの表示、読み上げ |
| 再開（ボタン・P・Esc） | `resume(state)` が `true` なら：発射要求を捨てる、`resetAccumulator`、ループを始める、ボタンの表示、読み上げ |
| 終了（`cleared` / `gameOver`） | ループを止める、入力の受付をやめる（§3.6）、`summarize()`、暗くして描き直す、結果パネルを出す（TD-0004） |
| `stop()` | ループを止める、入力の受付をやめる、音を止める |

- `document` の `visibilitychange` で `hidden` になったら一時停止する（表示に戻っても再開しない。仕様書 §7.2）。
- `window` の `blur` では、押下中の左右キーとタッチの追従を離した扱いにする（仕様書 §4.1-6）。

## 2. 1 フレーム

```
frame(now):
  n = advance(acc, now)
  events = []（フレームごとに使い回す配列を空にする）
  for i in 0..n-1:
    step(state, input.take(), events)     ← take() は発射要求を 1 回分取り出す
    if state.status が ready / playing 以外: break
  if events にブロックがある: 読み上げ「スコア n」
  sound.playFrame(events)                 ← TD-0005
  events の内容を app:sound / app:state で知らせる（TD-0001 §7）
  render(ctx, state, …)
  if 終了: 終了の処理（§1）
  else if ready / playing: requestAnimationFrame(frame)
```

- `input.take()` は、そのステップの `StepInput` を作る。発射要求は最初のステップで取り出したら消える。

## 3. 入力（`input.ts`）

### 3.1 持つ状態

```ts
interface InputState {
  left: boolean; right: boolean;           // 押下中の左右キー
  source: 'keyboard' | 'pointer';
  pointerX: number | null;                 // 論理 x
  activePointerId: number | null;          // 追従中のタッチ（最初の指）
  downX: number | null;                    // 押した位置（タップの判定用、論理 x）
  launchRequested: boolean;
}
```

### 3.2 キーボード（`window` の `keydown` / `keyup`、`event.code` で判定）

| `code` | `keydown` | `keyup` |
| --- | --- | --- |
| `ArrowLeft` / `KeyA` | `left = true`、`source = keyboard` | `left = false` |
| `ArrowRight` / `KeyD` | `right = true`、`source = keyboard` | `right = false` |
| `Space` | `repeat` でなければ `launchRequested = true` | — |
| `KeyP` / `Escape` | `repeat` でなければ一時停止 / 再開を切り替える | — |

- 発射前・プレイ中・一時停止中は、`ArrowLeft`・`ArrowRight`・`Space` の `preventDefault()` を呼ぶ（スクロールを止める）。
- フォーカスが入力欄・ボタンにあるときのキーは、ゲームに渡さない（結果パネルの操作と混ざらないため）。ただし操作欄のボタンは、押し終わったら Canvas にフォーカスを戻す（GUI-0003 §2.3）。

### 3.3 ポインタ（Pointer Events）

| イベント | 付ける所 | 処理 |
| --- | --- | --- |
| `pointerdown` | Canvas と操作空間（§3.7） | `isPrimary` で、マウスなら左ボタンのとき：`activePointerId` を記録、押した要素で `setPointerCapture`、`downX` と `pointerX` に位置、`source = pointer` |
| `pointermove` | `window` | マウス：いつでも `pointerX` を更新、`source = pointer`。タッチ・ペン：`activePointerId` の指のときだけ更新 |
| `pointerup` | Canvas（キャプチャ中） | `activePointerId` の指なら：`|位置 − downX| ≤ 10`（論理座標）で `launchRequested = true`。`activePointerId = null`、`downX = null` |
| `pointercancel` / `lostpointercapture` | Canvas と操作空間 | 追従をやめる（発射しない） |

- 位置の変換：`x = (clientX − canvasの左端) × 480 / 表示幅` を 0〜480 に丸める（仕様書 §2.1）。
- タップの判定は x の移動量だけで行う（パドルは横にしか動かないため）。
- Canvas の CSS：`touch-action: none`、`user-select: none`、`-webkit-touch-callout: none`。`contextmenu` は `preventDefault()`。

### 3.4 発射要求を捨てる場面

再開したとき、新しいゲームを始めたときは `launchRequested = false` にする（仕様書 §4.1-6）。

### 3.5 マウスカーソル

`source = pointer` かつマウスでプレイ中のときだけ、Canvas に `cursor: none` を付ける（`data-hide-cursor` 属性で切り替える）。

### 3.6 入力の受付をやめる

終了・画面を離れるときに、`window` に付けたリスナーを外し、`InputState` を初期に戻す。リスナーは `AbortController` の `signal` でまとめて外す。

### 3.7 操作空間（仕様書 v1.2 §2、GUI-0003 §2.3）

- `index.html` のプレイ画面に、Canvas と操作欄の間に `<div id="control-area" class="control-area" aria-hidden="true">` を置く（中に案内の文字）。
- `createInput(canvas, options, controlArea)` で受け取り、`pointerdown`・`lostpointercapture`・`contextmenu` を Canvas と同じに付ける。
- 位置の変換は Canvas の外形で行う（`toLogicalX` はそのまま）。操作空間は Canvas と左右の端がそろっている（幅は `--stage-width`）ので、指の真上のパドルの位置になる。
- 出す・出さないは `play.ts` が決める：`matchMedia('(pointer: coarse)').matches` なら `hidden` を外す。`change` イベントでも合わせ直す（タブレットにマウスをつないだ場合など）。
- CSS：Canvas と同じ `touch-action: none`・`user-select: none`・`-webkit-touch-callout: none`。高さ 96、ゲーム領域との間 8。

## 4. 描画（`render.ts`）

```ts
export interface Palette { field: string; frame: string; text: string; muted: string; paddle: string; ball: string; veil: string; blocks: string[] }
export function readPalette(): Palette;   // CSS 変数から読む（起動時に 1 回）
export function render(ctx: CanvasRenderingContext2D, state: GameState, palette: Palette, dimmed: boolean): void;
```

- 描画の前に `ctx.setTransform(scale, 0, 0, scale, 0, 0)`（`scale = Canvas の実ピクセル幅 / 480`）。以降はすべて論理座標で描く。
- 描く順は仕様書 §2.2。終了後は `ctx.globalAlpha = 0.5` で盤面を描く（`dimmed`）。
- HUD の文字は `bold 18px ui-monospace, …`（論理座標の大きさ）。スコアは `format.ts` の 3 桁区切り。
- 一時停止中・終了後はループが止まっているので、状態が変わったときに 1 回だけ描く。

## 5. 表示サイズ（`layout.ts` と `play.ts`）

```ts
/** 仕様書 §2.1。値は CSS px、結果は整数に切り捨て */
export function computeDisplaySize(v: { width: number; height: number; topInset: number; bottomInset: number; controlsHeight: number }): { width: number; height: number };
```

- `play.ts` は、`window.innerWidth` / `innerHeight`、`main` の上下の余白（`getComputedStyle`）、ゲーム領域の下に置くものの高さ（操作欄 56、操作空間を出すときは 104 を足して 160）を `controlsHeight` に渡す。`computeDisplaySize` の式は変えない。
- 結果を Canvas の CSS の大きさにし、実ピクセルは `× devicePixelRatio`（整数に丸める）にする。
- `resize` と `orientationchange` で計算し直す。ただし結果パネルを出している間は、幅が変わったときだけ計算し直す（仕様書 §2.1。ソフトウェアキーボードで高さだけ縮む場合を除くため）。
- 横向き（`innerWidth > innerHeight`）で、表示幅が 288 になったときは、縦向きの案内（`#orientation-notice`）を出す。

## 6. 読み上げ（`announce.ts`）

```ts
export interface Announce { say(text: string): void }
```

- `#announcer` の `textContent` を書き換える。同じ文が続くときも読み上げられるよう、いったん空にしてから次のフレームで入れる。
- スコアの読み上げは、ブロックを壊したフレームだけ（1 フレームに 1 回）。文は仕様書 §8.5。数値は `format.ts` の 3 桁区切り。

## 7. 終了の処理と結果パネル

- 結果パネルの中身と登録は TD-0004。プレイ画面は、`summarize()` の結果と、RETRY・TITLE・RANKING のときの処理（`start()`・`onTitle()`・`onRanking()`）を渡す。
- 一時停止ボタンは終了後に `disabled` にする。
- 入力ガード（500 ms）は結果パネルが持つ（TD-0004 §5）。
