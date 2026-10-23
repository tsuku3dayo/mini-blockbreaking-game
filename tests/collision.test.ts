import { describe, expect, it } from 'vitest';
import { blockRect, circleRect, collideBlocks, collidePaddle, collideWalls, enforceMinVy } from '../src/collision';
import { BLOCK_COUNT } from '../src/config';
import type { Ball } from '../src/game';

const SPEED = 300;
const ball = (x: number, y: number, vx: number, vy: number): Ball => ({ x, y, vx, vy });
const allAlive = (): boolean[] => new Array<boolean>(BLOCK_COUNT).fill(true);

describe('collidePaddle（TC-0003）', () => {
  it('TC-0003-01 中央で真上に打ち返す', () => {
    const b = ball(240, 597, 50, 290);
    expect(collidePaddle(b, 240, SPEED)).toBe('bounce');
    expect(b.vx).toBeCloseTo(0, 9);
    expect(b.vy).toBeCloseTo(-300, 9);
    expect(b.y).toBe(594);
  });

  it('TC-0003-02 端で 60°（打ち返す前の速度によらない）', () => {
    for (const [vx, vy] of [
      [0, 300],
      [-200, 100],
      [250, 50],
    ]) {
      const right = ball(280, 597, vx, vy);
      expect(collidePaddle(right, 240, SPEED)).toBe('bounce');
      expect(right.vx).toBeCloseTo(259.81, 2);
      expect(right.vy).toBeCloseTo(-150, 9);

      const left = ball(200, 597, vx, vy);
      expect(collidePaddle(left, 240, SPEED)).toBe('bounce');
      expect(left.vx).toBeCloseTo(-259.81, 2);
      expect(left.vy).toBeCloseTo(-150, 9);
    }
  });

  it('TC-0003-03 上向きのボールは押し出すだけ', () => {
    const b = ball(240, 597, 0, -300);
    expect(collidePaddle(b, 240, SPEED)).toBe('push');
    expect(b.y).toBe(594);
    expect(b.vx).toBe(0);
    expect(b.vy).toBe(-300);
  });

  it('TC-0003-04 側面・角（左端の外側から）', () => {
    // パドル中心 240 → 左端 200。ボール中心 y = 605 で、左端の外側から重なる
    const b = ball(196, 605, 120, 200);
    expect(collidePaddle(b, 240, SPEED)).toBe('side');
    expect(b.x).toBe(194);
    expect(b.vx).toBe(-120);
    expect(b.vy).toBe(200);

    // 右側からも同じ
    const r = ball(284, 605, -120, 200);
    expect(collidePaddle(r, 240, SPEED)).toBe('side');
    expect(r.x).toBe(286);
    expect(r.vx).toBe(120);
    expect(r.vy).toBe(200);
  });

  it('TC-0003-01 重なっていなければ打ち返さない（接しているだけも含む）', () => {
    expect(collidePaddle(ball(240, 590, 0, 300), 240, SPEED)).toBeNull();
    // 上面にちょうど接する（d = r）
    expect(collidePaddle(ball(240, 594, 0, 300), 240, SPEED)).toBeNull();
  });
});

describe('collideWalls（TC-0003）', () => {
  it('TC-0003-05 左右の壁と天井', () => {
    const left = ball(3, 300, -100, 200);
    expect(collideWalls(left)).toBe(true);
    expect(left.x).toBe(6);
    expect(left.vx).toBeGreaterThan(0);

    const right = ball(478, 300, 100, 200);
    expect(collideWalls(right)).toBe(true);
    expect(right.x).toBe(474);
    expect(right.vx).toBeLessThan(0);

    const ceiling = ball(240, 50, 100, -200);
    expect(collideWalls(ceiling)).toBe(true);
    expect(ceiling.y).toBe(54);
    expect(ceiling.vy).toBeGreaterThan(0);
  });

  it('TC-0003-06 下端では跳ね返らない', () => {
    const b = ball(240, 645, 100, 200);
    expect(collideWalls(b)).toBe(false);
    expect(b).toEqual(ball(240, 645, 100, 200));
  });

  it('TC-0003-07 向きは絶対値で設定する（すでに右向きなら反転しない）', () => {
    const b = ball(3, 300, 100, 200);
    expect(collideWalls(b)).toBe(true);
    expect(b.x).toBe(6);
    expect(b.vx).toBe(100);
  });
});

describe('enforceMinVy（TC-0003）', () => {
  it('TC-0003-09 垂直成分の下限（符号を保つ）', () => {
    const a = ball(0, 0, 299, 10);
    enforceMinVy(a, SPEED);
    expect(a.vx).toBeCloseTo(259.81, 2);
    expect(a.vy).toBe(150);
    expect(Math.hypot(a.vx, a.vy)).toBeCloseTo(SPEED, 9);

    const b = ball(0, 0, -299, -10);
    enforceMinVy(b, SPEED);
    expect(b.vx).toBeCloseTo(-259.81, 2);
    expect(b.vy).toBe(-150);
  });

  it('TC-0003-09 下限以上なら何もしない・0 は正の向きとして扱う', () => {
    const a = ball(0, 0, 200, -150);
    enforceMinVy(a, SPEED);
    expect(a).toEqual(ball(0, 0, 200, -150));

    const zero = ball(0, 0, 0, 0);
    enforceMinVy(zero, SPEED);
    expect(zero.vy).toBe(150);
    expect(zero.vx).toBeCloseTo(259.81, 2);
  });
});

