// アプリのアイコンを public/icons/ に作る（npm run icons）。
// 図柄：暗い地に 5 色のブロック、ボール、パドル（TD-0001 §5）。色は GUI-0001 §3 と同じ値。
// PNG は外部のライブラリを使わず、node:zlib で組み立てる。
import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const OUT = new URL('../public/icons/', import.meta.url);

const BG = '#0B1020';
const BLOCK_COLORS = ['#EF5350', '#FFA726', '#FFD54F', '#66BB6A', '#4FC3F7'];
const PADDLE = '#E6EAF2';
const BALL = '#FFFFFF';

/** 図柄を 0〜1 の座標で表す。scale・offset で縮めて中央に置く（maskable は安全領域に収めるため縮める） */
function shapes(scale = 1) {
  const offset = (1 - scale) / 2;
  const t = (v) => offset + v * scale;
  const s = (v) => v * scale;
  const list = [];
  const cols = 4;
  const left = 0.14;
  const width = 0.72;
  const gap = 0.03;
  const blockW = (width - gap * (cols - 1)) / cols;
  const blockH = 0.06;
  // いちばん下の行は 2 個崩れている
  const broken = new Set(['4-1', '4-2']);
  BLOCK_COLORS.forEach((color, row) => {
    for (let col = 0; col < cols; col++) {
      if (broken.has(`${row}-${col}`)) continue;
      list.push({ type: 'rect', x: t(left + col * (blockW + gap)), y: t(0.16 + row * (blockH + 0.025)), w: s(blockW), h: s(blockH), r: s(0.012), color });
    }
  });
  list.push({ type: 'circle', cx: t(0.5), cy: t(0.64), r: s(0.05), color: BALL });
  list.push({ type: 'rect', x: t(0.34), y: t(0.78), w: s(0.32), h: s(0.045), r: s(0.022), color: PADDLE });
  return list;
}

function inside(shape, x, y) {
  if (shape.type === 'circle') {
    return (x - shape.cx) ** 2 + (y - shape.cy) ** 2 <= shape.r ** 2;
  }
  const { x: rx, y: ry, w, h, r } = shape;
  if (x < rx || x > rx + w || y < ry || y > ry + h) return false;
  // 角丸：角の小さな四角の中では、角の円の内側だけ
  const cx = Math.min(Math.max(x, rx + r), rx + w - r);
  const cy = Math.min(Math.max(y, ry + r), ry + h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/** 1 ピクセルを 4 × 4 に分けて塗り、平均してなめらかにする */
function render(size, scale) {
  const list = shapes(scale).map((sh) => ({ ...sh, rgb: hex(sh.color) }));
  const bg = hex(BG);
  const SS = 4;
  const pixels = Buffer.alloc(size * size * 3);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          let rgb = bg;
          for (const sh of list) if (inside(sh, x, y)) rgb = sh.rgb;
          sum[0] += rgb[0];
          sum[1] += rgb[1];
          sum[2] += rgb[2];
        }
      }
      const i = (py * size + px) * 3;
      for (let c = 0; c < 3; c++) pixels[i + c] = Math.round(sum[c] / (SS * SS));
    }
  }
  return pixels;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** RGB（透過なし）の PNG を作る */
function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 1 色あたり 8 ビット
  header[9] = 2; // RGB
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    // 各行の先頭は filter 0（なし）
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function svg() {
  const n = (v) => +(v * 100).toFixed(3);
  const body = shapes()
    .map((sh) =>
      sh.type === 'circle'
        ? `<circle cx="${n(sh.cx)}" cy="${n(sh.cy)}" r="${n(sh.r)}" fill="${sh.color}"/>`
        : `<rect x="${n(sh.x)}" y="${n(sh.y)}" width="${n(sh.w)}" height="${n(sh.h)}" rx="${n(sh.r)}" fill="${sh.color}"/>`,
    )
    .join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <rect width="100" height="100" fill="${BG}"/>\n  ${body}\n</svg>\n`;
}

mkdirSync(OUT, { recursive: true });
const files = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  // maskable は、端末が円や角丸に切り抜いても欠けないよう、中央の 80% に収める
  ['icon-maskable-512.png', 512, 0.7],
  ['apple-touch-icon.png', 180, 1],
];
for (const [name, size, scale] of files) {
  writeFileSync(new URL(name, OUT), png(size, render(size, scale)));
  console.log(`public/icons/${name}`);
}
writeFileSync(new URL('icon.svg', OUT), svg());
console.log('public/icons/icon.svg');
