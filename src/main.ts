import './style.css';
import { setupInstall } from './install';
import { setupUpdateBanner } from './pwa';

// 起動の手順（TD-0001 §8）。画面の切替え・各画面の配線は、以後のタスクで足す

/** 最初の画面としてタイトルを出す（TD-0001 §3.2 の骨組み） */
function showTitle(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.screen')) {
    section.hidden = section.id !== 'screen-title';
  }
  document.body.dataset.screen = 'title';
  document.title = 'ブロック崩し - タイトル';
  document.getElementById('title-start')?.focus();
}

const version = document.getElementById('version');
if (version) version.textContent = __APP_VERSION__;
setupUpdateBanner();
setupInstall();

showTitle();

// boot.js に起動できたことを知らせる
window.__appStarted = true;
