// ビルドした dist/ が PWA として成り立つかを確かめる（npm run check:dist）。
// TC-0017-04（manifest とアイコン）、TC-0019-02（バージョン表示）、TC-0020-05（起動の見張り）
import { existsSync, readFileSync } from 'node:fs';

const APP_ID = 'mini-blockbreaking-game';
const dist = new URL('../dist/', import.meta.url);
const read = (path) => readFileSync(new URL(path, dist), 'utf8');
const exists = (path) => existsSync(new URL(path, dist));

const failures = [];
function check(id, label, ok) {
  console.log(`${ok ? 'ok  ' : 'NG  '} ${id} ${label}`);
  if (!ok) failures.push(`${id} ${label}`);
}

if (!exists('index.html')) {
  console.error('dist/index.html がありません。先に npm run build を実行してください');
  process.exit(1);
}
const html = read('index.html');

// TC-0017-04 manifest とアイコン
const manifestOk = exists('manifest.webmanifest');
check('TC-0017-04', 'manifest.webmanifest がある', manifestOk);
check('TC-0017-04', 'index.html から manifest を読み込む', /<link[^>]+rel="manifest"/.test(html));
if (manifestOk) {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  check('TC-0017-04', 'manifest の name・display・start_url', manifest.name === 'ブロック崩しミニ' && manifest.display === 'standalone' && !!manifest.start_url);
  check('TC-0017-04', 'manifest の orientation が portrait', manifest.orientation === 'portrait');
  const icons = manifest.icons ?? [];
  const has = (size, purpose) => icons.some((icon) => icon.sizes === size && (icon.purpose ?? 'any').split(' ').includes(purpose) && exists(icon.src));
  check('TC-0017-04', 'アイコン 192 × 192', has('192x192', 'any'));
  check('TC-0017-04', 'アイコン 512 × 512', has('512x512', 'any'));
  check('TC-0017-04', 'maskable のアイコン 512 × 512', has('512x512', 'maskable'));
}
const touchIcon = html.match(/<link[^>]+rel="apple-touch-icon"[^>]+href="([^"]+)"/);
check('TC-0017-04', 'apple-touch-icon がある', !!touchIcon && exists(touchIcon[1]));
check('TC-0017-04', 'Service Worker（sw.js）がある', exists('sw.js'));
check('TC-0017-04', 'インストール方法の入口（#install-open）がある', html.includes('id="install-open"'));

// TC-0019-02 バージョン表示
check('TC-0019-02', 'バージョンの表示（#version）がある', html.includes('id="version"'));

// TC-0020-05 起動の見張り
check('TC-0020-05', 'boot.js がある', exists('boot.js'));
check('TC-0020-05', 'index.html が boot.js を読み込む', /<script[^>]+src="\.?\/?boot\.js"/.test(html));
check('TC-0020-05', `app-id が ${APP_ID}`, html.includes(`<meta name="app-id" content="${APP_ID}"`));
check('TC-0020-05', 'boot.js が __appStarted を見ている', exists('boot.js') && read('boot.js').includes('__appStarted'));
check('TC-0020-05', '復旧の画面（#boot-error）がある', html.includes('id="boot-error"'));

if (failures.length > 0) {
  console.error(`\n${failures.length} 件の確認が通りませんでした`);
  process.exit(1);
}
console.log('\nすべての確認が通りました');
