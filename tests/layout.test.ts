import { describe, expect, it } from 'vitest';
import { computeDisplaySize, isMinimumSize } from '../src/layout';

/** 操作欄だけ（パソコン）：間隔 8 + ボタン 48 */
const insets = { topInset: 24, bottomInset: 16, controlsHeight: 56 };
/** 操作空間あり（タッチ端末）：操作欄 56 + 間隔 8 + 操作空間 96 */
const touchInsets = { ...insets, controlsHeight: 160 };

describe('表示サイズ（TC-0010）', () => {
  it.each([
    ['375 × 667（iPhone SE）', 375, 667, touchInsets, 343, 457],
    ['375 × 548（iPhone SE の Safari、ツールバーあり）', 375, 548, touchInsets, 288, 384],
    ['412 × 839（Pixel 7）', 412, 839, touchInsets, 380, 506],
    ['1280 × 800（パソコン、操作空間なし）', 1280, 800, insets, 448, 597],
    ['375 × 548（操作空間なし。v1.1 までの値）', 375, 548, insets, 339, 452],
  ])('TC-0010-01 %s → %i × %i', (_, width, height, v, w, h) => {
    expect(computeDisplaySize({ width, height, ...v })).toEqual({ width: w, height: h });
  });

  it('TC-0010-02 最小は 288 × 384、最大は 448 × 597', () => {
    expect(computeDisplaySize({ width: 200, height: 800, ...insets })).toEqual({ width: 288, height: 384 });
    expect(computeDisplaySize({ width: 1920, height: 1080, ...insets })).toEqual({ width: 448, height: 597 });
    // 横向き（667 × 375）は高さが足りず最小になる
    const landscape = computeDisplaySize({ width: 667, height: 375, ...insets });
    expect(landscape).toEqual({ width: 288, height: 384 });
    expect(isMinimumSize(landscape.width)).toBe(true);
    expect(isMinimumSize(343)).toBe(false);
  });
});
