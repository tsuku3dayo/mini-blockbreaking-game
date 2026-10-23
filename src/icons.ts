// SVG アイコンの形（GUI-0001 §5.3）。viewBox 24 × 24、線だけで描く（線の太さ・色は CSS の .icon）

export type IconName =
  | 'check-circle'
  | 'x-circle'
  | 'pause'
  | 'play'
  | 'sound-on'
  | 'sound-off'
  | 'arrow-left'
  | 'download'
  | 'upload'
  | 'install'
  | 'rotate';

const CIRCLE = 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';
const SPEAKER = 'M4 9v6h4l5 4V5L8 9z';

/** アイコンごとの path の d */
export const ICONS: Record<IconName, string[]> = {
  'check-circle': [CIRCLE, 'm8 12 3 3 5-6'],
  'x-circle': [CIRCLE, 'M9 9l6 6M15 9l-6 6'],
  pause: ['M9 5v14M15 5v14'],
  play: ['M7 5l12 7-12 7z'],
  'sound-on': [SPEAKER, 'M16 9a4 4 0 0 1 0 6', 'M18.5 6.5a8 8 0 0 1 0 11'],
  'sound-off': [SPEAKER, 'M17 9l5 6M22 9l-5 6'],
  'arrow-left': ['M19 12H5M11 6l-6 6 6 6'],
  download: ['M12 4v11M7 10l5 5 5-5M5 20h14'],
  upload: ['M12 15V4M7 9l5-5 5 5M5 20h14'],
  install: ['M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M12 7v8M8.5 11.5 12 15l3.5-3.5M10 19h4'],
  rotate: ['M21 12a9 9 0 1 1-3-6.7L21 8', 'M21 3v5h-5'],
};
