---
id: MBRK-TD-0001
type: Technical Design
title: 詳細設計 全体（ファイル構成・画面の切替え・ビルド・PWA・CI・テスト用の入口）
status: stable
version: 1.2
updated: 2026-10-26
sources:
  - MBRK-SA-0001
  - MBRK-TS-0001
  - MBRK-ADR-0002
  - MBRK-ADR-0004
  - MBRK-ADR-0007
  - MBRK-ADR-0007（v1.1）
  - MBRK-GUI-0001（v1.3）
  - MBRK-GUI-0007
  - doc/specification.md (v1.4) §8、§8.5、§8.6、§8.8
  - simple_shogi（vite.config.ts、playwright.config.ts、public/boot.js、src/pwa.ts、src/install.ts、scripts/check-dist.mjs）
verified: null
---

# TD-0001 詳細設計 全体

詳細は次の文書に分ける。

| ID | 範囲 |
| --- | --- |
| MBRK-TD-0001（本書） | ファイル構成、依存の向き、画面の切替え、HTML の骨組み、ビルド・PWA・CI、テスト用の入口 |
| [MBRK-TD-0002](MBRK-TD-0002-technical-design-ja.md) | ゲームのロジック（状態・1 ステップ・衝突・スコア・ループの時間計算） |
| [MBRK-TD-0003](MBRK-TD-0003-technical-design-ja.md) | プレイ画面（入力・ゲームループ・描画・一時停止・表示サイズ・読み上げ） |
| [MBRK-TD-0004](MBRK-TD-0004-technical-design-ja.md) | 記録（保存・ランキング・バックアップ・結果パネル・ランキング画面） |
| [MBRK-TD-0005](MBRK-TD-0005-technical-design-ja.md) | 効果音 |

## 1. ファイル構成

```
mini-blockbreaking-game/
├─ index.html              画面の骨組み（§4）
├─ public/
│  ├─ boot.js              起動の見張り・復旧（simple_shogi から流用）
│  └─ icons/               アイコン（scripts/make-icons.mjs で生成）
├─ src/
│  ├─ ── ロジック層（DOM・時刻・乱数に触れない。tests/ で単体テスト）──
│  ├─ config.ts            仕様書 §11 のパラメータ
│  ├─ game.ts              ゲームの状態・新しいゲーム・1 ステップの更新・一時停止（TD-0002）
│  ├─ collision.ts         円と矩形・壁・パドル・ブロック・最小垂直成分（TD-0002）
│  ├─ score.ts             時間ボーナス・結果サマリ（TD-0002）
│  ├─ loop.ts              ループの時間計算（蓄積器）（TD-0002）
│  ├─ layout.ts            表示サイズの計算（TD-0003）
│  ├─ ranking.ts           名前・記録の検証、並び順、順位、上位 10 件への追加（TD-0004）
│  ├─ backup.ts            バックアップの形の組み立てと検証（TD-0004）
│  ├─ sound-plan.ts        出来事から鳴らす音を決める（TD-0005）
│  ├─ format.ts            3 桁区切り・タイム・日時の表示形式
│  ├─ ── 画面層 ──
│  ├─ main.ts              起動、画面の切替え、タイトル画面、クレジット画面（中身は index.html に固定で書く）
│  ├─ play.ts              プレイ画面（ゲームループ・一時停止・結果パネルの呼び出し）（TD-0003）
│  ├─ input.ts             ポインタ・キーボードの入力（TD-0003）
│  ├─ render.ts            Canvas の描画（TD-0003）
│  ├─ result-panel.ts      結果パネルとスコア登録（TD-0004）
│  ├─ ranking-view.ts      ランキング画面とバックアップ（TD-0004）
│  ├─ sound.ts             Web Audio の合成と再生（TD-0005）
│  ├─ announce.ts          読み上げの通知領域
│  ├─ ui.ts                DOM の小物（要素の作成・アイコン・フォーカス）
│  ├─ icons.ts             SVG アイコンの形（パスのデータ）
│  ├─ debug.ts             テスト用の入口（§7）
│  ├─ ── 基盤 ──
│  ├─ storage.ts           localStorage の読み書き・版番号と移行（TD-0004）
│  ├─ records.ts           ランキングの保存・読み出し（storage と ranking をつなぐ）（TD-0004）
│  ├─ pwa.ts               Service Worker の登録と「更新」の帯（simple_shogi から流用）
│  ├─ install.ts           インストール方法のダイアログ（simple_shogi から流用）
│  ├─ style.css            見た目（色は :root の変数に集約。GUI-0001 §3）
│  └─ vite-env.d.ts        __APP_VERSION__ / __APP_ID__ の型
├─ tests/                  Vitest の単体テスト（*.test.ts）
├─ e2e/                    Playwright の画面テスト（*.spec.ts）
├─ scripts/
│  ├─ check-dist.mjs       PWA の成立チェック（simple_shogi から流用・調整）
│  └─ make-icons.mjs       アイコンの生成（simple_shogi から流用・図柄を変更）
├─ .github/
│  ├─ workflows/test.yml   CI（simple_shogi と同じ + E2E の 2 プロジェクト）
│  ├─ workflows/pages.yml  GitHub Pages への公開（simple_shogi と同じ）
│  └─ dependabot.yml       依存の更新（simple_shogi と同じ）
├─ vite.config.ts / playwright.config.ts / tsconfig.json / eslint.config.js / package.json
├─ README.md
└─ CLAUDE.md
```

