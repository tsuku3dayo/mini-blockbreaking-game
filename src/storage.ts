// localStorage の読み書き・版番号と移行（TD-0004 §1、ADR-0006）

const PREFIX = __APP_ID__;
export const SCHEMA_VERSION = 1;

function keyOf(name: string): string {
  return `${PREFIX}-${name}`;
}

/** 読めないとき・値がないときは fallback */
export function load<T>(key: string, fallback: T): T {
  const r = tryLoad(key);
  return r.ok && r.value !== undefined ? (r.value as T) : fallback;
}

/** 読み出しの失敗を区別したいとき（ランキング画面）に使う。値がないときは value が undefined */
export function tryLoad(key: string): { ok: true; value: unknown } | { ok: false } {
  try {
    const text = localStorage.getItem(keyOf(key));
    return { ok: true, value: text === null ? undefined : (JSON.parse(text) as unknown) };
  } catch {
    return { ok: false };
  }
}

/** 書けたら true */
export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(keyOf(key), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** 全部書けたら true。途中で失敗したら、書く前の値に戻して false */
export function saveAll(entries: Record<string, unknown>): boolean {
  const before = new Map<string, string | null>();
  try {
    for (const key of Object.keys(entries)) before.set(key, localStorage.getItem(keyOf(key)));
  } catch {
    return false;
  }
  try {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(keyOf(key), JSON.stringify(value));
    return true;
  } catch {
    // 元に戻す。戻すのにも失敗したら、何もしない
    try {
      for (const [key, text] of before) {
        if (text === null) localStorage.removeItem(keyOf(key));
        else localStorage.setItem(keyOf(key), text);
      }
    } catch {
      // 例外を外に出さない
    }
    return false;
  }
}

/** 起動時。schema が古ければ移行する（版 1 では移行なし。未保存なら版 1 を書く） */
export function migrateStorage(): void {
  const schema = load<unknown>('schema', 0);
  if (typeof schema === 'number' && schema >= SCHEMA_VERSION) return;
  save('schema', SCHEMA_VERSION);
}

/** 保存データを消されにくくするよう、ブラウザに頼む（対応していなければ何もしない） */
export function requestPersist(): void {
  try {
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    // 対応していない
  }
}
