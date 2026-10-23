import { createGame, step, type GameEvent, type GameState, type GameStatus } from './game';
import { createInput } from './input';
import { computeDisplaySize, isMinimumSize } from './layout';
import { advance, createAccumulator, resetAccumulator } from './loop';
import { readPalette, render } from './render';

// プレイ画面（TD-0003 §1・§2・§5）。
// 一時停止・結果パネル・効果音・読み上げは後のタスクで足す

/** ゲーム領域の下の操作欄の高さ（間隔 8 + ボタン 48。GUI-0003 §1.2） */
const CONTROLS_HEIGHT = 56;

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
  const section = document.getElementById('screen-play') as HTMLElement;
  const stage = document.getElementById('stage') as HTMLElement;
  const main = document.getElementById('app') as HTMLElement;
  const orientationNotice = document.getElementById('orientation-notice') as HTMLElement;
  const palette = readPalette();
  const input = createInput(canvas);
  const acc = createAccumulator();
  // フレームごとに使い回す
  const events: GameEvent[] = [];
  let state = createGame();
  let lastStatus: GameStatus | null = null;
  let frameId: number | null = null;
  /** 最後に大きさを決めたときの表示領域の幅 */
  let layoutViewportWidth: number | null = null;

  const isRunning = (s: GameState) => s.status === 'ready' || s.status === 'playing';
  const isOver = (s: GameState) => s.status === 'cleared' || s.status === 'gameOver';

  /**
   * 画面の大きさから、ゲーム領域の表示の大きさと実ピクセルを決める（仕様書 §2.1）。
   * 終了後（結果パネルを出している間）は、幅が変わったときだけ計算し直す
   * （名前の入力でソフトウェアキーボードが出て、高さだけ縮んだときにゲーム領域を縮めないため）
   */
  function layout(force: boolean): boolean {
    const viewportWidth = window.innerWidth;
    if (!force && isOver(state) && viewportWidth === layoutViewportWidth) return false;
    layoutViewportWidth = viewportWidth;

    const style = getComputedStyle(main);
    const { width, height } = computeDisplaySize({
      width: viewportWidth,
      height: window.innerHeight,
      topInset: parseFloat(style.paddingTop) || 0,
      bottomInset: parseFloat(style.paddingBottom) || 0,
      controlsHeight: CONTROLS_HEIGHT,
    });
    // 操作欄もゲーム領域と同じ幅にする
    section.style.setProperty('--stage-width', `${width}px`);
    stage.style.width = `${width}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    // 実ピクセルは表示の大きさ × 画素密度（ぼやけさせない）
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    // 横向きで、最小の大きさでしか出せないときは、縦向きをすすめる
    orientationNotice.hidden = !(viewportWidth > window.innerHeight && isMinimumSize(width));
    return true;
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
    if (layout(false)) draw();
  }

  function listenResize(on: boolean): void {
    for (const type of ['resize', 'orientationchange']) {
      window.removeEventListener(type, onResize);
      if (on) window.addEventListener(type, onResize);
    }
  }

  return {
    start() {
      stopLoop();
      state = createGame();
      lastStatus = null;
      input.detach();
      input.attach();
      layout(true);
      listenResize(true);
      canvas.focus();
      draw();
      startLoop();
    },
    stop() {
      stopLoop();
      input.detach();
      listenResize(false);
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