## 2. 依存の向き

```
main.ts ─┬─▶ play.ts ─┬─▶ input.ts ──▶ layout.ts, config.ts
         │            ├─▶ render.ts ─▶ game.ts（型）, config.ts
         │            ├─▶ game.ts ───▶ collision.ts, score.ts, config.ts
         │            ├─▶ loop.ts
         │            ├─▶ sound.ts ──▶ sound-plan.ts
         │            ├─▶ result-panel.ts ─▶ records.ts ─▶ storage.ts, ranking.ts
         │            └─▶ announce.ts
         ├─▶ ranking-view.ts ─▶ records.ts, backup.ts
         ├─▶ pwa.ts, install.ts
         └─▶ debug.ts
```

- ロジック層（`config`・`game`・`collision`・`score`・`loop`・`layout`・`ranking`・`backup`・`sound-plan`・`format`）は、画面層と基盤を import しない。`window`・`document`・`Date.now()`・`Math.random()` を使わない（時刻は引数で受け取る）。
- 画面層どうしは、`main.ts` が配線する。画面層の部品は互いに直接呼ばず、`main.ts` から渡されたコールバックで画面の切替えを頼む。

## 3. 画面の切替え

### 3.1 画面と URL

画面は URL のハッシュで表す。GitHub Pages とオフラインのキャッシュのどちらでも、追加の設定なしで動くため。

| 画面 | ハッシュ | `body[data-screen]` |
| --- | --- | --- |
| タイトル | `#/title` | `title` |
| プレイ（結果パネルを含む） | `#/play` | `play` |
| ランキング | `#/ranking` | `ranking` |
| クレジット | `#/credits` | `credits` |

- 起動したとき：ハッシュが `#/ranking`・`#/credits` ならその画面、それ以外（`#/play`・空・不明）はタイトル画面にする（遊んでいる途中のゲームは保存しないため。仕様書 §7.2）。ハッシュは `history.replaceState` で書き直す。
- 起動後にハッシュが変わったとき（戻るボタン・手入力）：`#/title`・`#/ranking`・`#/credits` はその画面へ。`#/play` は新しいゲームを始める。不明なハッシュはタイトル画面へ（仕様書 §8）。
- クレジット画面は、ランキング画面と同じく Esc・BACK でタイトルへ戻る（`main.ts` の `onKeyDown`）。中身は固定なので、開いたときの初期化はない。
- 画面の切替えは `history.pushState` でハッシュを変える。プレイ中に「戻る」でタイトルに戻った場合、ゲームは捨てる。

### 3.2 切替えの処理（`main.ts` の `showScreen(name)`）

1. 今の画面の後始末を呼ぶ（プレイ画面ならループを止め、入力の受付をやめ、鳴っている音を止める）。
2. 対象の `section` だけ `hidden` を外す。`body[data-screen]` と `document.title` を変える（GUI-0001 §1）。
3. `window.scrollTo(0, 0)`。
4. 画面の初期化を呼ぶ（プレイ：新しいゲーム、ランキング：保存から読み直す）。
5. 初期フォーカスの部品にフォーカスを移す。
6. 更新の帯は、プレイ画面以外（タイトル・ランキング・クレジット）のときだけ出す（GUI-0006 §3）。

## 4. HTML の骨組み（`index.html`）

```html
<body>
  <main id="app">
    <section id="screen-title" class="screen" aria-labelledby="title-logo"> … </section>
    <section id="screen-play" class="screen" aria-label="プレイ" hidden>
      <p id="orientation-notice" class="notice" hidden>縦向きでのプレイをおすすめします</p>
      <div id="stage" class="stage">                 <!-- Canvas と結果パネルを重ねる箱 -->
        <canvas id="field" role="img" aria-label="ブロック崩しミニのゲーム画面" tabindex="0"></canvas>
        <div id="result-panel" class="result-panel" role="region" aria-labelledby="result-heading" hidden> … </div>
      </div>
      <div class="play-controls">
        <button id="pause-button" type="button" class="toggle" aria-pressed="false"> … </button>
        <button type="button" class="toggle sound-toggle" aria-pressed="true"> … </button>
      </div>
    </section>
    <section id="screen-ranking" class="screen" aria-labelledby="ranking-heading" hidden> … </section>
    <section id="screen-credits" class="screen" aria-labelledby="credits-heading" hidden> … </section>
  </main>
  <div id="announcer" class="sr-only" aria-live="polite"></div>
  <div id="update-banner" class="update-banner" role="status" hidden> … </div>
  <dialog id="install-dialog"> … </dialog>
  <dialog id="import-dialog"> … </dialog>
  <div id="boot-error" hidden> … </div>          <!-- boot.js が使う -->
  <script src="./boot.js"></script>
  <script type="module" src="/src/main.ts"></script>
</body>
```

