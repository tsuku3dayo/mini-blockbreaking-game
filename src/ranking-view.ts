import { formatDateTime, formatNumber, rankLabel } from './format';
import type { ScoreRecord } from './ranking';
import { loadRanking } from './records';
import { el, icon } from './ui';

// ランキング画面（TD-0004 §6、GUI-0005）。バックアップの欄は TASK-0021

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

  function show(): void {
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

  return { show };
}
