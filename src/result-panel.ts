import { BLOCK_COUNT } from './config';
import { formatNumber, formatSeconds } from './format';
import type { ResultSummary } from './game';
import { el, icon } from './ui';

// 結果パネル（TD-0004 §5、GUI-0004）。
// この段階は表示・ボタン・初期フォーカス・Enter で RETRY まで。
// 名前の登録は TASK-0015、入力ガード（500 ms）と Enter の細かい扱いは TASK-0012 で足す

export interface ResultActions {
  retry(): void;
  title(): void;
  ranking(): void;
}

const panel = (): HTMLElement => document.getElementById('result-panel') as HTMLElement;
let controller: AbortController | null = null;

/** 内訳の 1 行（項目名は左、数値は右寄せ・等幅） */
function row(label: string, value: string): Node[] {
  return [el('dt', { text: label }), el('dd', { className: 'num', text: value })];
}

/** 部品にフォーカスがあるときの Enter は、その部品の動作だけにする（仕様書 §4.1-9） */
function isInteractive(element: Element | null): boolean {
  return !!element && element.matches('button, input, select, textarea, a[href], summary');
}

export function showResultPanel(summary: ResultSummary, actions: ResultActions): void {
  const root = panel();
  const cleared = summary.result === 'cleared';

  const heading = el('h2', { className: `result-heading ${cleared ? 'is-clear' : 'is-over'}`, attrs: { id: 'result-heading', tabindex: '-1' } }, [
    icon(cleared ? 'check-circle' : 'x-circle'),
    cleared ? 'CLEAR!' : 'GAME OVER',
  ]);

  // ゲームオーバーでは「ブロック」「時間ボーナス」「タイム」の行を出さない（仕様書 §8.3）
  const breakdown = el('dl', { className: 'result-breakdown' }, [
    ...(cleared
      ? [
          ...row('ブロック', formatNumber(summary.blockScore)),
          ...row('時間ボーナス', formatNumber(summary.timeBonus)),
          ...row('タイム', `${formatSeconds(summary.elapsedMs)} 秒`),
        ]
      : []),
    ...row('壊したブロック', `${summary.broken} / ${BLOCK_COUNT}`),
  ]);

  const total = el('dl', { className: 'result-total' }, row('合計', formatNumber(summary.total)));

  // 名前の登録（TASK-0015）。場所だけ用意して隠しておく
  const register = el('div', { className: 'result-register', attrs: { hidden: '' } });

  const retry = el('button', { className: 'primary', attrs: { type: 'button', id: 'result-retry' } }, [
    'RETRY',
    el('kbd', { className: 'key-hint', text: 'Enter', attrs: { 'aria-hidden': 'true' } }),
  ]);
  const title = el('button', { text: 'TITLE', attrs: { type: 'button', id: 'result-title' } });
  const ranking = el('button', { text: 'RANKING', attrs: { type: 'button', id: 'result-ranking' } });
  retry.addEventListener('click', actions.retry);
  title.addEventListener('click', actions.title);
  ranking.addEventListener('click', actions.ranking);

  root.replaceChildren(heading, breakdown, total, register, el('div', { className: 'result-actions' }, [retry, title, ranking]));
  root.hidden = false;
  root.scrollTop = 0;

  // どこにもフォーカスがないときの Enter は RETRY
  controller?.abort();
  controller = new AbortController();
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat || e.isComposing) return;
      if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !isInteractive(document.activeElement)) {
        e.preventDefault();
        actions.retry();
      }
    },
    { signal: controller.signal },
  );

  // 初期フォーカス：名前の入力欄ができるまで（TASK-0015）は、PC・スマホとも見出し
  heading.focus();
}

export function hideResultPanel(): void {
  controller?.abort();
  controller = null;
  const root = panel();
  root.hidden = true;
  root.replaceChildren();
}
