import { BACKUP_ERROR_MESSAGES, backupFileName, createBackup, parseBackup, type BackupData } from './backup';
import { formatDateTime, formatNumber, rankLabel } from './format';
import type { ScoreRecord } from './ranking';
import { loadBackupData, loadRanking, restoreBackup } from './records';
import { el, icon } from './ui';

// ランキング画面とバックアップ（TD-0004 §4・§6、GUI-0005）

export interface RankingView {
  /** 保存から読み直して、表・0 件・読み込み失敗のどれかを出す（開くたびに呼ぶ） */
  show(): void;
}

/** 1〜3 位は強調する */
const TOP_RANKS = 3;

/** 1 件の行。名前・「（あなた）」の 1 段目と、結果・日時の 2 段目は同じセルに入れる */
function recordRow(record: ScoreRecord, rank: number, mine: boolean): HTMLTableRowElement {
  const cleared = record.result === 'cleared';
  const nameLine = el('div', { className: 'ranking-name-line' }, [
    // 名前は文字として入れ、長いときは省略する。全文は title で見られる
    el('span', { className: 'ranking-name', text: record.playerName, attrs: { title: record.playerName } }),
    ...(mine ? [el('span', { className: 'ranking-you', text: '（あなた）' })] : []),
  ]);
  const meta = el('div', { className: 'ranking-meta' }, [
    icon(cleared ? 'check-circle' : 'x-circle'),
    `${cleared ? 'CLEAR' : 'GAME OVER'} · ${formatDateTime(record.createdAt)}`,
  ]);
  return el('tr', { className: mine ? 'is-mine' : '' }, [
    el('th', { className: `ranking-rank${rank <= TOP_RANKS ? ' is-top' : ''}`, text: rankLabel(rank), attrs: { scope: 'row' } }),
    el('td', { className: 'ranking-entry' }, [nameLine, meta]),
    el('td', { className: 'ranking-score num', text: formatNumber(record.score) }),
  ]);
}

function table(scores: ScoreRecord[], myId: number | null): HTMLTableElement {
  return el('table', { className: 'ranking-table', attrs: { id: 'ranking-table' } }, [
    el('caption', { className: 'sr-only', text: '上位 10 件の記録' }),
    el('thead', {}, [
      el('tr', {}, [
        el('th', { className: 'ranking-rank', text: '順位', attrs: { scope: 'col' } }),
        el('th', { text: '名前', attrs: { scope: 'col' } }),
        el('th', { className: 'ranking-score', text: 'スコア', attrs: { scope: 'col' } }),
      ]),
    ]),
    // 保存の並び順のとおり。順位は 1 始まりの連番（仕様書 §9.2）
    el('tbody', {}, scores.map((r, i) => recordRow(r, i + 1, r.id === myId))),
  ]);
}

export function createRankingView(deps: { onTitle(): void }): RankingView {
  const content = document.getElementById('ranking-content') as HTMLElement;
  const heading = document.getElementById('ranking-heading') as HTMLElement;
  const message = document.getElementById('backup-message') as HTMLElement;

  function showMessage(kind: 'success' | 'danger', text: string): void {
    message.className = `backup-message is-${kind}`;
    message.textContent = text;
  }

  /** 開くたび・読み込みに成功するたびに、保存から読み直して表を作り直す */
  function show(): void {
    message.textContent = '';
    const ranking = loadRanking();
    if (!ranking.ok) {
      const reload = el('button', { text: '再読み込み', attrs: { type: 'button', id: 'ranking-reload' } });
      reload.addEventListener('click', () => {
        show();
        // 押したボタンは作り直して消えるので、見出しにフォーカスを戻す
        heading.focus();
      });
      content.replaceChildren(
        el('div', { className: 'empty', attrs: { id: 'ranking-error' } }, [
          el('p', { className: 'ranking-error-text' }, [icon('x-circle'), 'ランキングを読み込めませんでした']),
          reload,
        ]),
      );
    } else if (ranking.scores.length === 0) {
      const back = el('button', { text: 'タイトルへ戻る', attrs: { type: 'button', id: 'ranking-empty-title' } });
      back.addEventListener('click', deps.onTitle);
      content.replaceChildren(el('div', { className: 'empty', attrs: { id: 'ranking-empty' } }, [el('p', { className: 'muted', text: 'まだ記録がありません' }), back]));
    } else {
      content.replaceChildren(table(ranking.scores, ranking.myId));
    }
  }

  setupBackup(show, showMessage);
  return { show };
}

/** 記録の書き出し・読み込み（TD-0004 §4、GUI-0005・GUI-0006 §2） */
function setupBackup(show: () => void, showMessage: (kind: 'success' | 'danger', text: string) => void): void {
  const exportButton = document.getElementById('backup-export') as HTMLButtonElement;
  const importButton = document.getElementById('backup-import') as HTMLButtonElement;
  const fileInput = document.getElementById('backup-file') as HTMLInputElement;
  const dialog = document.getElementById('import-dialog') as HTMLDialogElement;
  const cancel = document.getElementById('import-cancel') as HTMLButtonElement;
  const confirm = document.getElementById('import-confirm') as HTMLButtonElement;
  /** 確認を待っている、読み込む中身 */
  let pending: BackupData | null = null;

  // 書き出し：JSON を Blob にし、<a download> をクリックして保存する。0 件でも書き出せる
  exportButton.addEventListener('click', () => {
    const data = loadBackupData();
    if (!data) {
      showMessage('danger', 'ランキングを読み込めないため、書き出せませんでした');
      return;
    }
    const now = new Date();
    const url = URL.createObjectURL(new Blob([createBackup(data, now)], { type: 'application/json' }));
    const link = el('a', { attrs: { href: url, download: backupFileName(now) } });
    document.body.append(link);
    link.click();
    link.remove();
    // ダウンロードが始まってから解放する
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // 読み込み：ファイルを選ぶ → 検証 → 確認 → 保存 → 表を作り直す
  importButton.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    void file.text().then(
      (text) => {
        const parsed = parseBackup(text);
        if (!parsed.ok) {
          // 中身に問題があるときは、確認を出さずに理由を出す（今の記録は変えない）
          showMessage('danger', BACKUP_ERROR_MESSAGES[parsed.error]);
          return;
        }
        pending = parsed.data;
        dialog.showModal();
        // 誤って置き換えないよう、最初のフォーカスはキャンセル
        cancel.focus();
      },
      () => showMessage('danger', BACKUP_ERROR_MESSAGES.unreadable),
    );
  });
  cancel.addEventListener('click', () => dialog.close());
  confirm.addEventListener('click', () => {
    const data = pending;
    dialog.close();
    if (!data) return;
    if (!restoreBackup(data)) {
      showMessage('danger', '保存できませんでした。もう一度お試しください');
      return;
    }
    show();
    showMessage('success', `記録を読み込みました（${data.scores.length} 件）`);
  });
  // キャンセル・Esc・読み込む、どれで閉じても確認を待つ中身を捨て、押したボタンにフォーカスを戻す
  dialog.addEventListener('close', () => {
    pending = null;
    importButton.focus();
  });
}
