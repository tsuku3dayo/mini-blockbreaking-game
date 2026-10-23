import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 仮のテスト：テストの仕組みが動くことだけ確かめる。src/config.ts の本物のテスト（TASK-0004）ができたら消す
describe('smoke', () => {
  it('package.json を読み込める', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string; version: string };
    expect(pkg.name).toBe('mini-blockbreaking-game');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
