// 読み上げの通知領域（TD-0003 §6、GUI-0001 §6）。画面の外に置いた #announcer（aria-live="polite"）に文を出す

export interface Announce {
  say(text: string): void;
}

export function createAnnounce(): Announce {
  const region = document.getElementById('announcer');
  let frameId: number | null = null;
  return {
    say(text) {
      if (!region) return;
      // 同じ文が続いても読み上げられるよう、いったん空にしてから次のフレームで入れる。
      // 同じフレームに何度も呼ばれたら、最後の文だけを出す
      region.textContent = '';
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        frameId = null;
        region.textContent = text;
      });
    },
  };
}
