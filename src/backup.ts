import { RANKING_LIMIT, SCHEMA_VERSION } from './config';
import { compareRecords, validateName, validateRecord, type ScoreRecord } from './ranking';

// バックアップの形の組み立てと検証（TD-0004 §4、仕様書 §9.6）

export interface BackupData {
  nextId: number;
  lastPlayerName: string;
  lastRecordId: number | null;
  scores: ScoreRecord[];
}

export type BackupError = 'unreadable' | 'otherApp' | 'tooNew' | 'invalidRecord';

/** 読み込めなかった理由の文（仕様書 §9.6） */
export const BACKUP_ERROR_MESSAGES: Record<BackupError, string> = {
  unreadable: '記録のファイルとして読み込めませんでした',
  otherApp: '別のアプリの記録です',
  tooNew: '新しい版のアプリで書き出した記録です。アプリを更新してから読み込んでください',
  invalidRecord: '記録の内容が正しくありません',
};

/** 書き出す JSON（2 字下げ） */
export function createBackup(data: BackupData, now: Date): string {
  return JSON.stringify(
    {
      app: __APP_ID__,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now.toISOString(),
      nextId: data.nextId,
      lastPlayerName: data.lastPlayerName,
      lastRecordId: data.lastRecordId,
      scores: data.scores,
    },
    null,
    2,
  );
}

/** 判定の順は unreadable → otherApp → tooNew → invalidRecord（最初に当てはまったもの） */
export function parseBackup(text: string): { ok: true; data: BackupData } | { ok: false; error: BackupError } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'unreadable' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'unreadable' };
  const file = raw as Record<string, unknown>;
  if (!('app' in file) || !('schemaVersion' in file) || !('scores' in file)) return { ok: false, error: 'unreadable' };
  if (file.app !== __APP_ID__) return { ok: false, error: 'otherApp' };
  if (typeof file.schemaVersion !== 'number' || !Number.isInteger(file.schemaVersion)) return { ok: false, error: 'unreadable' };
  if (file.schemaVersion > SCHEMA_VERSION) return { ok: false, error: 'tooNew' };
  // 版 1 しかないので、古い版からの移行は今はない（版を上げたら、ここに移行を足す）

  const scores = file.scores;
  if (!Array.isArray(scores) || !scores.every(validateRecord)) return { ok: false, error: 'invalidRecord' };
  const ids = new Set(scores.map((r) => r.id));
  if (ids.size !== scores.length) return { ok: false, error: 'invalidRecord' };

  // 並び順に並べて上位 10 件。次の id は、記録の最大 id より大きくそろえる
  const kept = [...scores].sort(compareRecords).slice(0, RANKING_LIMIT);
  const savedNextId = typeof file.nextId === 'number' && Number.isInteger(file.nextId) && file.nextId >= 1 ? file.nextId : 1;
  const nextId = Math.max(savedNextId, ...scores.map((r) => r.id + 1));
  const name = typeof file.lastPlayerName === 'string' ? validateName(file.lastPlayerName) : null;
  const lastRecordId = kept.some((r) => r.id === file.lastRecordId) ? (file.lastRecordId as number) : null;
  return {
    ok: true,
    data: { nextId, lastPlayerName: name?.ok ? name.name : '', lastRecordId, scores: kept },
  };
}

/** 'mini-blockbreaking-game-backup-YYYYMMDD.json'（日付は端末のタイムゾーン） */
export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${__APP_ID__}-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.json`;
}
