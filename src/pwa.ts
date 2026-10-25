import { registerSW } from 'virtual:pwa-register';

// Service Worker の登録と「更新」の帯（GUI-0006 §3、US-0019）。
// 新しい版は待機させ、利用者が「更新」を押したときだけ切り替える（registerType: 'prompt'）

let needRefresh = false;
// 帯を出してよい画面（タイトル・ランキング）にいるか。プレイ画面では出さない
let bannerAllowed = true;

function render(): void {
  const banner = document.getElementById('update-banner');
  if (banner) banner.hidden = !(needRefresh && bannerAllowed);
}

/** 新しい版の準備ができたことにする（Service Worker から。?debug=1 のテスト用の入口からも呼ぶ） */
export function onNeedRefresh(): void {
  needRefresh = true;
  render();
}

/** 画面が切り替わったときに呼ぶ。プレイ画面では帯を隠す */
export function setUpdateBannerAllowed(allowed: boolean): void {
  bannerAllowed = allowed;
  render();
}

export function setupUpdateBanner(): void {
  // 開発用サーバー（npm run dev）では Service Worker を使わない
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const updateSW = registerSW({ onNeedRefresh });
  document.getElementById('update-button')?.addEventListener('click', () => {
    void updateSW(true);
  });
}
