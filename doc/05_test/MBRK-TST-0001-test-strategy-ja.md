---
id: MBRK-TST-0001
type: Test Strategy
title: テスト戦略
status: stable
version: 1.3
updated: 2026-10-25
sources:
  - MBRK-PB-0001
  - MBRK-ADR-0003
  - MBRK-ADR-0004
  - MBRK-ADR-0005
  - MBRK-ADR-0008
  - MBRK-TD-0001
  - MBRK-TD-0002
  - MBRK-TD-0005
  - doc/specification.md (v1.2) §10、§12
  - simple_shogi CLAUDE.md（テスト）、e2e/app.spec.ts
verified: null
---

# TST-0001 テスト戦略

## 1. 目的

仕様書 §12 の受け入れ基準 54 項目（v1.1 の 52 項目に、v1.2 で操作空間・記録の全消去の 2 項目を足した）と、ユーザーストーリーの受け入れ条件のすべてを、どれかのテストで確かめる。確かめた結果は、実装タスクごとの attested-computation（AC）に残す。

## 2. テストの種類

| 種類 | 道具 | 対象 | どこで動かすか |
| --- | --- | --- | --- |
| 単体テスト | Vitest（Node 環境） | ロジック層（`config`・`game`・`collision`・`score`・`loop`・`layout`・`ranking`・`backup`・`sound-plan`・`format`）、`render`（偽の Canvas）、`storage`・`records`（偽の localStorage） | 手元・CI（全 PR） |
| 画面テスト（E2E） | Playwright（Chromium） | 画面の切替え・入力・表示・保存・PWA。build 済みの成果物を `vite preview` で配信 | 手元・CI（全 PR）。プロジェクト `pixel7` と `small`（375 × 667）の 2 つ |
| ビルド検査 | `npm run build`（型チェック）・`npm run lint`・`npm run check:dist` | 型・書き方・PWA の成立 | 手元・CI（全 PR） |
| 手動テスト | 実機とブラウザ | 自動では確かめられないもの（§5） | 段階の終わり・リリース前 |

### 2.1 種類の選び方

- 受け入れ条件ごとに、**確かめられるいちばん下の種類**を主にする（単体 → E2E → 手動の順）。速く、壊れにくいため。
- 物理・スコア・順位・検証などの規則は単体テストで確かめ、E2E では「画面につながっていること」を代表の 1 例で確かめる。
- 手動テストは、実機の感覚・端末固有の動き（iPhone の Safari・インストール・音）だけにする。

## 3. 単体テストのやり方

- ファイル：`tests/<対象>.test.ts`（例：`tests/collision.test.ts`）。
- 状態は `createGame()` で作り、必要な所だけ書き換えて `step` を呼ぶ（TD-0002）。小数は `toBeCloseTo(値, 2)` で比べる。
- 不変条件（例：垂直成分が速さの 0.5 倍以上）は、決まった入力列で数千ステップ動かし、毎ステップ確かめる。
- `render` は、呼ばれた描画命令を記録する偽の `CanvasRenderingContext2D` で確かめる（描く文字・色・順番）。
- `storage`・`records` は、`globalThis.localStorage` に置き換え可能な偽物を入れて確かめる（失敗させる偽物も作る）。
- 日時は `Date` を引数で渡し、タイムゾーンは `formatDateTime` の引数で固定する。

## 4. E2E のやり方

- ファイル：`e2e/<画面・機能>.spec.ts`。2 つのプロジェクトの両方で動かす（画面サイズに関係しないテストは `pixel7` だけでもよい。`test.skip` で明示する）。
- 時間：`page.clock`（Playwright の時計）で `requestAnimationFrame`・`performance.now`・`Date` を進める。経過時間・500 ms のガード・一時停止を、待ち時間なしで確かめる。
- ゲームの状態：`/?debug=1` で開き、`window.__breakout.snapshot()` で読み、`setup()` で「残り 1 個」「落ちる直前」などを作る（TD-0001 §7）。
- 出来事：`window` の `app:sound`・`app:state` イベントを `addInitScript` で記録して確かめる（`simple_shogi` の `app:music` と同じやり方）。
- タッチ：`pointerType: 'touch'` の `PointerEvent` を Canvas に送る（`pointerdown` → `pointermove` → `pointerup`）。
- 保存の失敗：`addInitScript` で `Storage.prototype.setItem` を例外にする。
- 音が使えない環境：`addInitScript` で `AudioContext` を消す。
- オフライン：Service Worker の準備ができたあとに `context.setOffline(true)` で読み込み直す。
- 画面の非表示：`document.visibilityState` を `hidden` に見せかけて `visibilitychange` を送る。
- 保存データは、各テストの最初に空にする（Playwright は毎回新しいブラウザの状態で始まる）。

## 5. 手動テスト

| 端末 | ブラウザ・形 | 主に確かめること |
| --- | --- | --- |
| iPhone（オーナーの実機） | Safari、ホーム画面に追加したアプリ | 指の操作感、効果音（最初のタップ・マナーモード）、インストール、オフライン、安全領域、60 fps |
| Android（Pixel 7 相当） | Chrome、インストールしたアプリ | 同上、「今すぐインストール」 |
| パソコン | Chrome / Edge | マウス・キーボード、入力欄の初期フォーカス、更新の帯 |

