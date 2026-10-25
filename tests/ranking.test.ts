import { describe, expect, it } from 'vitest';
import {
  addRecord,
  compareRecords,
  countChars,
  rankOf,
  validateName,
  validateRecord,
  validateScore,
  type ScoreRecord,
} from '../src/ranking';

function rec(id: number, score: number, createdAt = `2026-10-23T03:00:${String(id % 60).padStart(2, '0')}.000Z`): ScoreRecord {
  return { id, playerName: `P${id}`, score, result: score >= 400 ? 'cleared' : 'gameOver', createdAt };
}

/** 最下位 500 の 10 件（1,400 → 500） */
function tenRecords(): ScoreRecord[] {
  return Array.from({ length: 10 }, (_, i) => rec(i + 1, 1400 - i * 100));
}

describe('名前の規則（TC-0012）', () => {
  it('TC-0012-01 前後の空白を除く', () => {
    expect(validateName(' TSUKU ')).toEqual({ ok: true, name: 'TSUKU' });
    expect(validateName('　TSUKU　')).toEqual({ ok: true, name: 'TSUKU' });
  });

  it('TC-0012-03 登録できない名前', () => {
    expect(validateName('A'.repeat(13))).toEqual({ ok: false, error: 'tooLong' });
    expect(validateName('')).toEqual({ ok: false, error: 'empty' });
    expect(validateName(' 　 ')).toEqual({ ok: false, error: 'empty' });
    expect(validateName('A​B')).toEqual({ ok: false, error: 'invalidChar' });
    expect(validateName('A\u0007B')).toEqual({ ok: false, error: 'invalidChar' });
    // 12 文字ちょうどは通る
    expect(validateName('A'.repeat(12))).toEqual({ ok: true, name: 'A'.repeat(12) });
  });

  it('TC-0012-04 13 文字でゼロ幅文字を含む名前は invalidChar（tooLong より先）', () => {
    expect(validateName('ABCDEF​GHIJKL')).toEqual({ ok: false, error: 'invalidChar' });
  });

  it('TC-0012-06 𠮷 は 1 文字と数える', () => {
    expect(countChars('𠮷'.repeat(12))).toBe(12);
    expect(validateName('𠮷'.repeat(12))).toEqual({ ok: true, name: '𠮷'.repeat(12) });
    expect(validateName('𠮷'.repeat(13))).toEqual({ ok: false, error: 'tooLong' });
  });
});

describe('スコアと記録の規則（仕様書 §9.3）', () => {
  it('0〜2,200 の 10 の倍数で、結果と合っている', () => {
    expect(validateScore(0, 'gameOver')).toBe(true);
    expect(validateScore(400, 'gameOver')).toBe(true);
    expect(validateScore(410, 'gameOver')).toBe(false);
    expect(validateScore(400, 'cleared')).toBe(true);
    expect(validateScore(390, 'cleared')).toBe(false);
    expect(validateScore(2200, 'cleared')).toBe(true);
    expect(validateScore(2210, 'cleared')).toBe(false);
    expect(validateScore(125, 'gameOver')).toBe(false);
    expect(validateScore(-10, 'gameOver')).toBe(false);
    expect(validateScore('120', 'gameOver')).toBe(false);
    expect(validateScore(120, 'lost')).toBe(false);
  });

  it('項目の型・名前・日時の形を確かめる', () => {
    const ok = rec(1, 1250);
    expect(validateRecord(ok)).toBe(true);
    expect(validateRecord(null)).toBe(false);
    expect(validateRecord({ ...ok, id: 0 })).toBe(false);
    expect(validateRecord({ ...ok, id: 1.5 })).toBe(false);
    expect(validateRecord({ ...ok, playerName: ' P1 ' })).toBe(false);
    expect(validateRecord({ ...ok, playerName: '' })).toBe(false);
    expect(validateRecord({ ...ok, result: 'gameOver' })).toBe(false);
    expect(validateRecord({ ...ok, createdAt: '2026-10-23 03:00:00' })).toBe(false);
    expect(validateRecord({ ...ok, createdAt: '2026-13-45T03:00:00.000Z' })).toBe(false);
    expect(validateRecord({ ...ok, createdAt: '2026-02-29T03:00:00.000Z' })).toBe(false);
    expect(validateRecord({ ...ok, createdAt: '2028-02-29T23:59:59.999Z' })).toBe(true);
    expect(validateRecord({ ...ok, createdAt: '2026-10-23T24:00:00.000Z' })).toBe(false);
  });
});

describe('並び順と順位（TC-0012・TC-0013）', () => {
  it('TC-0013-01 同点は先に登録した方が上、日時も同じなら小さい id が上', () => {
    const early = rec(5, 800, '2026-10-23T03:00:00.000Z');
    const late = rec(2, 800, '2026-10-23T03:00:00.001Z');
    expect(compareRecords(early, late)).toBeLessThan(0);
    expect(rankOf([early], late)).toBe(2);
    expect(rankOf([late], early)).toBe(1);

    const small = rec(3, 800, '2026-10-23T03:00:00.000Z');
    const large = rec(4, 800, '2026-10-23T03:00:00.000Z');
    expect(compareRecords(small, large)).toBeLessThan(0);
    expect(rankOf([small], large)).toBe(2);
    expect(rankOf([large], small)).toBe(1);

    // 点数が高い方が上
    expect(compareRecords(rec(1, 900), rec(2, 800))).toBeLessThan(0);
  });

  it('TC-0012-07 10 件（最下位 500）に 400 は圏外で、一覧は同じ', () => {
    const list = tenRecords();
    const { list: next, rank } = addRecord(list, rec(11, 400));
    expect(rank).toBeNull();
    expect(next).toBe(list);
    expect(next).toHaveLength(10);
  });

  it('TC-0012-09 最下位より高い記録で 10 位が外れる', () => {
    const list = tenRecords();
    const r = rec(11, 950);
    const { list: next, rank } = addRecord(list, r);
    // 1,400〜1,000 の 5 件の次
    expect(rank).toBe(6);
    expect(next).toHaveLength(10);
    expect(next[5]).toBe(r);
    expect(next.some((x) => x.id === 10)).toBe(false);
    expect(next.map((x) => x.score)).toEqual([1400, 1300, 1200, 1100, 1000, 950, 900, 800, 700, 600]);
  });

  it('最下位と同点の後の登録は 11 位で圏外、空の一覧なら 1 位', () => {
    expect(addRecord(tenRecords(), rec(11, 500, '2026-10-24T00:00:00.000Z')).rank).toBeNull();
    expect(addRecord([], rec(1, 120))).toEqual({ list: [rec(1, 120)], rank: 1 });
  });
});
