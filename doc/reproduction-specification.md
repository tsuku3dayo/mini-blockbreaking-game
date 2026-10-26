# ブロック崩しミニ 再現開発仕様書

- 版：1.0（2026-10-26）
- 対象：「ブロック崩しミニ」（アプリのバージョン 1.0.0）を、別の環境で同じものとして作り直すための仕様
- 組で使う資料：[`doc/specification.md`](specification.md)（v1.4。以下「製品仕様」）

### この仕様書の位置づけ

| 資料 | 決めること |
| --- | --- |
| 製品仕様（`specification.md`） | **何を作るか**：ゲームのルール・物理・操作・画面・スコア・ランキング・効果音・PWA の振る舞い・数値パラメータ・受け入れ基準 |
| 本書 | **どう作るか**：開発環境、技術構成、ファイル構成と層の決まり、主なデータ型、保存の形、効果音の音色、PWA の設定、テスト用の入口、テスト・CI・公開の手順 |

- 振る舞いが食い違ったときは、製品仕様を正とする。本書は、製品仕様が「実装者が選ぶ」としたもの（§1.1）を、現在のリポジトリと同じ選択に固定する。
- 本書の値は、このリポジトリの実装（`main`、2026-10-26 時点）から写したもの。本書の §番号は「本書 §n」、製品仕様の §番号は「製品 §n」と書く。

### 改訂履歴

| 版 | 日付 | 内容 |
| --- | --- | --- |
| 1.0 | 2026-10-26 | 初版 |

---

## 目次