- 手順は各テストケースの「手動」の行に書く。結果（端末・ブラウザ・版・日時・OK / NG・メモ）を AC に残す。
- 実機で確かめられなかった項目は、AC の「確認できなかったこと」に理由と代わりの確認方法を書く。

## 6. 非機能要件

| 要件（仕様書 §10） | 確かめ方 | テストケース |
| --- | --- | --- |
| 60 fps | 実機で、最高速度・ブロックを壊し続ける場面を目視で確かめる（開発ツールでの計測はしない） | TC-0022 |
| 物理の安定性 | 単体テスト（フレームの間隔を変えても同じ結果） | TC-0005 |
| 入力の遅れ | 実機で目視（指とパドルのずれ） | TC-0022 |
| 効果音の遅れ | 実機で聞く | TC-0015 |
| オフライン・通信なし | E2E（オフラインで読み込み直す、外部への通信がない） | TC-0018 |
| 端末内保存の失敗 | E2E（保存を例外にする） | TC-0012、TC-0016 |

## 7. テストケースの一覧

テストケースはユーザーストーリーと同じ番号にする（TC-0001 = US-0001 のテスト）。TC-0022 は非機能要件。仕様書 v1.2 で足した US-0022 のテストは、TC-0022 が使用済みのため TC-0023 にした。

| TC | 対象 | 主な種類 |
| --- | --- | --- |
| [TC-0001](MBRK-TC-0001-test-case-ja.md) | US-0001 タイトル画面 | E2E |
| [TC-0002](MBRK-TC-0002-test-case-ja.md) | US-0002 発射 | 単体 |
| [TC-0003](MBRK-TC-0003-test-case-ja.md) | US-0003 打ち返し・壁 | 単体 |
| [TC-0004](MBRK-TC-0004-test-case-ja.md) | US-0004 ブロック・得点 | 単体 |
| [TC-0005](MBRK-TC-0005-test-case-ja.md) | US-0005 終了判定 | 単体 |
| [TC-0006](MBRK-TC-0006-test-case-ja.md) | US-0006 結果 | 単体・E2E |
| [TC-0007](MBRK-TC-0007-test-case-ja.md) | US-0007 指の操作 | E2E・手動 |
| [TC-0008](MBRK-TC-0008-test-case-ja.md) | US-0008 マウス・キーボード | E2E |
| [TC-0009](MBRK-TC-0009-test-case-ja.md) | US-0009 一時停止 | E2E |
| [TC-0010](MBRK-TC-0010-test-case-ja.md) | US-0010 画面サイズ | 単体・E2E・手動 |
| [TC-0011](MBRK-TC-0011-test-case-ja.md) | US-0011 誤操作防止 | E2E |
| [TC-0012](MBRK-TC-0012-test-case-ja.md) | US-0012 登録 | 単体・E2E |
| [TC-0013](MBRK-TC-0013-test-case-ja.md) | US-0013 ランキング | 単体・E2E |
| [TC-0014](MBRK-TC-0014-test-case-ja.md) | US-0014 バックアップ | 単体・E2E |
| [TC-0015](MBRK-TC-0015-test-case-ja.md) | US-0015 効果音 | 単体・E2E・手動 |
| [TC-0016](MBRK-TC-0016-test-case-ja.md) | US-0016 効果音のオン / オフ | E2E |
| [TC-0017](MBRK-TC-0017-test-case-ja.md) | US-0017 インストール | E2E・手動 |
| [TC-0018](MBRK-TC-0018-test-case-ja.md) | US-0018 オフライン | E2E・手動 |
| [TC-0019](MBRK-TC-0019-test-case-ja.md) | US-0019 更新・バージョン | E2E・手動 |
| [TC-0020](MBRK-TC-0020-test-case-ja.md) | US-0020 起動失敗の復旧 | E2E |
| [TC-0021](MBRK-TC-0021-test-case-ja.md) | US-0021 読み上げ・キーボード | E2E・手動 |
| [TC-0022](MBRK-TC-0022-test-case-ja.md) | 非機能（60 fps・入力の遅れ） | 手動 |
| [TC-0023](MBRK-TC-0023-test-case-ja.md) | US-0022 記録の全消去 | 単体・E2E・手動 |

テストケースの各行の「確認 ID」（例：`TC-0002-03`）を、テストコードの `test()` の名前の先頭に付ける（例：`test('TC-0002-03 発射直後の速度', …)`）。AC で結果を引けるようにするため。

## 8. 合格の基準

| 場面 | 基準 |
| --- | --- |
| PR（実装タスク） | そのタスクのテストケースの単体・E2E が書かれて通る。`npm run verify` と `npm run test:e2e` が通る（CI が緑） |
| 段階の終わり（EP-0001 の段階 1〜7） | その段階のストーリーの手動テストを行い、AC に残す |
| リリース（v1.0.0） | 全テストケースが合格、または「確認できなかったこと」に理由がある。オーナーが AC を承認している。更新ボタン（TC-0019-04）は v1.0.0 では確かめられないので、最初のアップデート時に確かめる |
| アップデート（v1.0.1 以降の最初の公開） | TC-0019-04 を行い、AC に残す |

## 9. 不具合の扱い

1. 見つけた不具合は、まず再現するテストを書く（落ちることを確かめる）。
2. 直して、そのテストが通ることを確かめる。
3. 手動テストで見つけたものは、AC の確認結果に「NG → 修正 → 再確認 OK」と残す。
