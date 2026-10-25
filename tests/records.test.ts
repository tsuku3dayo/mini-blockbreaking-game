import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResultSummary } from '../src/game';
import type { ScoreRecord } from '../src/ranking';
import { loadLastName, loadRanking, register } from '../src/records';
import { load } from '../src/storage';
import { installFakeStorage, key, type FakeStorage } from './fake-storage';

const NOW = new Date('2026-10-23T03:15:00.123Z');

function summary(result: 'cleared' | 'gameOver', total: number): ResultSummary {
  return { result, broken: result === 'cleared' ? 40 : total / 10, blockScore: Math.min(total, 400), timeBonus: Math.max(0, total - 400), total, elapsedMs: 95789 };
}

function rec(id: number, score: number): ScoreRecord {
  return { id, playerName: `P${id}`, score, result: score >= 400 ? 'cleared' : 'gameOver', createdAt: `2026-10-22T00:00:${String(id).padStart(2, '0')}.000Z` };
}

describe('記録の読み書き（TD-0004 §3）', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = installFakeStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('空のランキングに登録すると 1 位で、記録・次の id・前回の名前・自分の記録 id を保存する', () => {
    const r = register('TSUKU', summary('cleared', 1250), NOW);
    expect(r).toEqual({
      ok: true,
      rank: 1,
      record: { id: 1, playerName: 'TSUKU', score: 1250, result: 'cleared', createdAt: '2026-10-23T03:15:00.123Z' },
    });
    expect(loadRanking()).toEqual({ ok: true, scores: [r.ok && r.record], myId: 1 });
    expect(load('nextId', 0)).toBe(2);
    expect(loadLastName()).toBe('TSUKU');
  });

  it('同じ点数の 2 回目は 2 位', () => {
    register('A', summary('gameOver', 120), NOW);
    const r = register('B', summary('gameOver', 120), NOW);
    expect(r.ok && r.rank).toBe(2);
    const ranking = loadRanking();
    expect(ranking.ok && ranking.scores.map((x) => x.playerName)).toEqual(['A', 'B']);
    expect(ranking.ok && ranking.myId).toBe(2);
  });

  it('圏外のときは scores と自分の記録 id を書かず、次の id と前回の名前は書く', () => {
    const scores = Array.from({ length: 10 }, (_, i) => rec(i + 1, 1400 - i * 100));
    storage.data.set(key('scores'), JSON.stringify(scores));
    storage.data.set(key('nextId'), '11');
    storage.data.set(key('lastRecordId'), '3');
    const r = register('LOW', summary('gameOver', 120), NOW);
    expect(r.ok && r.rank).toBeNull();
    expect(loadRanking()).toEqual({ ok: true, scores, myId: 3 });
    expect(load('nextId', 0)).toBe(12);
    expect(loadLastName()).toBe('LOW');
  });

  it('保存できないときは { ok: false } で、何も変わらない', () => {
    storage.failSetFrom = 1;
    expect(register('A', summary('gameOver', 120), NOW)).toEqual({ ok: false });
    expect(storage.data.size).toBe(0);
  });

  it('scores が壊れている・規則に合わないときは読み込み失敗で、登録もしない', () => {
    storage.data.set(key('scores'), '[{');
    expect(loadRanking()).toEqual({ ok: false });
    expect(register('A', summary('gameOver', 120), NOW)).toEqual({ ok: false });
    storage.data.set(key('scores'), JSON.stringify({}));
    expect(loadRanking()).toEqual({ ok: false });
    storage.data.set(key('scores'), JSON.stringify([rec(1, 1250), { ...rec(2, 125) }]));
    expect(loadRanking()).toEqual({ ok: false });
  });

  it('0 件のときは空の一覧', () => {
    expect(loadRanking()).toEqual({ ok: true, scores: [], myId: null });
  });

  it('次の id が壊れていても、保存済みの id と重ならない', () => {
    storage.data.set(key('scores'), JSON.stringify([rec(7, 1250)]));
    storage.data.set(key('nextId'), '"x"');
    const r = register('A', summary('gameOver', 120), NOW);
    expect(r.ok && r.record.id).toBe(8);
  });

  it('前回の名前が規則に合わなければ空', () => {
    expect(loadLastName()).toBe('');
    storage.data.set(key('lastName'), JSON.stringify('A​B'));
    expect(loadLastName()).toBe('');
    storage.data.set(key('lastName'), '12');
    expect(loadLastName()).toBe('');
  });
});
