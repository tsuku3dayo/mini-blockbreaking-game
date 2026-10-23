import { FIELD_WIDTH, TAP_MAX_MOVE } from './config';
import type { StepInput } from './game';

// 入力（TD-0003 §3）。この段階はポインタだけ（キーボードは TASK-0013）

export interface Input {
  /** そのステップの入力を作る。発射要求は取り出したら消える */
  take(): StepInput;
  /** 発射要求を捨てる（再開・新しいゲームのとき） */
  discardLaunch(): void;
  /** マウスで操作しているか（プレイ中にカーソルを隠すため） */
  usingMouse(): boolean;
  /** 入力の受付を始める */
  attach(): void;
  /** 入力の受付をやめて、状態を初期に戻す */
  detach(): void;
}

export function createInput(canvas: HTMLCanvasElement): Input {
  let source: StepInput['source'] = 'pointer';
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
    // 押したまま指がゲーム領域の外に出ても、離すまで追従を続ける
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // すでに離れたポインタなどでは捕まえられない。追従は window の pointermove で続ける
    }
    downX = toLogicalX(e.clientX);
    pointerX = downX;
    source = 'pointer';
  }

  /** 追従をやめる（発射はしない）。中断・フォーカスを失ったとき（仕様書 §4.1-6） */
  function release(): void {
    activePointerId = null;
    downX = null;
  }

  function onPointerCancel(e: PointerEvent): void {
    if (e.pointerId === activePointerId) release();
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

  function onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== activePointerId || downX === null) return;
    // 押してから離すまでの横の移動が 10 以内ならタップ（パドルを動かしただけなら発射しない）
    if (Math.abs(toLogicalX(e.clientX) - downX) <= TAP_MAX_MOVE) launchRequested = true;
    release();
  }

  return {
    take() {
      stepInput.source = source;
      stepInput.dir = 0;
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
    attach() {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      // ゲーム領域の外で押したときは追従しないので、押すのは Canvas だけで受ける
      canvas.addEventListener('pointerdown', onPointerDown, { signal });
      // 動かす・離すは、捕まえた Canvas から window に伝わるものも含めて window で受ける
      window.addEventListener('pointermove', onPointerMove, { signal });
      window.addEventListener('pointerup', onPointerUp, { signal });
      window.addEventListener('pointercancel', onPointerCancel, { signal });
      canvas.addEventListener('lostpointercapture', onPointerCancel, { signal });
      window.addEventListener('blur', release, { signal });
      // 長押しメニューを出さない
      canvas.addEventListener('contextmenu', (e) => e.preventDefault(), { signal });
    },
    detach() {
      controller?.abort();
      controller = null;
      reset();
    },
  };
}
