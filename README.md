# ブロック崩し（mini-blockbreaking-game）

スマートフォンで遊べる、1 ステージのブロック崩しです。ブラウザだけで動く PWA で、サーバーは使いません。ホーム画面に追加すると、オフラインでも遊べます。

- 公開 URL：https://tsuku3dayo.github.io/mini-blockbreaking-game/
- 仕様：[doc/specification.md](doc/specification.md)（v1.3）

## 遊び方

1. タイトル画面の START を押します。
2. パドルを動かして、ボールを打ち返します。
   - スマートフォン：ゲーム領域の下の操作空間（またはゲーム領域）を指でなぞる
   - パソコン：マウスを動かす、または ← → ・ A D
3. 発射は、タップ・クリック・Space です。
4. 40 個のブロックを全部壊すとクリアです。ボールを下に落とすとゲームオーバーです。
5. 結果の画面で名前を入れて登録すると、この端末のランキング（上位 10 件）に残ります。

一時停止は一時停止ボタン・P・Esc です。別のアプリに切り替えると、自動で一時停止します。

## 機能

| 機能 | 内容 |
| --- | --- |
| ゲーム | 8 列 × 5 行のブロック、10 個ごとに速くなる、クリアは早いほど時間ボーナス（合計は最大 2,200 点） |
| 操作 | 指（なぞる・タップ）、マウス、キーボード。スマートフォンでは、指でボールを隠さないための操作空間 |
| ランキング | 名前つきで端末に保存（上位 10 件）。自分の記録に「（あなた）」。タイトル画面から全部消せる |
| バックアップ | ランキング画面で、記録をファイルに書き出す・読み込む |
| 効果音 | 8 種類（発射・パドル・壁・ブロック・加速・クリア・ゲームオーバー・登録）。オン / オフできる |
| アプリとして使う | ホーム画面に追加、オフラインで動く、新しい版は「更新」ボタンで切り替える、起動に失敗したら自動で直す |
| 使いやすさ | 画面の読み上げ、キーボードだけでの操作、動きを減らす設定に対応 |
| クレジット | タイトル画面の「クレジット」から、作った人の役職と名前を見られる |

## 起動方法

Node.js 24 が必要です。

```sh
npm ci
npm run dev
```

表示された URL（例：http://localhost:5173/）をブラウザで開きます。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発用サーバーを起動する |
| `npm run build` | 型を検査して、`dist/` に本番用の成果物を作る |
| `npm run preview` | `dist/` を配信して確かめる |
| `npm run lint` | ESLint で検査する |
| `npm test` | 単体テスト（Vitest） |
| `npm run test:e2e` | 画面のテスト（Playwright。Pixel 7 と 375 × 667 の 2 つ） |
| `npm run check:dist` | `dist/` が PWA として成り立つか（manifest・アイコン・バージョン表示・起動の見張り）を確かめる |
| `npm run icons` | アイコンを `public/icons/` に作り直す |
| `npm run verify` | lint → 単体テスト → build → check:dist をまとめて行う |

初めて E2E を動かすときは、`npx playwright install chromium` でブラウザを入れてください。

`main` にマージすると、GitHub Actions がテストして GitHub Pages に公開します。

## ファイル構成

```
├─ index.html            画面の骨組み（タイトル・プレイ・ランキング・クレジット・ダイアログ）
├─ public/
│  ├─ boot.js            起動の見張りと復旧（ビルドを通さない）
│  └─ icons/             アイコン（scripts/make-icons.mjs で作る）
├─ src/
│  ├─ ロジック層（DOM・時刻・乱数に触れない。tests/ で単体テスト）
│  │   config.ts・game.ts・collision.ts・score.ts・loop.ts・layout.ts・
│  │   ranking.ts・backup.ts・sound-plan.ts・format.ts
│  ├─ 画面層
│  │   main.ts（起動・画面の切替え・タイトル）・play.ts・input.ts・render.ts・
│  │   result-panel.ts・ranking-view.ts・sound.ts・announce.ts・ui.ts・icons.ts・
│  │   install.ts・debug.ts
│  ├─ 基盤
│  │   storage.ts・records.ts・pwa.ts
│  └─ style.css
├─ tests/                単体テスト（Vitest）
├─ e2e/                  画面のテスト（Playwright）と、テスト用のファイル（fixtures/）
├─ scripts/              アイコンの作成、dist の検査
└─ doc/                  仕様書と、開発の成果物（要件・画面設計・設計・テスト・計画・実施記録）
```

## デバッグモード

URL の末尾に `?debug=1` を付けて開くと（例：http://localhost:5173/?debug=1）、ブラウザの開発者ツールから `window.__breakout` を使えます。E2E でも使っています。

| 名前 | 内容 |
| --- | --- |
| `__breakout.snapshot()` | ゲームの状態の写しを返す |
| `__breakout.setup({ ... })` | 状態の一部を書き換える（例：`setup({ status: 'playing', ball: { x: 100, y: 630, vx: 0, vy: 300 } })`、`setup({ aliveIds: [32] })` でブロックを 1 個だけ残す） |
| `__breakout.showUpdateBanner()` | 「新しい版があります」の帯を出す（帯の出し分けの確認用） |

`body` の `data-game-state` 属性と、`window` の `app:state` イベントで、ゲームの状態（`ready`・`playing`・`paused`・`cleared`・`gameOver`）が分かります。効果音を鳴らすと決めたときは `app:sound` イベント（`detail` に `name`・`muted`）が出ます。

## 素材のライセンス

外部の素材は使っていません。

- 画像・アイコン：このリポジトリのスクリプト（`scripts/make-icons.mjs`）とコード（`src/icons.ts`）で作ったもの
- 効果音：Web Audio でその場で合成している（音声ファイルはない）
- 文字：端末に入っている書体だけを使う（Web フォントは使わない）
