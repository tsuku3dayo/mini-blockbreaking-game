import { BLOCK_COUNT, PLAYER_NAME_MAX, RESULT_INPUT_GUARD } from './config';
import { formatNumber, formatSeconds } from './format';
import type { ResultSummary } from './game';
import { countChars, normalizeName, validateName, type NameError } from './ranking';
import { loadLastName, register as registerRecord } from './records';
import type { Sound } from './sound';
import { el, icon } from './ui';

// 結果パネルとスコア登録（TD-0004 §5、GUI-0004）

/** 名前の規則のエラー文（仕様書 §9.3） */
const NAME_ERRORS: Record<NameError, string> = {
  empty: '名前を入力してください',
  invalidChar: '使用できない文字が含まれています',
  tooLong: `${PLAYER_NAME_MAX} 文字以内で入力してください`,
};
const NAME_HINT = `1〜${PLAYER_NAME_MAX} 文字`;

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

export function showResultPanel(summary: ResultSummary, actions: ResultActions, deps: { sound: Sound }): void {
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

  // 名前の登録（GUI-0004 §2・§3）。maxlength は付けない（コードポイントで数え、超えたらエラーにする）
  const nameInput = el('input', {
    attrs: { type: 'text', id: 'result-name', autocomplete: 'off', enterkeyhint: 'done', 'aria-describedby': 'result-name-hint' },
  });
  nameInput.value = loadLastName();
  const registerButton = el('button', { className: 'primary', text: 'REGISTER', attrs: { type: 'button', id: 'result-register' } });
  const hint = el('span', { attrs: { id: 'result-name-hint' } });
  const count = el('span', { className: 'num', attrs: { id: 'result-name-count' } });
  const message = el('p', { className: 'result-message', attrs: { id: 'result-message', role: 'status' } });
  const register = el('div', { className: 'result-register' }, [
    el('label', { text: '名前を登録', attrs: { for: 'result-name' } }),
    el('div', { className: 'register-row' }, [nameInput, registerButton]),
    el('div', { className: 'register-help' }, [hint, count]),
    message,
  ]);

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

  // 名前の検証と登録。空のエラーは、一度入力欄から離れたあとだけ出す（仕様書 §9.5）
  let blurred = false;
  let registered = false;
  const update = () => {
    const r = validateName(nameInput.value);
    const error = !r.ok && (r.error !== 'empty' || blurred) ? NAME_ERRORS[r.error] : null;
    hint.textContent = error ?? NAME_HINT;
    hint.classList.toggle('is-error', error !== null);
    nameInput.setAttribute('aria-invalid', String(error !== null));
    count.textContent = `${countChars(normalizeName(nameInput.value))} / ${PLAYER_NAME_MAX}`;
    registerButton.disabled = !r.ok || registered;
  };
  const showMessage = (kind: 'success' | 'muted' | 'danger', text: string) => {
    message.className = `result-message is-${kind}`;
    message.replaceChildren(...(kind === 'muted' ? [] : [icon(kind === 'success' ? 'check-circle' : 'x-circle')]), text);
  };
  const doRegister = () => {
    const r = validateName(nameInput.value);
    if (!r.ok || registered) return;
    const saved = registerRecord(r.name, summary, new Date());
    if (!saved.ok) {
      showMessage('danger', '保存できませんでした。もう一度お試しください');
      return;
    }
    // 二重登録を防ぐ。新しいゲームでパネルを作り直すまで登録できない
    registered = true;
    nameInput.disabled = true;
    update();
    deps.sound.play('register');
    if (saved.rank === null) showMessage('muted', 'ランキング外でした（上位 10 件に入りませんでした）');
    else showMessage('success', `${saved.rank} 位で登録しました`);
    retry.focus();
  };
  nameInput.addEventListener('input', update, { signal });
  nameInput.addEventListener(
    'blur',
    () => {
      blurred = true;
      update();
    },
    { signal },
  );
  // 入力欄の Enter は登録だけ（RETRY は動かさない。仕様書 §4.1-9）
  nameInput.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat || e.isComposing || (e.code !== 'Enter' && e.code !== 'NumpadEnter')) return;
      e.preventDefault();
      doRegister();
    },
    { signal },
  );
  registerButton.addEventListener('click', doRegister, { signal });
  update();

  // 初期フォーカス：パソコンは入力欄（カーソルを末尾に）、スマホは見出し（ソフトウェアキーボードを出さない）
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    nameInput.focus();
    nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length);
  } else {
    heading.focus();
  }
}

export function hideResultPanel(): void {
  controller?.abort();
  controller = null;
  const root = panel();
  root.hidden = true;
  root.replaceChildren();
}
