import { FIELD_WIDTH } from './config';
import { createGame, step, type GameEvent, type GameState, type GameStatus } from './game';
import { createInput } from './input';
import { advance, createAccumulator, resetAccumulator } from './loop';
import { readPalette, render } from './render';

// プレイ画面（TD-0003 §1・§2）。
// この段階では、表示サイズは最大 448 px 幅の固定（TASK-0007 で仕様書 §2.1 の計算にする）。
// 一時停止・結果パネル・効果音・読み上げは後のタスクで足す

export interface PlayScreen {
  /** 新しいゲームを始める */
  start(): void;
  /** 画面を離れるとき（ループ・入力を止める） */
  stop(): void;
  /** 今のゲームの状態（テスト用の入口から使う） */
  getState(): GameState;
  /** 状態を書き換えたあとに呼ぶ。描き直し、必要ならループを動かす */
  refresh(): void;
}

/** 状態が変わったことを知らせる（TD-0001 §7）。E2E は body[data-game-state] と app:state を見る */
function notifyState(status: GameStatus): void {
  document.body.dataset.gameState = status;
  window.dispatchEvent(new CustomEvent('app:state', { detail: status }));
}

export function createPlayScreen(): PlayScreen {
  const canvas = document.getElementById('field') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const palette = readPalette();
  const input = createInput(canvas);
  const acc = createAccumulator();
  // フレームごとに使い回す
  const events: GameEvent[] = [];
  let state = createGame();
  let lastStatus: GameStatus | null = null;
  let frameId: number | null = null;

  const isRunning = (s: GameState) => s.status === 'ready' || s.status === 'playing';
  const isOver = (s: GameState) => s.status === 'cleared' || s.status === 'gameOver';

  /** Canvas の実ピクセルを、表示の大きさ × 画素密度にそろえる（ぼやけさせない） */
  function fitCanvas(): void {
    const width = canvas.clientWidth || FIELD_WIDTH;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(((width * 4) / 3) * dpr);
  }

  function draw(): void {
    render(ctx, state, palette, isOver(state));
    canvas.toggleAttribute('data-hide-cursor', state.status === 'playing' && input.usingMouse());
    if (state.status !== lastStatus) {
      lastStatus = state.status;
      notifyState(state.status);
    }
  }

  function stopLoop(): void {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  }

  function startLoop(): void {
    if (frameId !== null) return;
    resetAccumulator(acc);
    frameId = requestAnimationFrame(frame);
  }

  function finish(): void {
    stopLoop();
    input.detach();
  }

  function frame(now: number): void {
    frameId = null;
    const n = advance(acc, now);
    events.length = 0;
    for (let i = 0; i < n; i++) {
      step(state, input.take(), events);
      if (!isRunning(state)) break;
    }
    draw();
    if (isOver(state)) finish();
    else if (isRunning(state)) frameId = requestAnimationFrame(frame);
  }

  function onResize(): void {
    fitCanvas();
    draw();
  }

  return {
    start() {
      stopLoop();
      state = createGame();
      lastStatus = null;
      input.detach();
      input.attach();
      fitCanvas();
      window.removeEventListener('resize', onResize);
      window.addEventListener('resize', onResize);
      canvas.focus();
      draw();
      startLoop();
    },
    stop() {
      stopLoop();
      input.detach();
      window.removeEventListener('resize', onResize);
    },
    getState() {
      return state;
    },
    refresh() {
      draw();
      if (isRunning(state)) startLoop();
      else if (isOver(state)) finish();
      else stopLoop();
    },
  };
}