describe('collideBlocks（TC-0004）', () => {
  it('TC-0004-01 1 個壊す', () => {
    // ブロック 32（5 行目・1 列目）：x 18〜70、y 184〜204。下面に上向きで当てる
    const alive = allAlive();
    const b = ball(44, 208, 0, -300);
    const hit = collideBlocks(b, alive, SPEED);
    expect(hit).toEqual({ ids: [32], representative: 32, row: 4 });
    expect(alive[32]).toBe(false);
    expect(alive.filter((a) => !a)).toHaveLength(1);
    expect(b.y).toBe(210);
    expect(b.vy).toBe(300);
  });

  it('TC-0004-02 2 個同時に壊し、反射は 1 回', () => {
    // ブロック 32 と 33 の間（x = 72）の下面
    const alive = allAlive();
    const b = ball(72, 208, 0, -300);
    const hit = collideBlocks(b, alive, SPEED);
    expect(hit?.ids).toEqual([32, 33]);
    expect(alive[32]).toBe(false);
    expect(alive[33]).toBe(false);
    // 2 回反射すると上向きに戻ってしまう。1 回だけなので下向き
    expect(b.vy).toBe(300);
    expect(b.y).toBe(210);
  });

  it('TC-0004-03 深さが同じなら ID の小さい方を代表にする', () => {
    // ブロック 32 と 33 の間で、両方に深さ 4 で重なる。側面として扱われる位置
    const alive = allAlive();
    const b = ball(72, 194, 100, -200);
    const hit = collideBlocks(b, alive, SPEED);
    expect(hit?.ids).toEqual([32, 33]);
    expect(hit?.representative).toBe(32);
    // 代表が 32 なら、32 の右端の外へ（33 なら 33 の左端の外へ x = 68、左向き）
    expect(b.x).toBe(76);
    expect(b.vx).toBe(100);
    expect(b.vy).toBe(-200);
  });

  it('TC-0004-04 側面・上下面・角', () => {
    // 横から：ブロック 32 の左側面
    const side = ball(14, 194, 200, -200);
    collideBlocks(side, allAlive(), SPEED);
    expect(side.x).toBe(12);
    expect(side.vx).toBe(-200);
    expect(side.vy).toBe(-200);

    // 上から：ブロック 0（1 行目）の上面
    const top = ball(44, 84, 0, 300);
    collideBlocks(top, allAlive(), SPEED);
    expect(top.y).toBe(82);
    expect(top.vy).toBe(-300);
    expect(top.x).toBe(44);

    // 角：ブロック 32 の左下の角（overlapX = overlapY = 4）
    const corner = ball(16, 206, 200, -200);
    const overlap = circleRect(16, 206, 6, 18, 184, 52, 20);
    expect(overlap?.overlapX).toBe(overlap?.overlapY);
    collideBlocks(corner, allAlive(), SPEED);
    expect(corner.x).toBe(12);
    expect(corner.y).toBe(210);
    expect(corner.vx).toBe(-200);
    expect(corner.vy).toBe(200);
  });

  it('TC-0004-04 壊したあとの最小垂直成分の補正', () => {
    // ほぼ水平に横から当たると、反射のあと |vy| が 150 に上がる
    const b = ball(14, 194, 290, -20);
    collideBlocks(b, allAlive(), SPEED);
    expect(b.vy).toBe(-150);
    expect(b.vx).toBeCloseTo(-259.81, 2);
  });

  it('TC-0004-01 壊れたブロックには当たらない・重なりがなければ何も壊さない', () => {
    const alive = allAlive();
    alive[32] = false;
    expect(collideBlocks(ball(44, 208, 0, -300), alive, SPEED)).toBeNull();
    expect(collideBlocks(ball(240, 400, 0, -300), allAlive(), SPEED)).toBeNull();
  });
});

describe('blockRect・circleRect（TC-0004）', () => {
  it('TC-0004-04 ブロックの位置（§3.3）', () => {
    expect(blockRect(0)).toEqual({ x: 18, y: 88, w: 52, h: 20 });
    expect(blockRect(7)).toEqual({ x: 410, y: 88, w: 52, h: 20 });
    expect(blockRect(39)).toEqual({ x: 410, y: 184, w: 52, h: 20 });
  });

  it('TC-0004-04 接しているだけ（d = r）は重なりに含めない（§5.9）', () => {
    expect(circleRect(10, 0, 6, 16, -10, 20, 20)).toBeNull();
    expect(circleRect(10.5, 0, 6, 16, -10, 20, 20)?.depth).toBeCloseTo(0.5, 9);
  });
});
