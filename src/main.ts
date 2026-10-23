import './style.css';
import { installDebug, isDebugMode } from './debug';
import { setupInstall } from './install';
import { createPlayScreen } from './play';
import { setUpdateBannerAllowed, setupUpdateBanner } from './pwa';
import { renderIcons } from './ui';

// 起動と画面の切替え（TD-0001 §3・§8）

type ScreenName = 'title' | 'play' | 'ranking';

const SCREENS: Record<ScreenName, { section: string; title: string; focus: string | null }> = {
  title: { section: 'screen-title', title: 'ブロック崩し - タイトル', focus: 'title-start' },
  // プレイ画面のフォーカスは、play.start() がゲーム領域に移す
  play: { section: 'screen-play', title: 'ブロック崩し - プレイ', focus: null },
  ranking: { section: 'screen-ranking', title: 'ブロック崩し - ランキング', focus: 'ranking-heading' },
};

const play = createPlayScreen();
let current: ScreenName | null = null;

/** ハッシュから画面を決める。不明なものは null */
function parseHash(hash: string): ScreenName | null {
  const name = hash.replace(/^#\//, '');
  return name === 'title' || name === 'play' || name === 'ranking' ? name : null;
}

/** 画面を切り替える（TD-0001 §3.2） */
function showScreen(name: ScreenName): void {
  // 1. 今の画面の後始末
  if (current === 'play') play.stop();
  current = name;

  // 2. 対象の画面だけ出す
  const screen = SCREENS[name];
  for (const [key, s] of Object.entries(SCREENS)) {
    (document.getElementById(s.section) as HTMLElement).hidden = key !== name;
  }
  document.body.dataset.screen = name;
  document.title = screen.title;

  // 3. ページの先頭へ
  window.scrollTo(0, 0);

  // 4. 画面の初期化
  if (name === 'play') play.start();

  // 5. 初期フォーカス
  if (screen.focus) document.getElementById(screen.focus)?.focus();

  // 6. 更新の帯は、タイトル・ランキングのときだけ
  setUpdateBannerAllowed(name !== 'play');
}

/** ボタンから画面を移る（履歴に積む。hashchange は起きない） */
function navigate(name: ScreenName): void {
  history.pushState(null, '', `#/${name}`);
  showScreen(name);
}

/** 戻るボタン・手入力でハッシュが変わったとき。#/play は新しいゲーム、不明なものはタイトル（仕様書 §8） */
function onHashChange(): void {
  const name = parseHash(location.hash);
  if (name === null) {
    history.replaceState(null, '', '#/title');
    showScreen('title');
  } else {
    showScreen(name);
  }
}

/** 部品にフォーカスがあるときの Enter は、その部品の動作だけにする（仕様書 §4.1-9） */
function isInteractive(element: Element | null): boolean {
  return !!element && element.matches('button, input, select, textarea, a[href], summary, [contenteditable="true"]');
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.repeat || e.isComposing) return;
  if (document.querySelector('dialog[open]')) return;
  if (current === 'title' && (e.code === 'Enter' || e.code === 'NumpadEnter') && !isInteractive(document.activeElement)) {
    e.preventDefault();
    navigate('play');
  } else if (current === 'ranking' && e.code === 'Escape') {
    e.preventDefault();
    navigate('title');
  }
}

// 起動の手順（TD-0001 §8）
renderIcons();
const version = document.getElementById('version');
if (version) version.textContent = __APP_VERSION__;

document.getElementById('title-start')?.addEventListener('click', () => navigate('play'));
document.getElementById('title-ranking')?.addEventListener('click', () => navigate('ranking'));
document.getElementById('ranking-back')?.addEventListener('click', () => navigate('title'));
document.getElementById('ranking-empty-title')?.addEventListener('click', () => navigate('title'));
document.addEventListener('keydown', onKeyDown);
window.addEventListener('hashchange', onHashChange);
setupUpdateBanner();
setupInstall();

if (isDebugMode(location.search)) installDebug(play);

// 最初の画面：#/ranking ならランキング、それ以外（#/play・空・不明）はタイトル。
// 遊んでいる途中のゲームは保存しないため、#/play でもタイトルから始める（仕様書 §7.2）
const first: ScreenName = parseHash(location.hash) === 'ranking' ? 'ranking' : 'title';
history.replaceState(null, '', `#/${first}`);
showScreen(first);

// boot.js に起動できたことを知らせる
window.__appStarted = true;
