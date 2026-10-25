// 表示の形式（TD-0004 §7）

const numberFormat = new Intl.NumberFormat('ja-JP');

/** 3 桁区切り（例：1,250） */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** タイム：ミリ秒を、小数 1 桁の秒にする（切り捨て。例：95789 → 95.7） */
export function formatSeconds(ms: number): string {
  return (Math.floor(ms / 100) / 10).toFixed(1);
}

/** ISO 8601 の UTC（toISOString() の形）を、1970-01-01 からのミリ秒にする（ロジック層では Date を使わない） */
function isoToEpochMs(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(iso);
  if (!m) return NaN;
  const [year, month, day, hour, minute, second, ms] = m.slice(1).map(Number);
  // 暦の日付から 1970-01-01 からの日数を求める（3 月始まりの年で数える）
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  const days = era * 146097 + doe - 719468;
  return ((days * 24 + hour) * 60 + minute) * 60000 + second * 1000 + ms;
}

/** 登録日時：YYYY/MM/DD HH:mm（24 時間制）。timeZone を省くと端末のタイムゾーン */
export function formatDateTime(iso: string, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(isoToEpochMs(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}/${part('month')}/${part('day')} ${part('hour')}:${part('minute')}`;
}

const RANK_LABELS = ['1st', '2nd', '3rd'];

/** 順位：1〜3 位は 1st・2nd・3rd、4 位からは数字だけ */
export function rankLabel(rank: number): string {
  return RANK_LABELS[rank - 1] ?? String(rank);
}
