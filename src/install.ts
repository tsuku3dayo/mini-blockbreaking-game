// インストール方法のダイアログ（GUI-0006 §1、US-0017）

/** Chrome 系のブラウザが出す、インストールを促すイベント（標準の型にないので最小限を書く） */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

export type Platform = 'ios' | 'android' | 'pc';

/** 端末の種類を UA から決める。iPad の Safari はパソコンの UA を名乗るので、タッチの有無で見分ける */
export function detectPlatform(userAgent: string, maxTouchPoints: number): Platform {
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(userAgent)) return 'android';
  return 'pc';
}

/** インストール済みのアプリとして開いているか */
function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function setupInstall(): void {
  const openButton = document.getElementById('install-open');
  const dialog = document.getElementById('install-dialog') as HTMLDialogElement | null;
  const installNow = document.getElementById('install-now');
  if (!openButton || !dialog || !installNow) return;

  // インストール済みのアプリでは入口を出さない
  if (isStandalone()) {
    openButton.hidden = true;
    return;
  }

  let deferred: BeforeInstallPromptEvent | null = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    installNow.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installNow.hidden = true;
    openButton.hidden = true;
  });

  installNow.addEventListener('click', () => {
    if (!deferred) return;
    void deferred.prompt();
    deferred = null;
    installNow.hidden = true;
  });

  // 今の端末の手順を最初から開いておく
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
  for (const details of dialog.querySelectorAll<HTMLDetailsElement>('details[data-platform]')) {
    details.open = details.dataset.platform === platform;
  }

  openButton.addEventListener('click', () => {
    dialog.showModal();
    // 開いたら最初のボタンにフォーカス（閉じたら、ブラウザが開いたボタンにフォーカスを戻す）
    dialog.querySelector<HTMLElement>('button:not([hidden]), summary')?.focus();
  });
  for (const close of dialog.querySelectorAll('[data-close]')) {
    close.addEventListener('click', () => dialog.close());
  }
}