1. [開発環境](#1-開発環境)
2. [技術構成](#2-技術構成)
3. [プロジェクトの設定](#3-プロジェクトの設定)
4. [ファイル構成と層](#4-ファイル構成と層)
5. [主なデータ型と関数](#5-主なデータ型と関数)
6. [画面の骨組みと画面切替え](#6-画面の骨組みと画面切替え)
7. [描画とレイアウト](#7-描画とレイアウト)
8. [入力](#8-入力)
9. [端末内保存](#9-端末内保存)
10. [効果音の音色](#10-効果音の音色)
11. [PWA（インストール・オフライン・更新・復旧）](#11-pwaインストールオフライン更新復旧)
12. [アイコン](#12-アイコン)
13. [テスト用の入口](#13-テスト用の入口)
14. [テスト](#14-テスト)
15. [CI と公開](#15-ci-と公開)
16. [再現の進め方](#16-再現の進め方)
17. [再現の確認](#17-再現の確認)
18. [別の環境に移すときの注意](#18-別の環境に移すときの注意)

---

## 1. 開発環境

| 項目 | 内容 |
| --- | --- |
| OS | 問わない（Windows・macOS・Linux）。CI は ubuntu-latest |
| Node.js | 24 系 |
| パッケージ管理 | npm（`package-lock.json` をコミットし、`npm ci` で入れる） |
| E2E のブラウザ | Playwright の Chromium（`npx playwright install chromium`） |
| 実機の確認 | iPhone の Safari、Android の Chrome（E2E は Chromium だけなので、iPhone は実機で確かめる） |
| 公開先 | GitHub Pages（サブパス配信。例：`https://<ユーザー>.github.io/mini-blockbreaking-game/`） |

サーバー・データベース・外部 API は使わない。静的ファイルを配信できればどこでも動く。

---

## 2. 技術構成

### 2.1 使うもの

| 区分 | 採用 | 版（`package.json` の指定） |
| --- | --- | --- |
| 言語 | TypeScript（strict） | `~6.0.3` |
| ビルド・開発サーバー | Vite | `^8.3.4` |
| PWA | vite-plugin-pwa（Workbox） / workbox-window | `^2.0.0` / `^7.4.1` |
| 単体テスト | Vitest（node 環境） | `^5.0.3` |
| E2E | Playwright | `^1.64.0` |
| 静的検査 | ESLint + typescript-eslint（flat config） | `^10.12.0` / `^8.71.1` |
| その他 | `@eslint/js` `^10.0.1`、`globals` `^17.13.0`、`@types/node` `^24.19.2` | |

- **実行時の依存はない**（`dependencies` は空。すべて `devDependencies`）。UI フレームワーク・ゲームエンジン・音声ファイル・Web フォント・外部 CDN は使わない。
- 描画は Canvas 2D、効果音は Web Audio の合成、保存は localStorage。

### 2.2 選んだ理由（要約）

| 決定 | 理由 | 元の記録 |
| --- | --- | --- |
| サーバーを持たず、端末内に保存 | 運用・費用・個人情報の扱いをなくす | ADR-0001 |
| 構成とルールを simple_shogi に合わせる | 同じ作者のプロジェクトで道具と手順を共通にする | ADR-0002 |
| ゲーム領域は Canvas 2D | 毎フレーム全体を描き直す製品仕様（製品 §2.2）に合う | ADR-0003 |
| ロジックを純関数にし、固定タイムステップ | 決定性（製品 §1.2）と単体テストのしやすさ | ADR-0004 |
| 効果音は Web Audio で合成 | オフラインで確実に鳴る、素材のライセンスが不要 | ADR-0005 |
| localStorage と JSON の書き出し | 記録が小さい（最大 10 件）。消えたときはファイルで戻す | ADR-0006 |
| アプリ識別子 `mini-blockbreaking-game` | 同じサイトのほかのアプリと保存・キャッシュを分ける | ADR-0007 |
| E2E は Chromium × 2 画面、iPhone は実機 | CI で動かせる範囲と、実機でしか分からないものを分ける | ADR-0008 |

---

## 3. プロジェクトの設定

### 3.1 `package.json`

```json
{
  "name": "mini-blockbreaking-game",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "check:dist": "node scripts/check-dist.mjs",
    "icons": "node scripts/make-icons.mjs",
    "verify": "npm run lint && npm test && npm run build && npm run check:dist"
  }
}
```

- `name` が **アプリ識別子**、`version` が **画面に出すバージョン** になる（本書 §3.2）。この 2 つ以外の場所に書かない。

### 3.2 `vite.config.ts` の要点

| 設定 | 値 | 理由 |
| --- | --- | --- |
| `base` | `'./'` | GitHub Pages のサブパスでも動く相対パス |
| `define.__APP_VERSION__` | `package.json` の `version` | タイトル画面の `v1.0.0` |
| `define.__APP_ID__` | `package.json` の `name` | 保存のキー・バックアップの `app`・復旧の範囲 |
| 独自プラグイン `app-id-meta` | `index.html` の `__APP_ID__` を識別子に置き換える | ビルドを通らない `public/boot.js` が `<meta name="app-id">` から読むため |
| `VitePWA` | 本書 §11.1 | |
| `test` | `{ environment: 'node', include: ['tests/**/*.test.ts'] }` | 単体テストはロジック層だけ（DOM 不要） |

アプリ名「ブロック崩しミニ」とテーマ色 `#0B1020` は、`vite.config.ts`（manifest）と `index.html`（`<title>`・`theme-color`・`apple-mobile-web-app-title`）の 2 か所にだけ書く。

`src/vite-env.d.ts` で、`__APP_VERSION__`・`__APP_ID__`（どちらも `string`）と、`window.__appStarted`・`window.__breakout` の型を宣言する。

### 3.3 `tsconfig.json`

`target: ES2022`、`module: ESNext`、`moduleResolution: bundler`、`lib: [ES2022, DOM, DOM.Iterable]`、`types: [node, vite/client, vite-plugin-pwa/client]`、`strict`・`noUnusedLocals`・`noUnusedParameters`・`noFallthroughCasesInSwitch`・`isolatedModules`・`skipLibCheck`・`noEmit` を true。`include` は `src`・`tests`・`vite.config.ts`。

### 3.4 ESLint の決まり（`eslint.config.js`）

1. `js.configs.recommended` と `tseslint.configs.recommended`。無視：`dist`・`dev-dist`・`node_modules`・`playwright-report`・`test-results`。
2. **`src/**/*.ts` で `innerHTML`・`outerHTML` への代入を禁止**（利用者の名前を HTML として解釈させない。製品 §8.5）。固定の HTML がどうしても要る行だけ、理由を書いて `eslint-disable` する。
3. **ロジック層（本書 §4.2）で次を禁止**
   - グローバル：`window` `document` `navigator` `location` `localStorage` `sessionStorage` `performance` `requestAnimationFrame` `setTimeout` `setInterval` `Date`
   - `Math.random`
   - 画面層・基盤のモジュールの import
4. `public/**/*.js` は普通のスクリプト（`sourceType: 'script'`、ブラウザの globals）。`tests`・`scripts`・設定ファイルは node の globals。`e2e` は node とブラウザの両方。

### 3.5 `.gitignore`

`node_modules/` `dist/` `dev-dist/` `playwright-report/` `test-results/`、機密ファイル（`.env`・`.env.*`（`.env.example` は除く）・`*.pem`・`*.p12`・`*.pfx`・`credentials.json`）、`.claude/settings.local.json`。

---

## 4. ファイル構成と層

### 4.1 ファイル構成

```
├─ index.html              画面の骨組み（本書 §6）
├─ public/
│  ├─ boot.js              起動の見張りと復旧（ビルドを通さない。本書 §11.4）
│  └─ icons/               icon.svg・icon-192.png・icon-512.png・icon-maskable-512.png・apple-touch-icon.png
├─ src/
│  ├─ （ロジック層）config.ts・game.ts・collision.ts・score.ts・loop.ts・layout.ts・
│  │                ranking.ts・backup.ts・sound-plan.ts・format.ts
│  ├─ （画面層）    main.ts・play.ts・input.ts・render.ts・result-panel.ts・ranking-view.ts・
│  │                sound.ts・announce.ts・ui.ts・icons.ts・install.ts・debug.ts
│  ├─ （基盤）      storage.ts・records.ts・pwa.ts
│  ├─ style.css
│  └─ vite-env.d.ts
├─ tests/                  単体テスト（Vitest）と fake-storage.ts
├─ e2e/                    E2E（Playwright）、helpers.ts、fixtures/（バックアップのテスト用 JSON）
├─ scripts/                make-icons.mjs・check-dist.mjs
└─ .github/                workflows/test.yml・pages.yml、dependabot.yml
```

### 4.2 層の決まり

| 層 | 役割 | 決まり |
| --- | --- | --- |
| ロジック層 | ルール・物理・スコア・順位・検証・表示の形式 | DOM・時刻・乱数に触れない。時刻は引数で受け取る。単体テストで確かめる |
| 画面層 | DOM・Canvas・入力・音・読み上げ | ロジック層を呼ぶ。ロジック層から import されない |
| 基盤 | localStorage・Service Worker | 例外を外に出さない（失敗は戻り値で返す） |

### 4.3 モジュールの役割

| ファイル | 役割 |
| --- | --- |
| `config.ts` | 製品 §11 のパラメータと、そこから計算する値（`PADDLE_MIN_X`・`BALL_READY_Y`・角度のラジアン等）。ほかに `EPSILON_MS = 1e-6`、`SCHEMA_VERSION = 1` |
| `game.ts` | 状態の型、`createGame`・`step`・`pause`・`resume`・`currentSpeed`・`blockScore` |
| `collision.ts` | 壁・パドル・ブロックとの衝突、最小垂直成分の補正、円と矩形の判定（製品 §5.4〜§5.9） |
| `score.ts` | 時間ボーナス・結果サマリ（製品 §6） |
| `loop.ts` | 固定タイムステップの蓄積器（製品 §5.1） |
| `layout.ts` | 表示サイズの計算（製品 §2.1） |
| `ranking.ts` | 名前・記録の検証、並び順、順位、上位 10 件への追加（製品 §9.3・§9.4） |
| `backup.ts` | バックアップ JSON の組み立て・検証・ファイル名（製品 §9.6） |
| `sound-plan.ts` | 1 フレームの出来事から鳴らす音を決める（製品 §8.7 の規則） |
| `format.ts` | 3 桁区切り・タイム・登録日時・順位の表示 |
| `main.ts` | 起動、画面の切替え、タイトル画面、効果音ボタン、記録の全消去 |
| `play.ts` | プレイ・結果画面。ループ、レイアウト、一時停止、状態の通知 |
| `input.ts` | キーボード・ポインタの入力を `StepInput` にまとめる |
| `render.ts` | Canvas の描画（製品 §2.2） |
| `result-panel.ts` | 結果パネルとスコア登録（製品 §8.3・§9.5） |
| `ranking-view.ts` | ランキング画面とバックアップの操作（製品 §8.4・§9.6） |
| `sound.ts` | Web Audio の合成と再生、オン / オフ（本書 §10） |
| `announce.ts` | 読み上げの通知領域（`#announcer`） |
| `ui.ts`・`icons.ts` | SVG アイコンの組み立て（`data-icon` の置き換え） |
| `install.ts` | インストール方法のダイアログ、`beforeinstallprompt`、インストール済みの判定 |
| `debug.ts` | テスト用の入口（本書 §13） |
| `storage.ts` | localStorage の読み書き、版番号と移行（本書 §9） |
| `records.ts` | ランキングの保存・読み出し・全消去・バックアップの反映 |
| `pwa.ts` | Service Worker の登録と「更新」の帯（本書 §11.3） |

---

## 5. 主なデータ型と関数

### 5.1 ゲームの状態（`game.ts`）

```ts
type GameStatus = 'ready' | 'playing' | 'paused' | 'cleared' | 'gameOver';

interface Ball { x: number; y: number; vx: number; vy: number } // 中心座標、px/秒

interface GameState {
  status: GameStatus;
  pausedFrom: 'ready' | 'playing' | null; // 一時停止の前の状態
  paddleX: number;                         // パドル中心 x
  ball: Ball;
  alive: boolean[];                        // 長さ 40。index = 行 × 8 + 列
  broken: number;                          // 壊した数
  speedLevel: number;                      // 0〜3
  elapsedMs: number;                       // プレイ中だけ増える
}

interface StepInput {
  source: 'keyboard' | 'pointer';
  dir: -1 | 0 | 1;          // キーボードの向き
  pointerX: number | null;  // 論理 x（0〜480 に丸め済み）
  launch: boolean;          // このステップで取り出した発射要求
}

type GameEvent =
  | { type: 'launch' }
  | { type: 'paddle' }                              // 押し出しだけのときは出さない
  | { type: 'wall' }
  | { type: 'block'; row: number; count: number }   // row は代表ブロックの行
  | { type: 'speedUp'; level: number }
  | { type: 'clear' }
  | { type: 'gameOver' };

interface ResultSummary {
  result: 'cleared' | 'gameOver';
  broken: number; blockScore: number; timeBonus: number; total: number; elapsedMs: number;
}
```

- `step(state, input, events)` は状態を **その場で書き換え**、起きた出来事を `events` に足す（1 秒に 120 回呼ぶので、新しいオブジェクトを作らない）。処理順は製品 §5.2 のとおり。
- 発射前は `ball = (paddleX, 593)`、速度 0。発射すると `vx = speed·sin20°`、`vy = −speed·cos20°`。
- 速度段階が上がったら、`scale = 新しい速さ / |v|` を両成分に掛ける。
- `pause` は発射前・プレイ中のときだけ `pausedFrom` を覚えて `paused` にし、`resume` は `pausedFrom` に戻す。

### 5.2 ループ（`loop.ts`）

```ts
interface Accumulator { last: number | null; acc: number }
advance(a, now): number  // 進めるステップ数を返す
resetAccumulator(a)      // 再開時。止まっていた時間を進めない
```

- 初回（`last === null`）は時刻を覚えて 0 を返す。
- `acc += min(now − last, 100)`、`n = floor((acc + 1e-6) / STEP_MS)`、`acc = max(0, acc − n × STEP_MS)`。
- 画面層は `requestAnimationFrame` の時刻を渡し、`n` 回 `step` を呼ぶ。途中で発射前・プレイ中以外になったら残りを打ち切る。

### 5.3 記録（`ranking.ts`）

```ts
interface ScoreRecord {
  id: number; playerName: string; score: number;
  result: 'cleared' | 'gameOver';
  createdAt: string; // Date.prototype.toISOString() の形（UTC、ミリ秒）
}
type NameError = 'empty' | 'invalidChar' | 'tooLong';
```

| 関数 | 内容 |
| --- | --- |
| `validateName(raw)` | `trim()` → 空なら `empty` → `/[\p{Cc}\p{Cf}]/u` に当たれば `invalidChar` → `[...name].length > 12` なら `tooLong` |
| `validateScore(score, result)` | 整数、0〜2,200、10 の倍数、`gameOver` は 400 以下、`cleared` は 400 以上 |
| `validateRecord(r)` | 型、`id` は 1 以上の整数、名前は検証済みで前後に空白がない、スコア、`createdAt` が `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$` かつありえる日付 |
| `compareRecords(a, b)` | score 降順 → createdAt（文字列比較）昇順 → id 昇順 |
| `rankOf(list, r)` | 自分より上位の数 + 1 |
| `addRecord(list, r)` | 順位が 10 以下なら並べ直して上位 10 件と順位、11 以上なら `rank: null` で一覧はそのまま |

ロジック層では `Date` を使わないため、日付の検証と、登録日時の表示用のミリ秒への変換（`format.ts`）は文字列から計算する。

### 5.4 バックアップ（`backup.ts`）

```ts
interface BackupData { nextId: number; lastPlayerName: string; lastRecordId: number | null; scores: ScoreRecord[] }
type BackupError = 'unreadable' | 'otherApp' | 'tooNew' | 'invalidRecord';
```

- 書き出しは 2 字下げの JSON（項目順：`app`・`schemaVersion`・`exportedAt`・`nextId`・`lastPlayerName`・`lastRecordId`・`scores`）。
- 読み込みの判定順：JSON でない・オブジェクトでない・`app`/`schemaVersion`/`scores` がない → `unreadable`、`app` 違い → `otherApp`、`schemaVersion` が整数でない → `unreadable`、新しすぎる → `tooNew`、`scores` が配列でない・1 件でも不正・id 重複 → `invalidRecord`。
- 通ったら並び順で上位 10 件、`nextId = max(保存値（1 以上の整数でなければ 1）, 最大 id + 1)`。`lastPlayerName` は検証に通らなければ `''`、`lastRecordId` は残った記録の中になければ `null`。
- ファイル名：`<アプリ識別子>-backup-YYYYMMDD.json`（端末のタイムゾーンの日付）。

### 5.5 表示の形式（`format.ts`）

| 関数 | 内容 |
| --- | --- |
| `formatNumber` | `Intl.NumberFormat('ja-JP')`（例：`1,250`） |
| `formatSeconds(ms)` | `(floor(ms / 100) / 10).toFixed(1)`（例：95789 → `95.7`） |
| `formatDateTime(iso, timeZone?)` | `Intl.DateTimeFormat('ja-JP', { year: 'numeric', month/day/hour/minute: '2-digit', hourCycle: 'h23' })` の部品から `YYYY/MM/DD HH:mm` |
| `rankLabel(rank)` | 1〜3 は `1st`・`2nd`・`3rd`、それ以外は数字 |

---

## 6. 画面の骨組みと画面切替え

### 6.1 `index.html`

すべての画面を 1 枚の HTML に置き、`hidden` 属性で出し分ける。

| 要素 | id | 内容 |
| --- | --- | --- |
| 全体 | `main#app` | 最大幅 480、中央寄せ |
| タイトル | `section#screen-title` | `h1#title-logo`、`#title-start`（Enter のヒント `kbd.key-hint`）、`#title-ranking`、`#title-credits`、操作方法の `dl`、`#title-sound`、`#title-clear`、`#title-clear-message`（`role="status"`）、`#install-open`、`#version` |
| プレイ・結果 | `section#screen-play` | `#orientation-notice`、`#stage`（`canvas#field` と `#result-panel` を重ねる）、`#control-area`、`.play-controls`（`#pause-button`・`#play-sound`） |
| ランキング | `section#screen-ranking` | `#ranking-back`、`h2#ranking-heading`（`tabindex="-1"`）、`#ranking-content`、`#ranking-backup`（`#backup-export`・`#backup-import`・`input#backup-file`・`#backup-message`） |
| クレジット | `section#screen-credits` | `#credits-back`、`h2#credits-heading`、`dl.credits`（製品 §8.8 の表） |
| 読み上げ | `div#announcer` | `class="sr-only"`、`aria-live="polite"` |
| ダイアログ | `dialog#install-dialog`・`#clear-dialog`・`#import-dialog` | 確認の 2 つは最初のフォーカスを「キャンセル」に置く |
| 更新の帯 | `div#update-banner` | 「新しい版があります」+ `#update-button` |
| 起動失敗 | `div#boot-error` | 「うまく起動できませんでした。」+ `#boot-repair`（なおす）+「記録は消えません。」 |

- `<head>`：`viewport` は `width=device-width, initial-scale=1, viewport-fit=cover`（`user-scalable=no`・`maximum-scale` は入れない）、`theme-color` `#0B1020`、`color-scheme` `dark`、`<meta name="app-id" content="__APP_ID__">`、`mobile-web-app-capable`・`apple-mobile-web-app-capable` `yes`、`apple-mobile-web-app-status-bar-style` `black`、`apple-mobile-web-app-title`、SVG の favicon、`apple-touch-icon`。
- スクリプトは `<script src="./boot.js">` を先に、`<script type="module" src="/src/main.ts">` を後に置く。
- ゲーム領域：`<canvas id="field" role="img" aria-label="ブロック崩しミニのゲーム画面" tabindex="0">`。
- アイコンは `<span data-icon="名前">` を置き、`ui.ts` が SVG に置き換える。

### 6.2 画面切替え（`main.ts`）

| 画面 | ハッシュ | ページタイトル | 初期フォーカス |
| --- | --- | --- | --- |
| タイトル | `#/title` | ブロック崩しミニ - タイトル | `#title-start` |
| プレイ（結果を含む） | `#/play` | ブロック崩しミニ - プレイ（結果表示中は「- 結果」） | ゲーム領域 |
| ランキング | `#/ranking` | ブロック崩しミニ - ランキング | `#ranking-heading` |
| クレジット | `#/credits` | ブロック崩しミニ - クレジット | `#credits-heading` |

切替えの手順：

1. プレイ画面から離れるなら、ループと入力を止める。
2. 対象の `section` だけを出し、`body[data-screen]` とページタイトルを変える。
3. ページの先頭へスクロールする。
4. 初期化：プレイは新しいゲーム、ランキングは保存から読み直す、タイトルは全消去のメッセージを消す。
5. 初期フォーカスを置く。
6. 更新の帯は、タイトル・ランキングのときだけ出してよい。

- ボタンからの移動は `history.pushState` で履歴に積む。戻るボタン・手入力は `hashchange` で受け、不明なハッシュは `#/title` に置き換える。`#/play` に来たら常に新しいゲーム。
- 起動の最後に `window.__appStarted = true` を立てる（本書 §11.4）。

---

## 7. 描画とレイアウト

### 7.1 色

`style.css` の `:root` に変数として置き、ほかで直書きしない。Canvas の色も、起動時に `getComputedStyle` でここから読む。

| 変数 | 値 | 変数 | 値 |
| --- | --- | --- | --- |
| `--bg` | `#0b1020` | `--primary` | `#4fc3f7` |
| `--field` | `#050814` | `--primary-text` | `#0b1020` |
| `--field-frame` | `#3a4468` | `--accent` | `#ffd54f` |
| `--surface` | `#141b2e` | `--success` | `#66bb6a` |
| `--surface-2` | `#1c2540` | `--danger` | `#ff6b6b` |
| `--border` | `#3a4468` | `--ball` | `#ffffff` |
| `--text` | `#e6eaf2` | `--pause-veil` | `rgb(11 16 32 / 0.75)` |
| `--muted` | `#a0aabf` | `--result-dim` | `50%` |
| `--block-1`〜`--block-5` | `#ef5350`・`#ffa726`・`#ffd54f`・`#66bb6a`・`#4fc3f7` | | |

- 文字：`--font-body: system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif`、`--font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace`。Web フォントは使わない。
- 余白：`--gutter: max(16px, env(safe-area-inset-left), env(safe-area-inset-right))`、`--safe-top: calc(env(safe-area-inset-top, 0px) + 24px)`、`--safe-bottom: max(16px, env(safe-area-inset-bottom))`。`main` の padding は `max(10px, var(--safe-top)) var(--gutter) var(--safe-bottom)`。
- `body`：`min-height: 100dvh`、`font-size: 16px`、`line-height: 1.6`、`overflow-x: hidden`。`[hidden]` は `display: none !important`。
- `prefers-reduced-motion: reduce` のときは装飾のアニメーションを止める（製品 §8.1）。

### 7.2 Canvas

- 論理座標 480 × 640 で描き、`ctx.setTransform` で表示サイズ × `devicePixelRatio` に拡大する。`canvas.width/height = round(表示サイズ × dpr)`。
- 描画順・文字の大きさは製品 §2.2。HUD は `bold 18px` の等幅、ヒントは `14px`、PAUSED は `bold 28px`（本文の書体）。パドルは `roundRect(…, 4)`。
- 結果表示中は最後の盤面を不透明度 50% で描く。
- マウスでプレイ中は、canvas に `data-hide-cursor` 属性を付けてカーソルを隠す。

### 7.3 表示サイズ（`layout.ts`・`play.ts`）

```
availableWidth  = min(innerWidth, 480) − 32
availableHeight = innerHeight − main の padding-top − controlsHeight − main の padding-bottom
width  = floor(max(288, min(availableWidth, availableHeight × 3/4)))
height = floor(width × 4/3)
```

- `controlsHeight` は 56（間隔 8 + ボタン 48）。タッチ端末（`matchMedia('(pointer: coarse)')`）では、さらに 104（間隔 8 + 操作空間 96）を足す。
- `resize`・`orientationchange` で計算し直す。結果表示中は **幅が変わったときだけ** 計算し直す。
- 結果表示中は操作空間を隠すが、ゲーム領域の大きさはプレイ中と同じにする。
- 操作欄の幅もゲーム領域と同じにする（CSS 変数 `--stage-width`）。
- 横向き（`innerWidth > innerHeight`）で `width ≤ 288` なら `#orientation-notice` を出す。

---

## 8. 入力

製品 §4 をポインタイベントとキーボードイベントで実装する。

- **キー**は `KeyboardEvent.code` で判定する（`ArrowLeft`・`ArrowRight`・`KeyA`・`KeyD`・`Space`・`KeyP`・`Escape`・`Enter`）。`event.repeat` が true の Space・P・Esc は無視する。
- **ポインタ**は `pointerdown`・`pointermove`・`pointerup`・`pointercancel` を canvas と `#control-area` で受ける。タッチ・ペンは押したポインタを `setPointerCapture` 相当で追い、最初の指の `pointerId` だけを使う。マウスは左ボタン以外の `pointerdown` を無視し、`pointermove` だけで追従する。
- 押してから離すまでの移動が論理 10 px 以内なら、離した時点で発射要求を 1 回分蓄える。
- canvas と `#control-area` には CSS の `touch-action: none`、`user-select: none`、`-webkit-touch-callout: none` を付け、`contextmenu` を `preventDefault()` する。ゲーム中は ← → Space の `preventDefault()`。
- `blur`・`pointercancel`・一時停止で、押下中のキーとタッチの追従を解く。再開時は蓄えた発射要求を捨てる。
- `visibilitychange` で `document.hidden` になったら、発射前・プレイ中なら一時停止する（自動では再開しない）。
- 入力元が最後にマウスだったかを `usingMouse()` で返し、カーソルを隠す判断に使う。
- 結果画面の 500 ms の入力ガードと、部品にフォーカスがあるときの Enter の扱いは製品 §4.1-8・9。フォーカスの判定は `button, input, select, textarea, a[href], summary, [contenteditable="true"]`。
- 結果パネルの名前入力欄に初期フォーカスを置くのは `matchMedia('(hover: hover) and (pointer: fine)')` のときだけ。

---

## 9. 端末内保存

### 9.1 キー

localStorage に、キー `<アプリ識別子>-<名前>`、値は JSON 文字列で保存する。

| キー | 型 | 内容 | 初期値（ないとき） |
| --- | --- | --- | --- |
| `mini-blockbreaking-game-schema` | number | 保存の形の版（`SCHEMA_VERSION = 1`） | 起動時に 1 を書く |
| `mini-blockbreaking-game-scores` | `ScoreRecord[]` | 上位 10 件（並び順） | `[]` |
| `mini-blockbreaking-game-nextId` | number | 次の id | 1 |
| `mini-blockbreaking-game-lastName` | string | 前回の名前 | `''` |
| `mini-blockbreaking-game-lastRecordId` | number \| null | 自分の記録 id | `null` |
| `mini-blockbreaking-game-sound` | boolean | 効果音（`false` のときだけオフ） | オン |

sessionStorage には復旧用の `mini-blockbreaking-game:boot-repair-at`（本書 §11.4）だけを置く。

### 9.2 読み書きの決まり（`storage.ts`・`records.ts`）

- `load(key, fallback)`：読めない・ない・JSON が壊れているときは `fallback`。`tryLoad` は読めなかったことを区別して返す（ランキング画面の「読み込めませんでした」に使う）。
- `save(key, value)`：書けたら true。例外は外に出さない。
- `saveAll(entries)`：複数のキーを書き、途中で失敗したら **書く前の値に戻して** false。登録・全消去・読み込みはこれで行う。
- 起動時に `migrateStorage()`（版が古ければ移行し、版を書く。版 1 では移行の中身はない）と `navigator.storage.persist()`（対応していれば）を呼ぶ。
- `loadRanking()`：`scores` が配列でない、1 件でも `validateRecord` に通らないときは失敗。
- 次の id は `max(保存値（1 以上の整数でなければ 1）, 保存済みの最大 id + 1)`。
- 登録（`register`）：常に `nextId + 1` と `lastName` を書く。10 位以内のときだけ `scores` と `lastRecordId` も書く。`createdAt` は `new Date().toISOString()`。
- 全消去（`clearRanking`）：`scores: []`、`lastRecordId: null` だけを書く。
- バックアップの反映（`restoreBackup`）：`scores`・`nextId`・`lastName`・`lastRecordId` を 1 回の `saveAll` で置き換える。
- 前回の名前は、読んだ値が `validateName` に通らなければ `''`。

---

## 10. 効果音の音色

製品 §8.7 の出来事・規則を、次の音色で実装する（`sound.ts`）。値は手動テストで聞いて決めたもの。

### 10.1 音の作り

1 音 = オシレーター 1 つ + ゲイン 1 つ。音量は 0.0001 から 5 ms で `volume` まで直線で上げ、音の終わりまでに指数で 0.0001 まで下げる。複数の音は続けて鳴らす。`to` がある音は、長さの間に周波数を直線で `to` まで変える。全体の音量（マスターゲイン）は 0.25。

| 音 | 波形 | 音（周波数 Hz・長さ ms） | 音量の倍率 |
| --- | --- | --- | --- |
| launch（発射） | square | 440→880 を 80 | 1 |
| paddle（パドル） | triangle | 330・70 | 1 |
| wall（壁・天井） | square | 1200・25 | 0.4 |
| block（ブロック） | square | 行 0〜4 の順に 1047・880・784・659・523、各 60 | 1 |
| speedUp（加速） | square | 660・60 → 990・60 | 1 |
| clear（クリア） | triangle | 523・120 → 659・120 → 784・120 → 1047・300 | 1 |
| gameOver（ゲームオーバー） | sawtooth | 392・200 → 330・200 → 262・400 | 1 |
| register（登録成功） | triangle | 784・80 → 1047・80 | 1 |

### 10.2 鳴らす判断（`sound-plan.ts`）

- 1 フレームの出来事の中に `clear` か `gameOver` があれば、それだけを鳴らす。
- それ以外は `launch`・`paddle`・`wall`・`block`・`speedUp` の順に、種類ごとに 1 回。`block` の高さは、そのフレームで最初の `block` の出来事の行。
- `register` は登録に成功したときに直接鳴らす。

### 10.3 初期化と停止

- `AudioContext`（なければ `webkitAudioContext`）は、最初の操作で作る。`pointerdown`・`pointerup`・`touchend`・`click`・`keydown` を document の capture で聞き、`state === 'running'` になるまで試し続ける（スマートフォンでは `pointerdown` が「操作」と認められないブラウザがあるため）。作成に失敗したら以後は作らず、音なしで続ける。
- `visibilitychange` で隠れたら鳴っている音を止めて `suspend()`、表示に戻ったら `resume()`。一時停止・画面を離れる・オフにしたときも、鳴っている音を全部止める。
- 鳴らす判断をしたら、鳴らさない場合も含めて `window` に `app:sound` イベント（`detail: { name, muted }`）を出す（E2E 用）。

---

## 11. PWA（インストール・オフライン・更新・復旧）

### 11.1 manifest と Service Worker（`vite.config.ts` の `VitePWA`）

| 設定 | 値 |
| --- | --- |
| `registerType` | `'prompt'`（新しい版は待機させ、「更新」ボタンで切り替える） |
| `includeAssets` | `icons/icon.svg`、`icons/apple-touch-icon.png` |
| `manifest.name` / `short_name` | ブロック崩しミニ |
| `manifest.description` | スマートフォンで遊べる、1 ステージのブロック崩し |
| `lang` / `display` / `orientation` | `ja` / `standalone` / `portrait` |
| `start_url` / `scope` | `./` / `./` |
| `theme_color` / `background_color` | `#0B1020` / `#0B1020` |
| `icons` | 192（any）、512（any）、512 maskable、SVG（sizes `any`） |
| `workbox.globPatterns` | `**/*.{js,css,html,svg,png,webmanifest}`（すべてを事前キャッシュ） |
| `workbox.navigateFallback` | `index.html` |

ビルドで `dist/manifest.webmanifest` と `dist/sw.js` ができる。

### 11.2 インストール方法（`install.ts`）

- インストール済みの判定：`matchMedia('(display-mode: standalone)').matches` か `navigator.standalone === true`。インストール済みなら `#install-open` を出さない。
- ダイアログの 3 つの `details`（`data-platform` が `ios`・`android`・`pc`）のうち、今の端末のものだけを最初から開く。
- `beforeinstallprompt` を受けたら保存しておき、`#install-now`（今すぐインストール）を出す。

### 11.3 更新（`pwa.ts`）

- 本番ビルド（`import.meta.env.PROD`）で、Service Worker が使えるときだけ `registerSW({ onNeedRefresh })`（`virtual:pwa-register`）を呼ぶ。開発サーバーでは登録しない。
- `onNeedRefresh` で「新しい版がある」を覚え、タイトル・ランキング画面のときだけ `#update-banner` を出す。プレイ画面では隠す。
- `#update-button` で `updateSW(true)`（待機中の版に切り替えて読み込み直す）。

### 11.4 起動の見張りと復旧（`public/boot.js`）

ビルドを通さない普通のスクリプト（ES5 相当で書く。`main.ts` が読めなくても動くため）。

1. `<meta name="app-id">` からアプリ識別子を読む。範囲（scope）は `new URL('./', location.href).href`。
2. `load` から 8,000 ms（`window.__bootWaitMs` があればその値）たっても `window.__appStarted` が true でなければ、起動の失敗とみなす。
3. sessionStorage の `<アプリ識別子>:boot-repair-at` に前回の復旧時刻があり、2 分以内なら、自動で直さず `#boot-error` と「なおす」ボタンを出す（色は CSS が読めない場合に備えてスクリプトに直接書く：背景 `#0B1020`、文字 `#E6EAF2`、枠 `#3A4468`、ボタン `#4FC3F7`、ボタンの最小高さ 48）。
4. それ以外は復旧する：時刻を書き、**範囲がこのアプリのものだけ** の Service Worker を `unregister` し、**名前に範囲を含むキャッシュだけ** を削除して `location.reload()`。localStorage は消さない。

---

## 12. アイコン

`scripts/make-icons.mjs`（`npm run icons`）で `public/icons/` に作り、生成物をコミットする。外部ライブラリは使わず、PNG は `node:zlib`（`deflateSync`・`crc32`）で組み立てる。

- 図柄：背景 `#0B1020` に、5 行 × 4 列のブロック（行ごとに製品 §3.4 の 5 色。最下段の中央 2 個は崩れて欠けている）、白いボール、`#E6EAF2` のパドル。
- 図柄は 0〜1 の座標で定義：ブロック帯は左 0.14・幅 0.72・間隔 0.03・高さ 0.06・上端 0.16・行の間隔 0.085、角丸 0.012。ボールは中心 (0.5, 0.64)・半径 0.05。パドルは左 0.34・上 0.78・幅 0.32・高さ 0.045・角丸 0.022。
- 作るもの：`icon.svg`、`icon-192.png`、`icon-512.png`、`icon-maskable-512.png`（切り抜かれても欠けないよう、図柄を 0.7 倍に縮めて中央に置く）、`apple-touch-icon.png`（180 × 180）。

画面内のアイコン（`icons.ts`）は viewBox 24 × 24 の線画で、`check-circle`・`x-circle`・`pause`・`play`・`sound-on`・`sound-off`・`arrow-left`・`download`・`upload`・`install`・`rotate` の 11 種類。線の太さ・色は CSS の `.icon` で決める。

---

## 13. テスト用の入口

Canvas の中身は E2E から読めないため、状態を外から見る・変える入口を用意する。

| 入口 | 条件 | 内容 |
| --- | --- | --- |
| `body[data-screen]` | 常に | `title`・`play`・`ranking`・`credits` |
| `body[data-game-state]` と `window` の `app:state` イベント | 常に | ゲームの状態が変わるたびに `ready`・`playing`・`paused`・`cleared`・`gameOver` |
| `window` の `app:sound` イベント | 常に | 本書 §10.3 |
| `window.__breakout.snapshot()` | URL に `?debug=1` | `GameState` の写し（`structuredClone`） |
| `window.__breakout.setup(partial)` | 同上 | `status`（`ready`/`playing`）・`paddleX`・`ball` の一部・`aliveIds`（指定した ID だけ生かす）・`broken`・`speedLevel`・`elapsedMs` を書き換えて描き直す |
| `window.__breakout.showUpdateBanner()` | 同上 | 「新しい版があります」の帯を出す |
| `window.__bootWaitMs` | 読み込み前に設定 | 起動の見張りの待ち時間を短くする |

---

## 14. テスト

### 14.1 単体テスト（Vitest）

- `tests/*.test.ts`、node 環境。対象はロジック層と `storage.ts`・`records.ts`（`tests/fake-storage.ts` で localStorage を差し替える）。
- ファイル：`backup`・`collision`・`format`・`game`・`layout`・`loop`・`ranking`・`records`・`render`・`score`・`sound-plan`・`storage`。
- テスト名の先頭にテストケースの確認 ID を付ける（例：`TC-0002-03 …`）。テストケースは `doc/05_test/` にある。

### 14.2 E2E（Playwright）

- 本番と同じ成果物で試す：`webServer` は `npm run build && npm run preview -- --port 4173 --strictPort`、`baseURL` は `http://localhost:4173`（Service Worker も本物が動く）。
- プロジェクトは 2 つ：`pixel7`（`devices['Pixel 7']`）と `small`（375 × 667、`isMobile`・`hasTouch`、`deviceScaleFactor: 2`、Pixel 7 の userAgent）。
- `reducedMotion: 'reduce'` を既定にする（アニメーションを見るテストだけ解除）。CI では `forbidOnly`、レポートは `list` + `html`。
- spec ファイル：`a11y`・`backup`・`boot`・`clear`・`credits`・`keyboard-mouse`・`layout`・`pause`・`play`・`pwa`・`ranking`・`register`・`result`・`sound`・`title`・`touch`。共通の操作は `e2e/helpers.ts`、バックアップのファイルは `e2e/fixtures/`（`valid`・`broken`・`invalid-score`・`other-app`・`too-new`）。

### 14.3 成果物の検査（`scripts/check-dist.mjs`）

`npm run build` の後に `dist/` を確かめる。

- `manifest.webmanifest` があり、`index.html` から読み込む。`name` が「ブロック崩しミニ」、`display` が `standalone`、`start_url` がある、`orientation` が `portrait`。
- アイコン 192（any）・512（any）・512（maskable）が manifest にあり、ファイルもある。`apple-touch-icon` がある。`sw.js` がある。
- `index.html` に `#install-open`・`#version`・`#boot-error` があり、`boot.js` を読み込み、`<meta name="app-id" content="mini-blockbreaking-game">` がある。`boot.js` が `__appStarted` を見ている。

### 14.4 手動テスト

iPhone の Safari と Android の Chrome の実機で、タッチ操作・効果音・ホーム画面への追加・オフライン起動・更新を確かめる（E2E の Chromium では分からないもの）。

---

## 15. CI と公開

### 15.1 `test.yml`（PR と `main` への push）

| ジョブ | 内容 |
| --- | --- |
| `check` | Node 24（npm のキャッシュ）→ `npm ci` → `npm run verify`（lint → 単体テスト → build → check:dist）。10 分で打ち切り |
| `e2e` | `npm ci` → `npx playwright install chromium`（4 分で打ち切り、3 回まで試す。`--with-deps` は使わない）→ `npm run test:e2e`。失敗したら `playwright-report/` を 7 日保存。20 分で打ち切り |

`permissions: contents: read`。同じブランチの古い実行は取り消す。

### 15.2 `pages.yml`（`main` への push と手動）

`npm ci` → `npm run build` → `npm run check:dist` → `actions/configure-pages` → `actions/upload-pages-artifact`（`dist`）→ `actions/deploy-pages`。権限は `contents: read`・`pages: write`・`id-token: write`。公開は 1 つずつ（途中の公開を止めない）。

最初の公開の前に、GitHub の Settings → Pages の Source を「GitHub Actions」にする。

### 15.3 `dependabot.yml`

npm と github-actions を週に 1 回。開発用の依存は 1 つの PR にまとめる。`typescript` と `@types/node` の大きな版上げは提案させない。

---

## 16. 再現の進め方

もとのプロジェクトは、次の順で作った（`doc/06_plan/` の WS-0001〜0009）。同じ順に進めると、各段階でテストが通る状態を保てる。

| 順 | 内容 | 主なファイル | 確かめ方 |
| --- | --- | --- | --- |
| 1 | 土台：`package.json`・設定ファイル・CI・空の画面 | 本書 §3・§15 | `npm run verify` が通る |
| 2 | パラメータとゲームのロジック | `config`・`collision`・`game`・`score`・`loop` | 単体テスト（製品 §12.1 の数値） |
| 3 | 描画とプレイ画面 | `render`・`layout`・`play` | 画面でボールが動く |
| 4 | 入力（タッチ・マウス・キーボード）と一時停止 | `input`・`play` | E2E `touch`・`keyboard-mouse`・`pause` |
| 5 | 結果パネル | `result-panel`・`format` | E2E `result`・`clear` |
| 6 | ランキングと保存 | `storage`・`ranking`・`records`・`ranking-view` | 単体テスト、E2E `register`・`ranking` |
| 7 | バックアップと全消去 | `backup`・`records` | E2E `backup`・`title` |
| 8 | 効果音 | `sound-plan`・`sound` | 単体テスト、E2E `sound`、実機で聞く |
| 9 | PWA・アイコン・復旧 | `pwa`・`install`・`boot.js`・`make-icons` | `check:dist`、E2E `pwa`・`boot` |
| 10 | アクセシビリティ・クレジット・仕上げ | `announce`・`ui`・`icons`・`style.css` | E2E `a11y`・`credits`・`layout`、実機の手動テスト |

---

## 17. 再現の確認

再現できたと言えるのは、次をすべて満たしたとき。

- [ ] 製品仕様 §12 の受け入れ基準をすべて満たす
- [ ] `npm run verify` と `npm run test:e2e`（`pixel7`・`small` の両方）が通る
- [ ] ESLint の層の決まり（本書 §3.4）に違反がない（ロジック層に DOM・時刻・乱数がない）
- [ ] 実行時の依存がなく、外部のリソース（Web フォント・CDN・音声ファイル）を読み込まない
- [ ] localStorage のキーと値の形が本書 §9.1 と同じ（もとの版で書き出したバックアップをそのまま読み込める）
- [ ] 効果音が本書 §10.1 の音色で鳴る
- [ ] iPhone の Safari と Android の Chrome の実機で、ホーム画面に追加して通信なしで起動・プレイ・登録できる

---

## 18. 別の環境に移すときの注意

- **アプリ識別子**：同じサイト（オリジン）に別のアプリと並べて置くときは、`package.json` の `name` を変えれば保存のキー・バックアップの `app`・復旧の範囲がまとめて変わる。ただし、変えると **もとの版の記録・バックアップとは互換がなくなる**（別のアプリの記録として扱われる）。同じアプリとして引き継ぐなら変えない。`scripts/check-dist.mjs` の `APP_ID` も合わせる。
- **配信の場所**：`base: './'` と manifest の `start_url`・`scope: './'` により、ドメインの直下でもサブパスでも動く。HTTPS（または `localhost`）でないと Service Worker が動かない。
- **保存の形を変えるとき**：`SCHEMA_VERSION` を上げ、`migrateStorage` とバックアップの読み込みに古い形からの移行を足す。古い記録は捨てない（製品 §9.1）。
- **バージョンを上げるとき**：`package.json` の `version` だけを変える。タイトル画面の表示と、Service Worker の更新の確認（製品 §8.6）に使う。
- **依存の版**：本書 §2.1 の版より新しいものを使うときは、vite-plugin-pwa の `registerType: 'prompt'` と `virtual:pwa-register` の使い方、Playwright のデバイス定義（Pixel 7）が変わっていないかを確かめる。
- **公開リポジトリにするとき**：ほかのプロジェクトの内部情報・個人の ID・機密を含むファイルを入れない。
