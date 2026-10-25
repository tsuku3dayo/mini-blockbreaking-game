// 仕様書 §11 のパラメータと、そこから計算する値（TD-0002 §1）。
// 長さは論理座標の px、速さは px/秒、時間はミリ秒（_SEC だけ秒）

// フィールド
export const FIELD_WIDTH = 480;
export const FIELD_HEIGHT = 640;
/** HUD 帯の高さ。天井の y */
export const HUD_HEIGHT = 48;

// 時間
/** 固定タイムステップ（ミリ秒） */
export const STEP_MS = 1000 / 120;
/** 固定タイムステップ（秒） */
export const STEP_SEC = 1 / 120;
/** 1 フレームで進める時間の上限（ミリ秒） */
export const MAX_FRAME = 100;
/** ループの浮動小数点誤差の許容値（ミリ秒） */
export const EPSILON_MS = 1e-6;

// パドル
export const PADDLE_WIDTH = 80;
export const PADDLE_HEIGHT = 12;
/** パドル上面の y */
export const PADDLE_Y = 600;
/** キーボード操作時のパドルの速さ */
export const PADDLE_SPEED = 420;
export const PADDLE_INITIAL_X = FIELD_WIDTH / 2;
/** パドル中心 x の範囲（端が壁からはみ出さない） */
export const PADDLE_MIN_X = PADDLE_WIDTH / 2;
export const PADDLE_MAX_X = FIELD_WIDTH - PADDLE_WIDTH / 2;

// ボール
export const BALL_RADIUS = 6;
export const BALL_INITIAL_SPEED = 300;
/** 発射前のボールの y（パドル中央の真上に 1 px 離して乗る） */
export const BALL_READY_Y = PADDLE_Y - BALL_RADIUS - 1;
/** 発射角（垂直から右へ、度） */
export const LAUNCH_ANGLE = 20;
export const LAUNCH_ANGLE_RAD = (LAUNCH_ANGLE * Math.PI) / 180;
/** パドル端での最大反射角（垂直から、度） */
export const MAX_BOUNCE_ANGLE = 60;
export const MAX_BOUNCE_ANGLE_RAD = (MAX_BOUNCE_ANGLE * Math.PI) / 180;
/** 速さに対する垂直成分の最小比 */
export const MIN_VY_RATIO = 0.5;

// ブロック
export const BLOCK_COLS = 8;
export const BLOCK_ROWS = 5;
export const BLOCK_COUNT = BLOCK_COLS * BLOCK_ROWS;
export const BLOCK_WIDTH = 52;
export const BLOCK_HEIGHT = 20;
export const BLOCK_GAP = 4;
/** 1 列目の左端 */
export const BLOCK_OFFSET_X = 18;
/** 1 行目の上端 */
export const BLOCK_OFFSET_Y = 88;

// スコア・加速
export const POINTS_PER_BLOCK = 10;
/** 加速する破壊数の刻み */
export const SPEED_STEP_BLOCKS = 10;
/** 1 段階あたりの加速率（初速比） */
export const SPEED_STEP_RATIO = 0.1;
export const MAX_SPEED_LEVEL = 3;
/** 時間ボーナスの基準秒数 */
export const TIME_BONUS_BASE = 180;
/** 1 秒あたりの時間ボーナス */
export const TIME_BONUS_PER_SEC = 10;
/** 合計スコアの上限 */
export const MAX_SCORE = 2200;

// 入力・記録・画面
/** タップとみなす、押してから離すまでの最大移動量（論理 px） */
export const TAP_MAX_MOVE = 10;
/** 結果画面で Enter・Space・タップを無効にする時間（ミリ秒） */
export const RESULT_INPUT_GUARD = 500;
/** 名前の最大文字数（コードポイント） */
export const PLAYER_NAME_MAX = 12;
/** 保存・表示するランキングの件数 */
export const RANKING_LIMIT = 10;
/** 画面全体の最大幅（画面の px） */
export const PAGE_MAX_WIDTH = 480;
/** ゲーム領域の左右の余白（画面の px） */
export const PAGE_GUTTER = 16;
/** 操作空間の高さ（タッチ端末だけ。画面の px） */
export const CONTROL_AREA_HEIGHT = 96;
/** タップできる部品の最小の大きさ（画面の px） */
export const MIN_TAP_TARGET = 44;
/** 表示の最小倍率 */
export const DISPLAY_MIN_SCALE = 0.6;
/** 保存データ・バックアップの形の版（TD-0004 §1。形を変えたら上げて移行を足す） */
export const SCHEMA_VERSION = 1;
/** 効果音の初期設定 */
export const SOUND_DEFAULT = true;