- 固定の文言・ボタンは `index.html` に書く。動的な中身（表の行・内訳の数値・メッセージ）は `ui.ts` の関数で要素を作り、文字は `textContent` で入れる（`innerHTML` は ESLint で禁止）。
- 効果音ボタンはタイトルと操作欄の 2 つあり、同じクラス `sound-toggle` で、`main.ts` が両方の表示をそろえる。
- `head` は `simple_shogi` と同じ（`viewport-fit=cover`、`theme-color` = `#0B1020`、`color-scheme` = `dark`、`app-id`、`apple-mobile-web-app-status-bar-style` = `black`）。

## 5. ビルドと PWA

`simple_shogi` の `vite.config.ts` をもとに、次を変える。

| 項目 | 値 |
| --- | --- |
| `APP_NAME` | `ブロック崩しミニ`（manifest の `name`・`short_name`。`index.html` の `apple-mobile-web-app-title` と `<title>`、`src/main.ts`・`src/play.ts` のページタイトルも同じ名前にする） |
| `THEME_COLOR` / `BACKGROUND_COLOR` | `#0B1020` |
| manifest の `description` | `スマートフォンで遊べる、1 ステージのブロック崩し` |
| manifest の `orientation` | `portrait`（インストールしたアプリは縦向きで開く） |
| `test` | `{ environment: 'node', include: ['tests/**/*.test.ts'] }` |

- `__APP_VERSION__`・`__APP_ID__` の埋め込み、`app-id-meta` プラグイン、`registerType: 'prompt'`、Workbox の設定は `simple_shogi` のまま。
- `package.json`：`name` = `mini-blockbreaking-game`、`version` = `0.1.0` から始め、全ストーリーの完了で `1.0.0`。`scripts` と `devDependencies` は `simple_shogi` と同じ（`pwaTemplate` の印は付けない）。
- `scripts/check-dist.mjs`：`simple_shogi` のものを流用し、アプリ ID の確認を `mini-blockbreaking-game` に合わせる。
- `scripts/make-icons.mjs`：図柄をブロック崩し（暗い地に 5 色のブロックとボール）に替える。

## 6. CI と公開

- `.github/workflows/test.yml`・`pages.yml`・`.github/dependabot.yml` は `simple_shogi` と同じ。
- `playwright.config.ts` は `projects` を 2 つにする（ADR-0008）。

```ts
projects: [
  { name: 'pixel7', use: { ...devices['Pixel 7'] } },
  { name: 'small', use: { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true,
                         deviceScaleFactor: 2, userAgent: devices['Pixel 7'].userAgent } },
],
```

- GitHub の Settings → Pages の Source を「GitHub Actions」にする（最初の公開の前に 1 回）。

## 7. テスト用の入口（`debug.ts`）

Canvas の中身は E2E から読めないため（ADR-0003）、URL に `?debug=1` を付けて開いたときだけ、`window.__breakout` を用意する。普段は何もしない。

| 名前 | 内容 |
| --- | --- |
| `snapshot()` | ゲームの状態の写し（状態・パドル・ボール・生きているブロック・得点・経過ミリ秒・速度段階）を返す |
| `setup(partial)` | 発射前・プレイ中の状態の一部を書き換える（例：ブロックを 1 個だけ残す、ボールの位置と速度を決める）。クリア・ゲームオーバーの E2E を短時間で行うため |
| `setClock(fn)` | `setup` と組み合わせて時刻を固定する（`loop.ts` に渡す時刻の元を差し替える） |

- 出来事は、`?debug` の有無にかかわらず `window` に `CustomEvent` を出す：効果音を鳴らすとき `app:sound`（`detail` は音の名前）、状態が変わったとき `app:state`（`detail` は新しい状態）。`simple_shogi` の `app:sound` と同じ考え方。
- `body` に `data-game-state`（`ready` / `playing` / `paused` / `cleared` / `gameOver`）を付ける。
- README に「デバッグモードの入り方」として `?debug=1` を書く（`simple_shogi` の CLAUDE.md の README の決まり）。

## 8. 起動の手順（`main.ts`）

1. `migrateStorage()`（TD-0004）と `requestPersist()`。
2. 効果音の設定を読み、効果音ボタンの表示をそろえる。
3. 色を CSS 変数から読み、描画の色表を作る（TD-0003）。
4. 各画面のボタンにイベントを付ける。`setupUpdateBanner()`・インストール方法の入口を用意する。
5. `?debug=1` なら `debug.ts` を有効にする。
6. ハッシュから最初の画面を決めて `showScreen()`。
7. `window.__appStarted = true`（`boot.js` に起動できたことを知らせる）。
