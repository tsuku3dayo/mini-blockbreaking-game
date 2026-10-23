import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['src/**/*.ts'], languageOptions: { globals: globals.browser } },
  {
    // 利用者が入力した文字を innerHTML に入れると、意図しないタグが動く。textContent を使う。
    // HTML の固定の組み立てが必要なときは、その行に eslint-disable を付けて理由を書く。
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "AssignmentExpression[left.property.name='innerHTML']", message: 'innerHTML への代入は使わず、textContent か DOM の組み立てを使ってください' },
        { selector: "AssignmentExpression[left.property.name='outerHTML']", message: 'outerHTML への代入は使わないでください' },
      ],
    },
  },
  {
    // ロジック層は DOM・時刻・乱数に触れない（TD-0001 §2、ADR-0004）。時刻は引数で受け取る
    files: [
      'src/config.ts',
      'src/game.ts',
      'src/collision.ts',
      'src/score.ts',
      'src/loop.ts',
      'src/layout.ts',
      'src/ranking.ts',
      'src/backup.ts',
      'src/sound-plan.ts',
      'src/format.ts',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'performance', 'requestAnimationFrame', 'setTimeout', 'setInterval', 'Date'].map((name) => ({
          name,
          message: 'ロジック層では DOM・時刻を使わないでください（時刻は引数で受け取る）',
        })),
      ],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'ロジック層では乱数を使わないでください' }],
      'no-restricted-imports': ['error', { patterns: [{ group: ['./main', './play', './input', './render', './result-panel', './ranking-view', './sound', './announce', './ui', './icons', './debug', './storage', './records', './pwa', './install'], message: 'ロジック層から画面層・基盤を import しないでください' }] }],
    },
  },
  // public/ のスクリプトは、ビルドを通さずにそのまま配信される（普通の <script>）
  { files: ['public/**/*.js'], languageOptions: { sourceType: 'script', globals: globals.browser } },
  { files: ['tests/**/*.ts', 'scripts/**/*.mjs', 'vite.config.ts', 'playwright.config.ts', '*.js'], languageOptions: { globals: globals.node } },
  // page.evaluate() のコールバックはブラウザで動くので、両方の globals を許可する
  { files: ['e2e/**/*.ts'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
);
