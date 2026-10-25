---
id: MBRK-TD-0004
type: Technical Design
title: 記録（保存・ランキング・バックアップ・結果パネル・ランキング画面）
status: stable
version: 1.1
updated: 2026-10-25
sources:
  - MBRK-TD-0001
  - MBRK-ADR-0006
  - MBRK-ADR-0007
  - MBRK-GUI-0002
  - MBRK-GUI-0004
  - MBRK-GUI-0005
  - MBRK-GUI-0006
  - MBRK-US-0006
  - MBRK-US-0011
  - MBRK-US-0012
  - MBRK-US-0013
  - MBRK-US-0014
  - MBRK-US-0022
  - doc/specification.md (v1.2) §4.1-8、§8.2、§8.3、§8.4、§9
  - simple_shogi src/storage.ts、src/backup.ts
verified: null
---

# TD-0004 記録

対象のファイルは `storage.ts`・`ranking.ts`・`records.ts`・`backup.ts`・`result-panel.ts`・`ranking-view.ts`・`format.ts`。

## 1. 保存（`storage.ts`）

`simple_shogi` の `storage.ts` をもとに、書き込みの成否を返すようにする（ADR-0006）。

```ts
const PREFIX = __APP_ID__;                     // 'mini-blockbreaking-game'
export const SCHEMA_VERSION = 1;

/** 読めないとき・値がないときは fallback */
export function load<T>(key: string, fallback: T): T;
/** 読み出しの失敗を区別したいとき（ランキング画面）に使う */
export function tryLoad(key: string): { ok: true; value: unknown } | { ok: false };
/** 書けたら true */
export function save(key: string, value: unknown): boolean;
/** 全部書けたら true。途中で失敗したら、書く前の値に戻して false */
export function saveAll(entries: Record<string, unknown>): boolean;
export function migrateStorage(): void;        // 起動時。schema が古ければ移行（版 1 では移行なし）
export function requestPersist(): void;
```

保存のキー（`<PREFIX>-<名前>`）と値：

| 名前 | 型 | 既定値 |
| --- | --- | --- |
| `schema` | `number` | 0（未保存）→ 起動時に 1 |
| `scores` | `ScoreRecord[]`（上位 10 件、並び順のとおり） | `[]` |
| `nextId` | `number` | 1 |
| `lastName` | `string` | `''` |
| `lastRecordId` | `number \| null` | `null` |
| `sound` | `boolean` | `true` |

- `saveAll` は、書く前に各キーの元の文字列（なければ `null`）を覚えておき、失敗したら元に戻す（`null` のキーは消す）。戻すのにも失敗したら、何もしない（例外を外に出さない）。

## 2. ランキングの規則（`ranking.ts`、ロジック層）

```ts
export interface ScoreRecord {
  id: number; playerName: string; score: number;
  result: 'cleared' | 'gameOver'; createdAt: string;   // ISO 8601（UTC、ミリ秒）
}
export type NameError = 'empty' | 'invalidChar' | 'tooLong';

export function normalizeName(raw: string): string;                   // 前後の空白を除く
export function countChars(name: string): number;                     // コードポイント数（[...name].length）
export function validateName(raw: string): { ok: true; name: string } | { ok: false; error: NameError };
export function validateScore(score: unknown, result: unknown): boolean; // 仕様書 §9.3 のスコアの規則
export function validateRecord(r: unknown): r is ScoreRecord;         // 項目の型・名前・スコア・日時の形
export function compareRecords(a: ScoreRecord, b: ScoreRecord): number; // score 降順 → createdAt 昇順 → id 昇順
export function rankOf(list: ScoreRecord[], r: ScoreRecord): number;  // 上位の数 + 1（仕様書 §9.4）
export function addRecord(list: ScoreRecord[], r: ScoreRecord): { list: ScoreRecord[]; rank: number | null };
                                                                      // rank が 10 以下なら新しい一覧（上位 10 件）、11 以上なら null で一覧はそのまま
```

