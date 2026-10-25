import type { ResultSummary } from './game';
import { addRecord, validateName, validateRecord, type ScoreRecord } from './ranking';
import { load, saveAll, tryLoad } from './storage';

// ランキングの保存・読み出し（storage と ranking をつなぐ）（TD-0004 §3）

/** 次の id。壊れていても、保存済みの id と重ならないようにそろえる */
function loadNextId(scores: ScoreRecord[]): number {
  const saved = load<unknown>('nextId', 1);
  const nextId = typeof saved === 'number' && Number.isInteger(saved) && saved >= 1 ? saved : 1;
  return Math.max(nextId, ...scores.map((r) => r.id + 1));
}

/** scores が配列でない・1 件でも規則に合わないときは { ok: false } */
export function loadRanking(): { ok: true; scores: ScoreRecord[]; myId: number | null } | { ok: false } {
  const r = tryLoad('scores');
  if (!r.ok) return { ok: false };
  const scores = r.value === undefined ? [] : r.value;
  if (!Array.isArray(scores) || !scores.every(validateRecord)) return { ok: false };
  const myId = load<unknown>('lastRecordId', null);
  return { ok: true, scores, myId: typeof myId === 'number' ? myId : null };
}

/** 記録を作って保存する。圏外のときは scores と lastRecordId を書かない */
export function register(
  name: string,
  summary: ResultSummary,
  now: Date,
): { ok: true; rank: number | null; record: ScoreRecord } | { ok: false } {
  const ranking = loadRanking();
  if (!ranking.ok) return { ok: false };
  const nextId = loadNextId(ranking.scores);
  const record: ScoreRecord = {
    id: nextId,
    playerName: name,
    score: summary.total,
    result: summary.result,
    createdAt: now.toISOString(),
  };
  const { list, rank } = addRecord(ranking.scores, record);
  const entries: Record<string, unknown> = { nextId: nextId + 1, lastName: name };
  if (rank !== null) {
    entries.scores = list;
    entries.lastRecordId = record.id;
  }
  return saveAll(entries) ? { ok: true, rank, record } : { ok: false };
}

/**
 * 記録の全消去（仕様書 v1.2 §9.2）。記録一覧と自分の記録 id だけを消す。
 * 次の id・前回の名前・効果音の設定は残す（id を再利用しないため）。記録が壊れていても読まずに消せる
 */
export function clearRanking(): boolean {
  return saveAll({ scores: [], lastRecordId: null });
}

/** 前回の名前。規則に合わなければ '' */
export function loadLastName(): string {
  const saved = load<unknown>('lastName', '');
  if (typeof saved !== 'string') return '';
  const r = validateName(saved);
  return r.ok ? r.name : '';
}
