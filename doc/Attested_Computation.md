# Attested Computation とは

## 概要

Attested Computation（AC）は、このプロジェクトの開発フロー（[`InputOutput_Text.txt`](InputOutput_Text.txt)）で使う成果物の種類の一つ。**実装タスクを「実装して検証まで終えた」ことを残す記録**にあたる。

一般的な IT 用語ではなく、このフローで決めている名前。「attested」は「証明された・立証された」という意味。

## フロー上の位置づけ

フローの最後の工程（07 実装・自動テスト → 手動テスト）は、次の 2 つを出力する。

| 出力 | 中身 |
|---|---|
| コード | リポジトリ内のソースコードとテスト |
| **Attested Computation** | そのコードが完了定義を満たしたことの記録（`doc/07_attested/MBRK-AC-xxxx-attested-computation-ja.md`） |

ほかの成果物との対応は次のとおり。

| 成果物 | ID | 役割 |
|---|---|---|
| Implementation Task | `MBRK-TASK-xxxx` | 何をやるか |
| Test Case | `MBRK-TC-xxxx` | どう確かめるか |
| **Attested Computation** | `MBRK-AC-xxxx` | 実際にやって確かめた結果 |

## 文書の構成

### frontmatter

書式の全体は [`CLAUDE.md`](../CLAUDE.md) の「成果物の書式」に従う。AC で特に大事な項目は次のとおり。

| キー | 内容 |
|---|---|
| `type` | `Attested Computation` |
| `status` | 承認後は `stable` |
| `sources` | 根拠になったタスクとテストケース（例：`MBRK-TASK-0001`、`MBRK-TC-0001`） |
| `verified` | 承認者と承認日時（例：`{ by: "tsuku3dayo", at: "2026-10-23T16:34:32+09:00" }`） |

### 本文

1. 実施概要：対応するタスク、実施者、環境（端末・ブラウザ・版）
2. 確認結果：テストケースの手順ごとの結果
3. **確認できなかったこと**
4. 後片付け
5. 完了定義（DoD）のチェックリスト

「確認できなかったこと」を正直に書くのがポイント。たとえば、実機で再現できなかった条件を、代わりに単体テストやコードの読み合わせで確かめた場合は、そのことと理由を明記する。

## 承認ゲート

AC は承認が必要な成果物なので、Claude Code が書いた AC は、オーナーの承認があって初めて確定する。

- オーナー（`tsuku3dayo`）がチャットで承認すると、`verified` に承認者と日時を記録する
- `status` を `stable` に上げる

つまり Attested Computation は、**「AI がやったと言っている」記録を、人が中身を確かめて認めた状態にするための文書**である。