- 文字の種類の判定は、正規表現 `/[\p{Cc}\p{Cf}]/u`（Unicode の一般カテゴリ Cc・Cf）。判定の順は `empty` → `invalidChar` → `tooLong`。
- 空白の除去は `String.prototype.trim()`（Unicode の空白を含む）。
- `createdAt` の比較は文字列の比較で行う（同じ形の ISO 8601 の UTC なので、文字列の順 = 時刻の順）。

## 3. 記録の読み書き（`records.ts`、基盤）

```ts
export function loadRanking(): { ok: true; scores: ScoreRecord[]; myId: number | null } | { ok: false };
export function register(name: string, summary: ResultSummary, now: Date):
  { ok: true; rank: number | null; record: ScoreRecord } | { ok: false };
export function loadLastName(): string;
/** 記録の全消去（仕様書 v1.2 §9.2）。書けたら true */
export function clearRanking(): boolean;
```

`clearRanking` は `saveAll({ scores: [], lastRecordId: null })`。`nextId`・`lastName`・`sound` には触れない（id を再利用しないため）。途中で失敗したら `saveAll` が元に戻すので、何も変わらない。`scores` が壊れていても消せる（読まずに書く）。

`register` の処理：

1. `loadRanking()`。失敗なら `{ ok: false }`。
2. `record = { id: nextId, playerName: name, score: summary.total, result: summary.result, createdAt: now.toISOString() }`。
3. `addRecord(scores, record)`。
4. `saveAll({ nextId: nextId + 1, lastName: name, scores: 新しい一覧, lastRecordId: rank ≤ 10 なら record.id })`。圏外のときは `scores` と `lastRecordId` を書かない。
5. 書けたら `{ ok: true, rank, record }`、書けなければ `{ ok: false }`。

- `loadRanking` は、`scores` が配列でない・1 件でも `validateRecord` に通らないときは `{ ok: false }`（読み込み失敗の表示にする）。

## 4. バックアップ（`backup.ts`、ロジック層）

```ts
export interface BackupData { nextId: number; lastPlayerName: string; lastRecordId: number | null; scores: ScoreRecord[] }
export type BackupError = 'unreadable' | 'otherApp' | 'tooNew' | 'invalidRecord';

export function createBackup(data: BackupData, now: Date): string;   // 仕様書 §9.6 の JSON（2 字下げ）
export function parseBackup(text: string): { ok: true; data: BackupData } | { ok: false; error: BackupError };
export function backupFileName(now: Date): string;                   // 'mini-blockbreaking-game-backup-YYYYMMDD.json'（端末のタイムゾーン）
```

`parseBackup` の判定の順（最初に当てはまったもので返す）：

| 順 | 条件 | 結果 |
| --- | --- | --- |
| 1 | JSON として読めない、オブジェクトでない、`app`・`schemaVersion`・`scores` がない | `unreadable` |
| 2 | `app` が `__APP_ID__` と違う | `otherApp` |
| 3 | `schemaVersion` が `SCHEMA_VERSION` より大きい | `tooNew` |
| 4 | `scores` が配列でない、1 件でも `validateRecord` に通らない、`id` が重複 | `invalidRecord` |
| — | 通った | 並び順に並べて上位 10 件、`nextId` を `max(nextId, 最大 id + 1)` にそろえて返す |

- `schemaVersion` が古い場合の移行は、版 1 しかないので今はない。版を上げたら、ここに移行を足す。
- `lastPlayerName` は名前の規則に通らなければ `''`、`lastRecordId` は `scores` にない id なら `null` にする。

画面での書き出し・読み込み（`ranking-view.ts`）：

- 書き出し：`createBackup` の文字列を `Blob`（`application/json`）にし、`<a download>` をクリックして保存する。
- 読み込み：`<input type="file">` で選ぶ → `file.text()` → `parseBackup`。失敗なら理由を表示（仕様書 §9.6 の文）。成功なら確認ダイアログ（GUI-0006 §2）→「読み込む」で `saveAll`（`scores`・`nextId`・`lastName`・`lastRecordId`）→ 成功「記録を読み込みました（n 件）」と表を作り直す。保存に失敗したら「保存できませんでした。もう一度お試しください」。

