import { blockRect } from './collision';
import { BALL_RADIUS, BLOCK_COLS, BLOCK_COUNT, FIELD_HEIGHT, FIELD_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_Y } from './config';
import { formatNumber } from './format';
import { blockScore, type GameState } from './game';

// Canvas の描画（TD-0003 §4、仕様書 §2.2、GUI-0003 §2.2）。座標はすべて論理座標（480 × 640）

export interface Palette {
  field: string;
  frame: string;
  text: string;
  muted: string;
  paddle: string;
  ball: string;
  veil: string;
  /** 行ごとの色（上から） */
  blocks: string[];
}

const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const BODY = "system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif";

/** 色を CSS 変数から読む（色の定義を style.css の 1 か所にするため。起動時に 1 回） */
export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const get = (name: string) => style.getPropertyValue(name).trim();
  return {
    field: get('--field'),
    frame: get('--field-frame'),
    text: get('--text'),
    muted: get('--muted'),
    paddle: get('--text'),
    ball: get('--ball'),
    veil: get('--pause-veil'),
    blocks: [1, 2, 3, 4, 5].map((i) => get(`--block-${i}`)),
  };
}

/** 盤面を描く。dimmed（終了後）は盤面全体を不透明度 0.5 で描く */
export function render(ctx: CanvasRenderingContext2D, state: GameState, palette: Palette, dimmed: boolean): void {
  const scale = ctx.canvas.width / FIELD_WIDTH;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 1;
  // 前の描画を消す（暗くしたときに、前の盤面が透けて見えないように）
  ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
  if (dimmed) ctx.globalAlpha = 0.5;

  // 1. 背景
  ctx.fillStyle = palette.field;
  ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

  // 2. 外枠（線幅 2。内側に収める）
  ctx.strokeStyle = palette.frame;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, FIELD_WIDTH - 2, FIELD_HEIGHT - 2);

  // 3. 生きているブロック
  for (let id = 0; id < BLOCK_COUNT; id++) {
    if (!state.alive[id]) continue;
    const r = blockRect(id);
    ctx.fillStyle = palette.blocks[Math.floor(id / BLOCK_COLS)];
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }

  // 4. パドル（角丸 4）
  ctx.fillStyle = palette.paddle;
  ctx.beginPath();
  ctx.roundRect(state.paddleX - PADDLE_WIDTH / 2, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
  ctx.fill();

  // 5. ボール
  ctx.fillStyle = palette.ball;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // 6. HUD（等幅太字 18、左右の余白 16、上端 12）
  ctx.fillStyle = palette.text;
  ctx.font = `bold 18px ${MONO}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE : ${formatNumber(blockScore(state))}`, 16, 12);
  ctx.textAlign = 'right';
  ctx.fillText(`TIME : ${Math.floor(state.elapsedMs / 1000)}`, FIELD_WIDTH - 16, 12);

  // 7. オーバーレイ
  const cx = FIELD_WIDTH / 2;
  const cy = FIELD_HEIGHT / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (state.status === 'ready') {
    ctx.fillStyle = palette.muted;
    ctx.font = `14px ${BODY}`;
    ctx.fillText('タップ / Space で発射', cx, cy + 80);
  } else if (state.status === 'paused') {
    ctx.fillStyle = palette.veil;
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    ctx.fillStyle = palette.text;
    ctx.font = `bold 28px ${BODY}`;
    ctx.fillText('PAUSED', cx, cy);
    ctx.font = `14px ${BODY}`;
    ctx.fillText('再開ボタン / P / Esc で再開', cx, cy + 36);
  }

  ctx.globalAlpha = 1;
}
