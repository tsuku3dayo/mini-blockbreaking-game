// 起動の見張りと復旧（GUI-0006 §4、US-0020）。
// main.ts が読み込めなくても動くよう、ビルドを通さない普通のスクリプトにしている。
// 読み込みが終わってから一定時間たっても window.__appStarted が true にならなければ、起動の失敗とみなし、
// このアプリの Service Worker とキャッシュだけを消して読み込み直す。保存データ（localStorage）は消さない。
(function () {
  'use strict';

  var meta = document.querySelector('meta[name="app-id"]');
  var appId = meta ? meta.getAttribute('content') : 'app';
  var REPAIR_KEY = appId + ':boot-repair-at';
  // 2 回目の失敗がこの時間内なら、自動で直さず「なおす」ボタンを出す
  var RETRY_WINDOW_MS = 2 * 60 * 1000;
  // E2E では window.__bootWaitMs で短くする
  var waitMs = typeof window.__bootWaitMs === 'number' ? window.__bootWaitMs : 8000;

  // このアプリの範囲（例：https://tsuku3dayo.github.io/mini-blockbreaking-game/）。
  // 同じサイトに載るほかのアプリの Service Worker・キャッシュは消さない（ADR-0007）
  var scope = new URL('./', location.href).href;

  function readRepairAt() {
    try {
      return Number(sessionStorage.getItem(REPAIR_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function writeRepairAt(time) {
    try {
      sessionStorage.setItem(REPAIR_KEY, String(time));
    } catch {
      // 保存できなくても、復旧は続ける
    }
  }

  function clearAppCache() {
    var tasks = [];
    if ('serviceWorker' in navigator) {
      tasks.push(
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          return Promise.all(
            registrations
              .filter(function (r) { return r.scope.indexOf(scope) === 0; })
              .map(function (r) { return r.unregister(); })
          );
        })
      );
    }
    if ('caches' in window) {
      // Workbox のキャッシュの名前には、Service Worker の範囲（scope）が入る
      tasks.push(
        caches.keys().then(function (keys) {
          return Promise.all(
            keys
              .filter(function (key) { return key.indexOf(scope) !== -1; })
              .map(function (key) { return caches.delete(key); })
          );
        })
      );
    }
    return Promise.all(tasks);
  }

  function repair() {
    writeRepairAt(Date.now());
    var reload = function () { location.reload(); };
    clearAppCache().then(reload, reload);
  }

  // CSS が読めない場合に備えて、色はここに直接書く（GUI-0001 §3 の --bg / --text / --primary と同じ値）
  function showRepairButton() {
    var box = document.getElementById('boot-error');
    if (!box) return;
    box.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;padding:16px 16px max(16px,env(safe-area-inset-bottom));' +
      'background:#0B1020;color:#E6EAF2;border-top:1px solid #3A4468;font:16px/1.6 system-ui,sans-serif;z-index:100;';
    var button = document.getElementById('boot-repair');
    if (button) {
      button.style.cssText =
        'min-height:48px;padding:8px 24px;margin:8px 0;border:none;border-radius:10px;' +
        'background:#4FC3F7;color:#0B1020;font:inherit;font-weight:bold;cursor:pointer;';
      button.onclick = repair;
    }
    box.hidden = false;
  }

  function check() {
    if (window.__appStarted) return;
    if (Date.now() - readRepairAt() < RETRY_WINDOW_MS) {
      showRepairButton();
    } else {
      repair();
    }
  }

  window.addEventListener('load', function () {
    setTimeout(check, waitMs);
  });
})();
