import { describe, expect, it } from 'vitest';
import { backupFileName, createBackup, parseBackup, type BackupData } from '../src/backup';
import type { ScoreRecord } from '../src/ranking';

function rec(id: number, score: number, playerName = `P${id}`): ScoreRecord {
  return { id, playerName, score, result: score >= 400 ? 'cleared' : 'gameOver', createdAt: `2026-10-22T00:00:${String(id % 60).padStart(2, '0')}.000Z` };
}

/** 正しいバックアップの中身（必要なところだけ上書きする） */
function file(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    app: 'mini-blockbreaking-game',
    schemaVersion: 1,
    exportedAt: '2026-10-23T03:15:00.123Z',
    nextId: 4,
    lastPlayerName: 'TSUKU',
    lastRecordId: 2,
    scores: [rec(1, 1250), rec(2, 980, 'TSUKU'), rec(3, 120)],
    ...overrides,
  });
}

describe('バックアップ（TC-0014）', () => {
  it('書き出した JSON を読み込むと同じ中身に戻る', () => {
    const data: BackupData = { nextId: 4, lastPlayerName: 'TSUKU', lastRecordId: 2, scores: [rec(1, 1250), rec(2, 980, 'TSUKU'), rec(3, 120)] };
    const text = createBackup(data, new Date('2026-10-23T03:15:00.123Z'));
    expect(JSON.parse(text)).toMatchObject({ app: 'mini-blockbreaking-game', schemaVersion: 1, exportedAt: '2026-10-23T03:15:00.123Z' });
    // 2 字下げ
    expect(text).toContain('\n  "app"');
    expect(parseBackup(text)).toEqual({ ok: true, data });
  });

  it('TC-0014-02 読めないファイル・別のアプリ・新しすぎる版・scores がない', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'unreadable' });
    expect(parseBackup('[]')).toEqual({ ok: false, error: 'unreadable' });
    expect(parseBackup('null')).toEqual({ ok: false, error: 'unreadable' });
    expect(parseBackup(file({ app: 'simple_shogi' }))).toEqual({ ok: false, error: 'otherApp' });
    expect(parseBackup(file({ schemaVersion: 2 }))).toEqual({ ok: false, error: 'tooNew' });
    const noScores = JSON.parse(file()) as Record<string, unknown>;
    delete noScores.scores;
    expect(parseBackup(JSON.stringify(noScores))).toEqual({ ok: false, error: 'unreadable' });
    // 判定の順：app が違えば、版が新しくても otherApp
    expect(parseBackup(file({ app: 'other', schemaVersion: 9 }))).toEqual({ ok: false, error: 'otherApp' });
  });

  it('TC-0014-04 結果と合わないスコアは invalidRecord', () => {
    expect(parseBackup(file({ scores: [{ ...rec(1, 400), score: 410, result: 'gameOver' }] }))).toEqual({ ok: false, error: 'invalidRecord' });
    expect(parseBackup(file({ scores: [{ ...rec(1, 400), score: 390, result: 'cleared' }] }))).toEqual({ ok: false, error: 'invalidRecord' });
    expect(parseBackup(file({ scores: [{ ...rec(1, 1250), score: 1255 }] }))).toEqual({ ok: false, error: 'invalidRecord' });
    // id の重複、scores が配列でない
    expect(parseBackup(file({ scores: [rec(1, 1250), rec(1, 980)] }))).toEqual({ ok: false, error: 'invalidRecord' });
    expect(parseBackup(file({ scores: {} }))).toEqual({ ok: false, error: 'invalidRecord' });
  });

  it('TC-0014-07 ファイル名は端末の日付', () => {
    expect(backupFileName(new Date(2026, 9, 23))).toBe('mini-blockbreaking-game-backup-20261023.json');
    expect(backupFileName(new Date(2027, 0, 5, 23, 59))).toBe('mini-blockbreaking-game-backup-20270105.json');
  });

  it('TC-0014-09 10 件を超えたら上位 10 件、nextId は最大 id + 1 にそろえる', () => {
    const scores = Array.from({ length: 12 }, (_, i) => rec(30 - i, 2200 - i * 100));
    const r = parseBackup(file({ scores, nextId: 5, lastRecordId: 19 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.scores).toHaveLength(10);
    expect(r.data.scores.map((x) => x.score)).toEqual([2200, 2100, 2000, 1900, 1800, 1700, 1600, 1500, 1400, 1300]);
    expect(r.data.nextId).toBe(31);
    // 外れた記録を指す自分の記録 id は null
    expect(r.data.lastRecordId).toBeNull();
  });

  it('前回の名前が規則に合わなければ空、自分の記録 id が一覧にあれば残す', () => {
    const r = parseBackup(file({ lastPlayerName: 'A​B' }));
    expect(r.ok && r.data.lastPlayerName).toBe('');
    expect(r.ok && r.data.lastRecordId).toBe(2);
  });
});
