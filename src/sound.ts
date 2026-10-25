import { SOUND_DEFAULT } from './config';
import type { GameEvent } from './game';
import { planSounds, type SoundName } from './sound-plan';
import { load } from './storage';

// Web Audio の合成と再生（TD-0005 §2・§3、ADR-0005）。音が鳴らなくてもゲームは続ける（例外を外に出さない）

export interface Sound {
  /** オン / オフ（保存した設定。切り替えのボタンは TASK-0018） */
  readonly enabled: boolean;
  /** 最初の操作で呼ぶ（AudioContext の作成・resume） */
  unlock(): void;
  /** 1 フレームの出来事から鳴らす */
  playFrame(events: GameEvent[]): void;
  play(name: SoundName, row?: number): void;
  /** 鳴っている音を全部止める（一時停止・画面の非表示・画面を離れるとき） */
  stopAll(): void;
}

/** 1 音。to があれば、長さの間に高さを to まで上げる */
interface Note {
  freq: number;
  to?: number;
  ms: number;
}

interface Voice {
  wave: OscillatorType;
  notes: Note[];
  /** 音量の倍率 */
  volume?: number;
}

/** ブロックの音の高さ。行 0（最上段）が最も高い */
const BLOCK_FREQS = [1047, 880, 784, 659, 523];

/** 音の作り（TD-0005 §2。手動テストで聞いて調整してよい） */
const VOICES: Record<Exclude<SoundName, 'block'>, Voice> = {
  launch: { wave: 'square', notes: [{ freq: 440, to: 880, ms: 80 }] },
  paddle: { wave: 'triangle', notes: [{ freq: 330, ms: 70 }] },
  wall: { wave: 'square', notes: [{ freq: 1200, ms: 25 }], volume: 0.4 },
  speedUp: { wave: 'square', notes: [{ freq: 660, ms: 60 }, { freq: 990, ms: 60 }] },
  clear: {
    wave: 'triangle',
    notes: [
      { freq: 523, ms: 120 },
      { freq: 659, ms: 120 },
      { freq: 784, ms: 120 },
      { freq: 1047, ms: 300 },
    ],
  },
  gameOver: {
    wave: 'sawtooth',
    notes: [
      { freq: 392, ms: 200 },
      { freq: 330, ms: 200 },
      { freq: 262, ms: 400 },
    ],
  },
  register: {
    wave: 'triangle',
    notes: [
      { freq: 784, ms: 80 },
      { freq: 1047, ms: 80 },
    ],
  },
};

function voiceOf(name: SoundName, row = 0): Voice {
  if (name === 'block') return { wave: 'square', notes: [{ freq: BLOCK_FREQS[row] ?? BLOCK_FREQS[0], ms: 60 }] };
  return VOICES[name];
}

/** 全体の音量 */
const MASTER_GAIN = 0.25;
/** 立ち上がりの時間（秒） */
const ATTACK = 0.005;
/** 指数の減衰で 0 にはできないので、ここまで下げる */
const SILENT = 0.0001;

/**
 * 自動再生の制限を解くための操作。スマホのタッチでは pointerdown が「操作」と認められないブラウザがあるので、
 * 指を離したとき・クリックでも試し、鳴らせる状態になるまで付けておく
 */
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;

export function createSound(): Sound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  /** 作成に失敗したら、以後は作らない */
  let failed = false;
  const playing = new Set<OscillatorNode>();
  const enabled = load<unknown>('sound', SOUND_DEFAULT) !== false;

  function unlock(): void {
    if (failed || document.hidden) return;
    try {
      if (!ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) throw new Error('AudioContext がない');
        ctx = new Ctor();
        master = ctx.createGain();
        master.gain.value = MASTER_GAIN;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'running') {
        removeUnlockListeners();
      } else {
        ctx.resume().then(
          () => ctx?.state === 'running' && removeUnlockListeners(),
          () => undefined,
        );
      }
    } catch {
      failed = true;
      ctx = null;
      master = null;
      removeUnlockListeners();
    }
  }

  function onUnlockEvent(): void {
    unlock();
  }

  function removeUnlockListeners(): void {
    for (const type of UNLOCK_EVENTS) document.removeEventListener(type, onUnlockEvent, { capture: true });
  }

  /** 1 音を鳴らす。音量は立ち上がり 5 ms、指数で減衰 */
  function scheduleNote(audio: AudioContext, out: GainNode, wave: OscillatorType, note: Note, start: number, volume: number): void {
    const end = start + note.ms / 1000;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(note.freq, start);
    if (note.to !== undefined) osc.frequency.linearRampToValueAtTime(note.to, end);
    gain.gain.setValueAtTime(SILENT, start);
    gain.gain.linearRampToValueAtTime(volume, start + ATTACK);
    gain.gain.exponentialRampToValueAtTime(SILENT, end);
    osc.connect(gain).connect(out);
    osc.addEventListener('ended', () => {
      playing.delete(osc);
      gain.disconnect();
    });
    playing.add(osc);
    osc.start(start);
    osc.stop(end + 0.01);
  }

  function play(name: SoundName, row?: number): void {
    const muted = !enabled || !ctx || !master || ctx.state !== 'running';
    // E2E で鳴らす判断を確かめるため、鳴らさないときも知らせる
    window.dispatchEvent(new CustomEvent('app:sound', { detail: { name, muted } }));
    if (muted || !ctx || !master) return;
    try {
      const voice = voiceOf(name, row);
      let t = ctx.currentTime;
      for (const note of voice.notes) {
        scheduleNote(ctx, master, voice.wave, note, t, voice.volume ?? 1);
        t += note.ms / 1000;
      }
    } catch {
      // 鳴らせなくても続ける
    }
  }

  function playFrame(events: GameEvent[]): void {
    if (events.length === 0) return;
    for (const s of planSounds(events)) play(s.name, s.row);
  }

  function stopAll(): void {
    for (const osc of playing) {
      try {
        osc.stop();
      } catch {
        // もう止まっている
      }
    }
    playing.clear();
  }

  // 画面が隠れたら止めて休ませ、表示に戻ったら再開する
  document.addEventListener('visibilitychange', () => {
    try {
      if (document.hidden) {
        stopAll();
        void ctx?.suspend().catch(() => undefined);
      } else {
        void ctx?.resume().catch(() => undefined);
      }
    } catch {
      // 続ける
    }
  });

  for (const type of UNLOCK_EVENTS) document.addEventListener(type, onUnlockEvent, { capture: true });

  return {
    get enabled() {
      return enabled;
    },
    unlock,
    playFrame,
    play,
    stopAll,
  };
}
