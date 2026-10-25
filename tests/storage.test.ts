import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { load, migrateStorage, save, saveAll, SCHEMA_VERSION, tryLoad } from '../src/storage';
import { installFakeStorage, key, type FakeStorage } from './fake-storage';

describe('保存（TD-0004 §1）', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = installFakeStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('キーにアプリ識別子を付けて JSON で書き、読み戻せる', () => {
    expect(save('nextId', 3)).toBe(true);
    expect(storage.data.get('mini-blockbreaking-game-nextId')).toBe('3');
    expect(load('nextId', 1)).toBe(3);
  });

  it('値がない・壊れた JSON・読み出しの例外は fallback。tryLoad は失敗を区別する', () => {
    expect(load('lastName', '')).toBe('');
    expect(tryLoad('lastName')).toEqual({ ok: true, value: undefined });
    storage.data.set(key('scores'), '[{');
    expect(load('scores', [])).toEqual([]);
    expect(tryLoad('scores')).toEqual({ ok: false });
    storage.failGet = true;
    expect(load('nextId', 1)).toBe(1);
    expect(tryLoad('nextId')).toEqual({ ok: false });
  });

  it('書き込みの例外は false', () => {
    storage.failSetFrom = 1;
    expect(save('nextId', 2)).toBe(false);
  });

  it('TC-0012-13 3 つ目の setItem で失敗したら false で、全部のキーが書く前の値', () => {
    storage.data.set(key('nextId'), '5');
    storage.data.set(key('lastName'), '"OLD"');
    const before = new Map(storage.data);
    storage.failSetAt = 3;
    const ok = saveAll({ nextId: 6, lastName: 'NEW', scores: [], lastRecordId: 5 });
    expect(ok).toBe(false);
    // もとになかった scores・lastRecordId は消え、あったものは元の文字列
    expect(storage.data).toEqual(before);
  });

  it('全部書けたら true', () => {
    expect(saveAll({ nextId: 2, lastName: 'A' })).toBe(true);
    expect(load('nextId', 0)).toBe(2);
    expect(load('lastName', '')).toBe('A');
  });

  it('元に戻すのにも失敗したら、例外を外に出さず false', () => {
    storage.failSetFrom = 2;
    expect(saveAll({ nextId: 2, lastName: 'A' })).toBe(false);
  });

  it('読み出しから失敗するときも例外を外に出さず false', () => {
    storage.failGet = true;
    expect(saveAll({ nextId: 2 })).toBe(false);
  });

  it('migrateStorage は未保存なら版 1 を書き、新しい版はそのまま', () => {
    migrateStorage();
    expect(load('schema', 0)).toBe(SCHEMA_VERSION);
    storage.data.set(key('schema'), '2');
    migrateStorage();
    expect(load('schema', 0)).toBe(2);
  });

  it('migrateStorage は保存できなくても例外を出さない', () => {
    storage.failSetFrom = 1;
    expect(() => migrateStorage()).not.toThrow();
  });
});