## 5. 結果パネル（`result-panel.ts`）

```ts
export function showResultPanel(summary: ResultSummary, actions: { retry(): void; title(): void; ranking(): void }, deps: { sound: Sound; announce: Announce }): void;
export function hideResultPanel(): void;
```

| 項目 | 処理 |
| --- | --- |
| 中身 | GUI-0004 の形に、`summary` から内訳・合計を作る（`format.ts`）。ゲームオーバーではブロック・時間ボーナス・タイムの行を作らない |
| 名前の入力 | `input` イベントで `validateName` → 補助の文字と REGISTER の状態を更新。`empty` は `blur` を一度経たあとだけ表示 |
| 登録 | REGISTER・入力欄の Enter で `register()`。成功：入力欄と REGISTER を `disabled`、メッセージ、`sound.play('register')`、RETRY にフォーカス。失敗：メッセージ（再度押せる） |
| 入力ガード | 表示した時刻を覚え、500 ms 以内の `keydown`（Enter・Space）とパネル上の `pointerdown`・`click` を、キャプチャ段階で `preventDefault()` と `stopPropagation()` で止める |
| Enter | フォーカスが入力欄・ボタンにないときの Enter は RETRY（仕様書 §4.1-9） |
| 初期フォーカス | `matchMedia('(hover: hover) and (pointer: fine)')` が真なら入力欄（カーソルを末尾に）、偽なら見出し |
| 二重登録 | 一度成功したら、同じパネルでは登録できない（新しいゲームでパネルを作り直す） |

## 6. ランキング画面（`ranking-view.ts`）

| 場面 | 処理 |
| --- | --- |
| 開いたとき | `loadRanking()` → 記録あり：表、0 件：空の表示、失敗：失敗の表示（GUI-0005 §3）。見出しにフォーカス |
| 表の行 | 順位（1〜3 は `1st` など）、名前（`textContent`、`title` に全文）、自分の記録なら「（あなた）」と行のクラス、2 段目に結果と日時、スコア |
| 再読み込み | もう一度 `loadRanking()` |
| Esc / BACK | タイトルへ（`main.ts` のコールバック） |

## 6.1 記録の全消去（タイトル画面、`main.ts`）

| 場面 | 処理 |
| --- | --- |
| 「記録を全部消す」（`#title-clear`） | 結果のメッセージを空にし、`#clear-dialog`（GUI-0006 §2.1）を `showModal()`。最初のフォーカスは「キャンセル」 |
| 「消す」 | ダイアログを閉じて `clearRanking()`。成功：「記録を消しました」（`is-success`）、失敗：「消せませんでした。もう一度お試しください」（`is-danger`） |
| 「キャンセル」・Esc | ダイアログを閉じるだけ |
| 閉じたあと | `#title-clear` にフォーカスを戻す |
| タイトル画面を開き直したとき | 結果のメッセージを空にする |

- ダイアログは `index.html` に置く（インストール方法のダイアログと同じ作り）。「消す」は `<button class="danger">`。
- タイトル画面の Enter（START）は、ダイアログが開いている間は動かさない（`main.ts` の `onKeyDown` はすでに `dialog[open]` を見て止めている）。

## 7. 表示の形式（`format.ts`、ロジック層）

| 関数 | 例 |
| --- | --- |
| `formatNumber(1250)` | `1,250`（`Intl.NumberFormat('ja-JP')`） |
| `formatSeconds(95789)` | `95.7`（`floor(ms / 100) / 10` を小数 1 桁で） |
| `formatDateTime(iso, timeZone?)` | `2026/10/23 12:15`（端末のタイムゾーン、24 時間制。テストではタイムゾーンを渡す） |
| `rankLabel(n)` | `1st` / `2nd` / `3rd` / `4` … |
