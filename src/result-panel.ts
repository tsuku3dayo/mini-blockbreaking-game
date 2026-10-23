import { BLOCK_COUNT, RESULT_INPUT_GUARD } from './config';
import { formatNumber, formatSeconds } from './format';
import type { ResultSummary } from './game';
import { el, icon } from './ui';

// 結果パネル（TD-0004 §5、GUI-0004）。名前の登録は TASK-0015 で足す

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

  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  // 入力ガード：パネルが出てから 500 ms は、Enter・Space とパネル上のタップ・クリックを無視する（仕様書 §4.1-8）。
  // プレイ中に押していたキーや指で、RETRY などが意図せず動かないようにするため。
  // キャプチャ段階で止めるので、ボタン・入力欄・下の Enter の処理まで届かない。見た目は変えない（GUI-0004 §5）
  const shownAt = performance.now();
  const guarded = () => performance.now() - shownAt < RESULT_INPUT_GUARD;
  const block = (e: Event) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  for (const type of ['keydown', 'keyup'] as const) {
    window.addEventListener(
      type,
      (e) => {
        if (guarded() && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')) block(e);
      },
      { capture: true, signal },
    );
  }
  for (const type of ['pointerdown', 'pointerup', 'click'] as const) {
    root.addEventListener(type, (e) => guarded() && block(e), { capture: true, signal });
  }

  // どこにもフォーカスがないときの Enter は RETRY
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat || e.isComposing) return;
      if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !isInteractive(document.activeElement)) {
        e.preventDefault();
        actions.retry();
      }
    },
    { signal },
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
