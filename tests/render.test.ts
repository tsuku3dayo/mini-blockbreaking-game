import { describe, expect, it } from 'vitest';
import { createGame } from '../src/game';
import { render, type Palette } from '../src/render';

const palette: Palette = {
  field: '#050814',
  frame: '#3A4468',
  text: '#E6EAF2',
  muted: '#A0AABF',
  paddle: '#E6EAF2',
  ball: '#FFFFFF',
  veil: 'rgb(11 16 32 / 0.75)',
  blocks: ['#EF5350', '#FFA726', '#FFD54F', '#66BB6A', '#4FC3F7'],
};

interface Call {
  name: string;
  args: unknown[];
  fillStyle: string;
  strokeStyle: string;
  globalAlpha: number;
  font: string;
  textAlign: string;
}

/** 呼ばれた描画の命令を、そのときの色・不透明度・文字の設定と一緒に記録する偽の Canvas */
function fakeContext(width = 960) {
  const calls: Call[] = [];
  const ctx = {
    canvas: { width, height: (width * 4) / 3 },
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  } as Record<string, unknown>;
  for (const name of ['setTransform', 'clearRect', 'fillRect', 'strokeRect', 'beginPath', 'roundRect', 'arc', 'fill', 'fillText']) {
    ctx[name] = (...args: unknown[]) => {
      calls.push({
        name,
        args,
        fillStyle: ctx.fillStyle as string,
        strokeStyle: ctx.strokeStyle as string,
        globalAlpha: ctx.globalAlpha as number,
        font: ctx.font as string,
        textAlign: ctx.textAlign as string,
      });
    };
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const texts = (calls: Call[]) => calls.filter((c) => c.name === 'fillText');

describe('描画（TC-0002・TC-0004・TC-0005）', () => {
  it('TC-0002-04 盤面の描画位置と色、描く順', () => {
    const { ctx, calls } = fakeContext();
    render(ctx, createGame(), palette, false);

    // 論理座標で描けるよう、実ピクセル幅 / 480 で拡大する
    expect(calls[0]).toMatchObject({ name: 'setTransform', args: [2, 0, 0, 2, 0, 0] });

    const background = calls.findIndex((c) => c.name === 'fillRect' && c.fillStyle === palette.field);
    const frame = calls.findIndex((c) => c.name === 'strokeRect');
    const blocks = calls.filter((c) => c.name === 'fillRect' && palette.blocks.includes(c.fillStyle));
    const paddle = calls.findIndex((c) => c.name === 'roundRect');
    const ball = calls.findIndex((c) => c.name === 'arc');
    const hud = calls.findIndex((c) => c.name === 'fillText');
    const firstBlock = calls.indexOf(blocks[0]);
    const lastBlock = calls.indexOf(blocks[blocks.length - 1]);

    expect(calls[background].args).toEqual([0, 0, 480, 640]);
    expect(calls[frame]).toMatchObject({ args: [1, 1, 478, 638], strokeStyle: palette.frame });
    expect(blocks).toHaveLength(40);
    expect(blocks[0].args).toEqual([18, 88, 52, 20]);
    expect(blocks[1].args).toEqual([74, 88, 52, 20]);
    expect(blocks[8].args).toEqual([18, 112, 52, 20]);
    expect(blocks[39].args).toEqual([410, 184, 52, 20]);
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) expect(blocks[row * 8 + col].fillStyle).toBe(palette.blocks[row]);
    }
    expect(calls[paddle]).toMatchObject({ args: [200, 600, 80, 12, 4], fillStyle: palette.paddle });
    expect(calls[ball]).toMatchObject({ args: [240, 593, 6, 0, Math.PI * 2], fillStyle: palette.ball });

    // §2.2 の順：背景 → 外枠 → ブロック → パドル → ボール → HUD
    expect(background).toBeLessThan(frame);
    expect(frame).toBeLessThan(firstBlock);
    expect(lastBlock).toBeLessThan(paddle);
    expect(paddle).toBeLessThan(ball);
    expect(ball).toBeLessThan(hud);
  });

  it('TC-0002-04 壊れたブロックは描かない', () => {
    const state = createGame();
    state.alive[0] = false;
    state.alive[39] = false;
    const { ctx, calls } = fakeContext();
    render(ctx, state, palette, false);
    expect(calls.filter((c) => c.name === 'fillRect' && palette.blocks.includes(c.fillStyle))).toHaveLength(38);
  });

  it('TC-0002-05 発射前だけ発射のヒントを描く', () => {
    const { ctx, calls } = fakeContext();
    render(ctx, createGame(), palette, false);
    const hint = texts(calls).find((c) => c.args[0] === 'タップ / Space で発射');
    expect(hint).toMatchObject({ args: ['タップ / Space で発射', 240, 400], fillStyle: palette.muted });
    expect(hint?.font).toContain('14px');

    const playing = createGame();
    playing.status = 'playing';
    const other = fakeContext();
    render(other.ctx, playing, palette, false);
    expect(texts(other.calls).some((c) => c.args[0] === 'タップ / Space で発射')).toBe(false);
  });

  it('TC-0004-08 HUD の文字（SCORE は左、TIME は右）', () => {
    const state = createGame();
    state.status = 'playing';
    state.broken = 30;
    state.elapsedMs = 12_345;
    const { ctx, calls } = fakeContext();
    render(ctx, state, palette, false);
    const score = texts(calls).find((c) => String(c.args[0]).startsWith('SCORE'));
    const time = texts(calls).find((c) => String(c.args[0]).startsWith('TIME'));
    expect(score).toMatchObject({ args: ['SCORE : 300', 16, 12], textAlign: 'left' });
    expect(time).toMatchObject({ args: ['TIME : 12', 464, 12], textAlign: 'right' });
    expect(score?.font).toMatch(/bold 18px .*monospace/);
  });

  it('TC-0005-08 終了後は盤面を不透明度 0.5 で描く', () => {
    const state = createGame();
    state.status = 'gameOver';
    const { ctx, calls } = fakeContext();
    render(ctx, state, palette, true);
    const board = calls.filter((c) => ['fillRect', 'strokeRect', 'arc', 'roundRect', 'fillText'].includes(c.name));
    expect(board.length).toBeGreaterThan(0);
    for (const c of board) expect(c.globalAlpha).toBe(0.5);

    const normal = fakeContext();
    render(normal.ctx, state, palette, false);
    for (const c of normal.calls) expect(c.globalAlpha).toBe(1);
  });

  it('TC-0005-10 TIME は経過秒の切り捨て', () => {
    const state = createGame();
    state.status = 'playing';
    state.elapsedMs = 41_991.7;
    const { ctx, calls } = fakeContext();
    render(ctx, state, palette, false);
    expect(texts(calls).some((c) => c.args[0] === 'TIME : 41')).toBe(true);
  });

  it('TC-0009-04 一時停止中は幕と PAUSED を描く', () => {
    const state = createGame();
    state.status = 'paused';
    const { ctx, calls } = fakeContext();
    render(ctx, state, palette, false);
    expect(calls.some((c) => c.name === 'fillRect' && c.fillStyle === palette.veil)).toBe(true);
    expect(texts(calls).find((c) => c.args[0] === 'PAUSED')).toMatchObject({ args: ['PAUSED', 240, 320] });
    expect(texts(calls).find((c) => c.args[0] === '再開ボタン / P / Esc で再開')).toMatchObject({ args: ['再開ボタン / P / Esc で再開', 240, 356] });
  });
});
