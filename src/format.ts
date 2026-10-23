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
