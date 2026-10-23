import './style.css';
import { installDebug, isDebugMode } from './debug';
import { setupInstall } from './install';
import { createPlayScreen } from './play';
import { setUpdateBannerAllowed, setupUpdateBanner } from './pwa';

// 起動の手順（TD-0001 §8）。画面の切替え・タイトル画面からの流れは TASK-0009 で足す

/**
 * この段階（WS-0002）では、開いたらすぐプレイ画面にする（TASK-0006）。
 * タイトル画面から始める流れは、段階 2 の TASK-0009 で直す
 */
function showPlay(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.screen')) {
    section.hidden = section.id !== 'screen-play';
  }
  document.body.dataset.screen = 'play';
  document.title = 'ブロック崩し - プレイ';
  setUpdateBannerAllowed(false);
}

const version = document.getElementById('version');
if (version) version.textContent = __APP_VERSION__;
setupUpdateBanner();
setupInstall();

const play = createPlayScreen();
if (isDebugMode(location.search)) installDebug(play);

showPlay();
play.start();

// boot.js に起動できたことを知らせる
window.__appStarted = true;
