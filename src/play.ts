import { CONTROL_AREA_HEIGHT } from './config';
import { createGame, pause, resume, step, type GameEvent, type GameState, type GameStatus } from './game';
import { createInput } from './input';
import { computeDisplaySize, isMinimumSize } from './layout';
import { advance, createAccumulator, resetAccumulator } from './loop';
import { readPalette, render } from './render';
import { hideResultPanel, showResultPanel } from './result-panel';
import { summarize } from './score';
import type { Sound } from './sound';
import { icon } from './ui';

// プレイ画面（TD-0003 §1・§2・§5・§7）。
// 読み上げは後のタスクで足す

/** プレイ画面から頼む画面の切替えと、効果音（main.ts が渡す） */
export interface PlayDeps {
  onTitle(): void;
  onRanking(): void;
  sound: Sound;
}

/** ゲーム領域の下の操作欄の高さ（間隔 8 + ボタン 48。GUI-0003 §1.2） */
const CONTROLS_HEIGHT = 56;
/** 操作空間を出すときに足す高さ（間隔 8 + 操作空間。GUI-0003 §1.2） */
const CONTROL_AREA_SPACE = 8 + CONTROL_AREA_HEIGHT;

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

export function createPlayScreen(deps: PlayDeps): PlayScreen {
  const canvas = document.getElementById('field') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const section = document.getElementById('screen-play') as HTMLElement;
  const stage = document.getElementById('stage') as HTMLElement;
  const main = document.getElementById('app') as HTMLElement;
  const orientationNotice = document.getElementById('orientation-notice') as HTMLElement;
  const pauseButton = document.getElementById('pause-button') as HTMLButtonElement;
  const controlArea = document.getElementById('control-area') as HTMLElement;
  /** 主な入力が指の端末か（操作空間を出すか。GUI-0003 §2.3） */
  const coarsePointer = matchMedia('(pointer: coarse)');
  const palette = readPalette();
  const input = createInput(
    canvas,
    {
      onTogglePause: () => togglePause(),
      isActive: () => isRunning(state) || state.status === 'paused',
    },
    controlArea,
  );
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

    // タッチ端末では、ゲーム領域の下に操作空間を出し、その分ゲーム領域の高さを譲る。
    // 結果パネルを出している間は操作空間を隠すが、ゲーム領域の大きさはプレイ中と同じにする（GUI-0003 §2.3）
    const useControlArea = coarsePointer.matches;
    controlArea.hidden = !useControlArea || isOver(state);
    const style = getComputedStyle(main);
    const { width, height } = computeDisplaySize({
      width: viewportWidth,
      height: window.innerHeight,
      topInset: parseFloat(style.paddingTop) || 0,
      bottomInset: parseFloat(style.paddingBottom) || 0,
      controlsHeight: CONTROLS_HEIGHT + (useControlArea ? CONTROL_AREA_SPACE : 0),
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

  /** 一時停止ボタンの表示：止めていないとき「一時停止」、一時停止中は「再開」。押せるのは発射前・プレイ中・一時停止中（GUI-0003 §2.3） */
  function updatePauseButton(): void {
    const paused = state.status === 'paused';
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.disabled = isOver(state);
    const label = pauseButton.querySelector('.toggle-label');
    if (label) label.textContent = paused ? '再開' : '一時停止';
    pauseButton.querySelector('svg')?.replaceWith(icon(paused ? 'play' : 'pause'));
  }

  /** 一時停止：ループを止め、押下中の指・キーを離した扱いにして、幕を描く（TD-0003 §1） */
  function pauseGame(): void {
    if (!pause(state)) return;
    stopLoop();
    deps.sound.stopAll();
    input.release();
    draw();
    updatePauseButton();
  }

  /** 再開：一時停止中に出た発射要求を捨て、止まっていた時間を進めずにループを始める */
  function resumeGame(): void {
    if (!resume(state)) return;
    input.discardLaunch();
    draw();
    updatePauseButton();
    startLoop();
  }

  function togglePause(): void {
    if (state.status === 'paused') resumeGame();
    else pauseGame();
  }

  /** 画面が隠れたら一時停止する。表示に戻っても自動では再開しない（仕様書 §7.2） */
  function onVisibilityChange(): void {
    if (document.hidden) pauseGame();
  }

  function onPauseButton(): void {
    togglePause();
    // 指で押したあとも、ゲームのキー操作が効くよう、ゲーム領域にフォーカスを戻す（GUI-0003 §2.3）
    canvas.focus();
  }

  /** 終了の処理：ループと入力を止め、暗くした盤面の上に結果パネルを出す（TD-0003 §1・§7） */
  function finish(): void {
    stopLoop();
    input.detach();
    updatePauseButton();
    // 結果パネルの間は操作空間を出さない（ゲーム用の入力を受け付けないため）
    controlArea.hidden = true;
    document.title = 'ブロック崩し - 結果';
    showResultPanel(summarize(state), { retry: () => api.start(), title: deps.onTitle, ranking: deps.onRanking }, { sound: deps.sound });
  }

  function frame(now: number): void {
    frameId = null;
    const n = advance(acc, now);
    events.length = 0;
    for (let i = 0; i < n; i++) {
      step(state, input.take(), events);
      if (!isRunning(state)) break;
    }
    // このフレームの出来事をまとめて鳴らす（同じ種類は 1 回。TD-0005 §1）
    deps.sound.playFrame(events);
    draw();
    if (isOver(state)) finish();
    else if (isRunning(state)) frameId = requestAnimationFrame(frame);
  }

  function onResize(): void {
    if (layout(false)) draw();
  }

  /** タブレットにマウスをつないだときなど、主な入力が変わったら操作空間を出し直す */
  function onPointerKindChange(): void {
    layout(true);
    draw();
  }

  /** プレイ画面にいる間だけ受けるイベント */
  function listen(on: boolean): void {
    for (const type of ['resize', 'orientationchange']) {
      window.removeEventListener(type, onResize);
      if (on) window.addEventListener(type, onResize);
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
    pauseButton.removeEventListener('click', onPauseButton);
    coarsePointer.removeEventListener('change', onPointerKindChange);
    if (on) {
      document.addEventListener('visibilitychange', onVisibilityChange);
      pauseButton.addEventListener('click', onPauseButton);
      coarsePointer.addEventListener('change', onPointerKindChange);
    }
  }

  const api: PlayScreen = {
    start() {
      stopLoop();
      hideResultPanel();
      document.title = 'ブロック崩し - プレイ';
      state = createGame();
      lastStatus = null;
      input.detach();
      input.attach();
      layout(true);
      listen(true);
      updatePauseButton();
      canvas.focus();
      draw();
      startLoop();
    },
    stop() {
      stopLoop();
      deps.sound.stopAll();
      input.detach();
      hideResultPanel();
      listen(false);
    },
    getState() {
      return state;
    },
    refresh() {
      draw();
      updatePauseButton();
      if (isRunning(state)) startLoop();
      else if (isOver(state)) finish();
      else stopLoop();
    },
  };
  return api;
}
