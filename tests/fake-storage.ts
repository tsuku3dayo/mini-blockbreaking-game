import { vi } from 'vitest';

// テスト用の偽の localStorage（node 環境に localStorage がないため）

export class FakeStorage {
  readonly data = new Map<string, string>();
  /** この回数目から後の setItem をすべて例外にする（0 なら失敗しない） */
  failSetFrom = 0;
  /** この回数目の setItem だけ例外にする（0 なら失敗しない） */
  failSetAt = 0;
  failGet = false;
  private setCount = 0;

  getItem(key: string): string | null {
    if (this.failGet) throw new Error('SecurityError');
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.setCount += 1;
    if (this.failSetFrom > 0 && this.setCount >= this.failSetFrom) throw new Error('QuotaExceededError');
    if (this.setCount === this.failSetAt) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

/** 偽の localStorage を入れる。キーは接頭辞つきで data に入る */
export function installFakeStorage(): FakeStorage {
  const storage = new FakeStorage();
  vi.stubGlobal('localStorage', storage);
  return storage;
}

export const key = (name: string): string => `${__APP_ID__}-${name}`;
