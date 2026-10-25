import { FIELD_WIDTH, TAP_MAX_MOVE } from './config';
import type { StepInput } from './game';

// 入力（TD-0003 §3）。パドルは「最後に使われた入力」（キーボードかポインタ）に従う。
// キーは文字ではなく物理キーの位置（event.code）で判定する（キー配列・IME の状態に左右されない）

export interface InputOptions {
  /** P・Esc で一時停止 / 再開を切り替える */
  onTogglePause(): void;
  /** ← → Space の既定の動き（スクロール）を止めてよい状態か（発射前・プレイ中・一時停止中） */
  isActive(): boolean;
}

/** フォーカスがこれらの部品にあるときのキーは、ゲームに渡さない（TD-0003 §3.2） */
function isFormControl(element: Element | null): boolean {
  return !!element && element.matches('button, input, select, textarea, a[href], summary, [contenteditable="true"]');
}

export interface Input {
  /** そのステップの入力を作る。発射要求は取り出したら消える */
  take(): StepInput;
  /** 発射要求を捨てる（再開・新しいゲームのとき） */
  discardLaunch(): void;
  /** マウスで操作しているか（プレイ中にカーソルを隠すため） */
  usingMouse(): boolean;
  /** 押下中の指・キーをすべて離した扱いにする（一時停止のとき） */
  release(): void;
  /** 入力の受付を始める */
  attach(): void;
  /** 入力の受付をやめて、状態を初期に戻す */
  detach(): void;
}

/**
 * canvas はゲーム領域。controlArea は、その下の操作空間（タッチ端末だけ出す。TD-0003 §3.7）。
 * どちらで押しても同じように扱い、位置はゲーム領域の外形で論理座標に直す（左右の端がそろっているため）
 */
export function createInput(canvas: HTMLCanvasElement, options: InputOptions, controlArea: HTMLElement | null = null): Input {
  let source: StepInput['source'] = 'pointer';
  /** 押下中の左右キー */
  let left = false;
  let right = false;
  let pointerX: number | null = null;
  let pointerType = 'mouse';
  let activePointerId: number | null = null;
  let downX: number | null = null;
  let launchRequested = false;
  let controller: AbortController | null = null;
  // 1 秒に 120 回作るので、使い回す
  const stepInput: StepInput = { source: 'pointer', dir: 0, pointerX: null, launch: false };

  /** 画面上の x を論理座標にして 0〜480 に丸める（仕様書 §2.1） */
  function toLogicalX(clientX: number): number {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) * FIELD_WIDTH) / rect.width;
    return Math.min(Math.max(x, 0), FIELD_WIDTH);
  }

  function reset(): void {
    source = 'pointer';
    left = false;
    right = false;
    pointerX = null;
    activePointerId = null;
    downX = null;
    launchRequested = false;
  }

  function onPointerDown(e: PointerEvent): void {
    // 最初に触れた指だけを使う（2 本目以降は isPrimary が false）
    if (!e.isPrimary || activePointerId !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerType = e.pointerType;
    activePointerId = e.pointerId;
    // 押したまま指がゲーム領域（操作空間）の外に出ても、離すまで追従を続ける
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // すでに離れたポインタなどでは捕まえられない。追従は window の pointermove で続ける
    }
    downX = toLogicalX(e.clientX);
    pointerX = downX;
    source = 'pointer';
  }

  /** 指の追従をやめる（発射はしない） */
  function releasePointer(): void {
    activePointerId = null;
    downX = null;
  }

  /** 押下中の左右キーと指の追従を、すべて離した扱いにする。一時停止・フォーカスを失ったとき（仕様書 §4.1-6） */
  function release(): void {
    left = false;
    right = false;
    releasePointer();
  }

  function onPointerCancel(e: PointerEvent): void {
    if (e.pointerId === activePointerId) releasePointer();
  }

  function onPointerMove(e: PointerEvent): void {
    if (e.pointerType === 'mouse') {
      // マウスは、ボタンを押していなくても、ゲーム領域の外でも追従する
      pointerType = 'mouse';
      pointerX = toLogicalX(e.clientX);
      source = 'pointer';
    } else if (e.pointerId === activePointerId) {
      pointerX = toLogicalX(e.clientX);
      source = 'pointer';
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (isFormControl(document.activeElement) || e.isComposing) return;
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        // ← → はページのスクロールを止める
        if (e.code === 'ArrowLeft' && options.isActive()) e.preventDefault();
        left = true;
        source = 'keyboard';
        break;
      case 'ArrowRight':
      case 'KeyD':
        if (e.code === 'ArrowRight' && options.isActive()) e.preventDefault();
        right = true;
        source = 'keyboard';
        break;
      case 'Space':
        if (options.isActive()) e.preventDefault();
        // キーリピート（押しっぱなし）は無視する（仕様書 §4.1-4）
        if (!e.repeat) launchRequested = true;
        break;
      case 'KeyP':
      case 'Escape':
        if (!e.repeat) {
          e.preventDefault();
          options.onTogglePause();
        }
        break;
    }
  }

  /** 離したキーは、フォーカスの場所によらず離した扱いにする（押したままにならないように） */
  function onKeyUp(e: KeyboardEvent): void {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') left = false;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') right = false;
  }

  function onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== activePointerId || downX === null) return;
    // 押してから離すまでの横の移動が 10 以内ならタップ（パドルを動かしただけなら発射しない）
    if (Math.abs(toLogicalX(e.clientX) - downX) <= TAP_MAX_MOVE) launchRequested = true;
    releasePointer();
  }

  return {
    take() {
      stepInput.source = source;
      // 右が押されていれば +1、左が押されていれば −1。両方押しは止まる（仕様書 §4.1-1）
      stepInput.dir = ((right ? 1 : 0) - (left ? 1 : 0)) as StepInput['dir'];
      stepInput.pointerX = pointerX;
      stepInput.launch = launchRequested;
      launchRequested = false;
      return stepInput;
    },
    discardLaunch() {
      launchRequested = false;
    },
    usingMouse() {
      return source === 'pointer' && pointerType === 'mouse';
    },
    release,
    attach() {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      // ゲーム領域・操作空間の外で押したときは追従しないので、押すのはこの 2 つだけで受ける
      for (const target of controlArea ? [canvas, controlArea] : [canvas]) {
        target.addEventListener('pointerdown', onPointerDown, { signal });
        target.addEventListener('lostpointercapture', onPointerCancel, { signal });
        // 長押しメニューを出さない
        target.addEventListener('contextmenu', (e) => e.preventDefault(), { signal });
      }
      // 動かす・離すは、捕まえた要素から window に伝わるものも含めて window で受ける
      window.addEventListener('pointermove', onPointerMove, { signal });
      window.addEventListener('pointerup', onPointerUp, { signal });
      window.addEventListener('pointercancel', onPointerCancel, { signal });
      window.addEventListener('blur', release, { signal });
      window.addEventListener('keydown', onKeyDown, { signal });
      window.addEventListener('keyup', onKeyUp, { signal });
    },
    detach() {
      controller?.abort();
      controller = null;
      reset();
    },
  };
}
