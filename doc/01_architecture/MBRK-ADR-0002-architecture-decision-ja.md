---
id: MBRK-ADR-0002
type: Architecture Decision
title: simple_shogi と同じ技術構成とルールを使う
status: stable
version: 1.0
updated: 2026-10-23
sources:
  - MBRK-PB-0001
  - simple_shogi doc/architecture.md、CLAUDE.md (v1.3.2)
verified: { by: "tsuku3dayo", at: "2026-10-23T16:38:45+09:00" }
---

# ADR-0002 simple_shogi と同じ技術構成とルールを使う

## 状況

オーナーは `simple_shogi` を PWA の共通テンプレートとして使っており、技術構成・CI・公開の仕組み・開発のルール（`CLAUDE.md`）がそろっている。同じ構成にすれば、学んだことと道具をそのまま使える。

## 決定

`simple_shogi` と同じ技術構成にする：Vite + TypeScript（UI フレームワークなし）+ vite-plugin-pwa + Vitest + Playwright + ESLint、Node.js 24、GitHub Actions、GitHub Pages、Dependabot。`simple_shogi` の `CLAUDE.md` の共通ルール（PWA の要件、保存データ、デザイン、テスト、CI、ブランチ運用、入力の表示）にも従う。

`simple_shogi` の汎用部品（`public/boot.js`、`src/pwa.ts`、`src/install.ts`、`src/storage.ts` の土台、`scripts/check-dist.mjs`、`scripts/make-icons.mjs`、CI の設定、`index.html` のインストール方法のダイアログ）は流用し、このアプリに合わせて直す。

## 検討した選択肢

| 選択肢 | 良い点 | 悪い点 |
| --- | --- | --- |
| **A. simple_shogi と同じ（採用）** | 道具・ルール・CI を流用できる。オーナーが慣れている | フレームワークがないので、画面の部品は自分で組む |
| B. React 等の UI フレームワークを入れる | 画面の部品を組みやすい | 画面は 4 つと少なく、効果が小さい。依存が増える。テンプレートから外れる |
| C. ゲームエンジン（Phaser 等）を使う | 描画・入力・音の仕組みがそろっている | 仕様書の物理（固定ステップ・独自の衝突）を自分で書くため利点が小さい。サイズが大きくなる |

## 結果

- 良い点：01 以降の設計・テスト・CI の多くを `simple_shogi` に倣える。
- 注意点：`simple_shogi` は将棋（ターン制・DOM 描画）なので、ゲームループと Canvas 描画は新しく作る（ADR-0003、ADR-0004）。違いは [MBRK-TS-0001](MBRK-TS-0001-technology-stack-ja.md) §5 にまとめた。
