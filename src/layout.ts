import { DISPLAY_MIN_SCALE, FIELD_HEIGHT, FIELD_WIDTH, PAGE_GUTTER, PAGE_MAX_WIDTH } from './config';

// 表示サイズの計算（TD-0003 §5、仕様書 §2.1）。値は CSS px

export interface Viewport {
  /** 画面の表示領域の幅・高さ */
  width: number;
  height: number;
  /** 上端の余白（安全領域を含む） */
  topInset: number;
  /** 下端の余白（安全領域を含む） */
  bottomInset: number;
  /** ゲーム領域の下の操作欄の高さ（間隔 8 + ボタン 48） */
  controlsHeight: number;
}

const MIN_WIDTH = FIELD_WIDTH * DISPLAY_MIN_SCALE;

/** ゲーム領域の表示の幅・高さ。縦横比 3:4 を保ち、整数に切り捨てる。最小は 288 × 384 */
export function computeDisplaySize(v: Viewport): { width: number; height: number } {
  const availableWidth = Math.min(v.width, PAGE_MAX_WIDTH) - PAGE_GUTTER * 2;
  const availableHeight = v.height - v.topInset - v.controlsHeight - v.bottomInset;
  const width = Math.floor(Math.max(MIN_WIDTH, Math.min(availableWidth, (availableHeight * FIELD_WIDTH) / FIELD_HEIGHT)));
  return { width, height: Math.floor((width * FIELD_HEIGHT) / FIELD_WIDTH) };
}

/** 最小の大きさでしか表示できないか（横向きの案内を出す判断に使う） */
export function isMinimumSize(width: number): boolean {
  return width <= MIN_WIDTH;
}
