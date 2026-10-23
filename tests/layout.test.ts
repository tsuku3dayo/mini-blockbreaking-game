import { describe, expect, it } from 'vitest';
import { computeDisplaySize, isMinimumSize } from '../src/layout';

const insets = { topInset: 24, bottomInset: 16, controlsHeight: 56 };

describe('表示サイズ（TC-0010）', () => {
  it.each([
    ['375 × 667（iPhone SE）', 375, 667, 343, 457],
    ['375 × 548（iPhone SE の Safari、ツールバーあり）', 375, 548, 339, 452],
    ['412 × 839（Pixel 7）', 412, 839, 380, 506],
    ['1280 × 800（パソコン）', 1280, 800, 448, 597],
  ])('TC-0010-01 %s → %i × %i', (_, width, height, w, h) => {
    expect(computeDisplaySize({ width, height, ...insets })).toEqual({ width: w, height: h });
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
