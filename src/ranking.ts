import { MAX_SCORE, PLAYER_NAME_MAX, POINTS_PER_BLOCK, RANKING_LIMIT } from './config';

// 名前・記録の検証、並び順、順位、上位 10 件への追加（TD-0004 §2、仕様書 §9.3・§9.4）

export interface ScoreRecord {
  id: number;
  playerName: string;
  score: number;
  result: 'cleared' | 'gameOver';
  /** ISO 8601（UTC、ミリ秒） */
  createdAt: string;
}

export type NameError = 'empty' | 'invalidChar' | 'tooLong';

/** 制御文字（Cc）・書式文字（Cf） */
const INVALID_CHAR = /[\p{Cc}\p{Cf}]/u;
/** Date.prototype.toISOString() の形 */
const ISO_UTC_MS = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.\d{3}Z$/;
/** 全ブロックの得点。ゲームオーバーの上限・クリアの下限 */
const ALL_BLOCKS_SCORE = 400;

/** 前後の空白を除く */
export function normalizeName(raw: string): string {
  return raw.trim();
}

/** コードポイント数 */
export function countChars(name: string): number {
  return [...name].length;
}

/** 判定の順は empty → invalidChar → tooLong */
export function validateName(raw: string): { ok: true; name: string } | { ok: false; error: NameError } {
  const name = normalizeName(raw);
  if (name.length === 0) return { ok: false, error: 'empty' };
  if (INVALID_CHAR.test(name)) return { ok: false, error: 'invalidChar' };
  if (countChars(name) > PLAYER_NAME_MAX) return { ok: false, error: 'tooLong' };
  return { ok: true, name };
}

/** 0〜2,200 の 10 の倍数。ゲームオーバーは 400 以下、クリアは 400 以上 */
export function validateScore(score: unknown, result: unknown): boolean {
  if (typeof score !== 'number' || !Number.isInteger(score)) return false;
  if (score < 0 || score > MAX_SCORE || score % POINTS_PER_BLOCK !== 0) return false;
  if (result === 'gameOver') return score <= ALL_BLOCKS_SCORE;
  if (result === 'cleared') return score >= ALL_BLOCKS_SCORE;
  return false;
}

/** 項目の型・名前・スコア・日時の形 */
export function validateRecord(r: unknown): r is ScoreRecord {
  if (typeof r !== 'object' || r === null) return false;
  const { id, playerName, score, result, createdAt } = r as Record<string, unknown>;
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) return false;
  if (typeof playerName !== 'string') return false;
  const name = validateName(playerName);
  if (!name.ok || name.name !== playerName) return false;
  if (!validateScore(score, result)) return false;
  return typeof createdAt === 'string' && isIsoUtcMs(createdAt);
}

/** toISOString() の形で、ありえる日時か（ロジック層では Date を使わない） */
function isIsoUtcMs(text: string): boolean {
  const m = ISO_UTC_MS.exec(text);
  if (!m) return false;
  const [year, month, day, hour, minute, second] = m.slice(1).map(Number);
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return days !== undefined && day >= 1 && day <= days && hour < 24 && minute < 60 && second < 60;
}

/** score 降順 → createdAt 昇順 → id 昇順 */
export function compareRecords(a: ScoreRecord, b: ScoreRecord): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id - b.id;
}

/** 自分より上位の記録の数 + 1 */
export function rankOf(list: ScoreRecord[], r: ScoreRecord): number {
  return list.filter((other) => other.id !== r.id && compareRecords(other, r) < 0).length + 1;
}

/** 順位が 10 以下なら新しい一覧（上位 10 件）、11 以上なら rank は null で一覧はそのまま */
export function addRecord(list: ScoreRecord[], r: ScoreRecord): { list: ScoreRecord[]; rank: number | null } {
  const rank = rankOf(list, r);
  if (rank > RANKING_LIMIT) return { list, rank: null };
  const next = [...list, r].sort(compareRecords).slice(0, RANKING_LIMIT);
  return { list: next, rank };
}
