import { describe, expect, it } from 'vitest';
import { formatDateTime, formatNumber, formatSeconds, rankLabel } from '../src/format';

describe('表示の形式', () => {
  it('TC-0004-07 3 桁区切り', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(400)).toBe('400');
    expect(formatNumber(1250)).toBe('1,250');
    expect(formatNumber(2200)).toBe('2,200');
  });

  it('TC-0006-01 タイムは小数 1 桁の秒（切り捨て）', () => {
    expect(formatSeconds(95789)).toBe('95.7');
    expect(formatSeconds(0)).toBe('0.0');
    expect(formatSeconds(180000)).toBe('180.0');
  });

  it('TC-0013-07 登録日時は端末のタイムゾーンで YYYY/MM/DD HH:mm', () => {
    expect(formatDateTime('2026-10-23T03:15:00.123Z', 'Asia/Tokyo')).toBe('2026/10/23 12:15');
    expect(formatDateTime('2026-10-23T03:15:00.123Z', 'UTC')).toBe('2026/10/23 03:15');
    // 日付をまたぐ・うるう日・24 時間制
    expect(formatDateTime('2026-12-31T15:00:00.000Z', 'Asia/Tokyo')).toBe('2027/01/01 00:00');
    expect(formatDateTime('2028-02-29T13:05:00.000Z', 'Asia/Tokyo')).toBe('2028/02/29 22:05');
    expect(formatDateTime('1999-03-01T00:00:00.000Z', 'UTC')).toBe('1999/03/01 00:00');
  });

  it('TC-0013-05 順位は 1st・2nd・3rd、4 位からは数字', () => {
    expect([1, 2, 3, 4, 10].map(rankLabel)).toEqual(['1st', '2nd', '3rd', '4', '10']);
  });
});
