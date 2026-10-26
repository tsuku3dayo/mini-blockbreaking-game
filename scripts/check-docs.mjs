// 成果物（doc/）の出力 → 入力の整合性を確かめる（npm run check:docs）。
// 決まりは doc/InputOutput_Text.txt の「整合性チェックの自動化」。エラーがあれば終了コード 1
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOC = join(ROOT, 'doc');

/** 種類 → ファイル名の種類名・フォルダ・承認があるか（CLAUDE.md の表） */
const KINDS = {
  PB: { name: 'project-brief', folder: '00_brief', approval: true },
  SA: { name: 'system-architecture', folder: '01_architecture', approval: true },
  TS: { name: 'technology-stack', folder: '01_architecture', approval: true },
  ADR: { name: 'architecture-decision', folder: '01_architecture', approval: true },
  EP: { name: 'epic', folder: '02_requirements', approval: true },
  US: { name: 'user-story', folder: '02_requirements', approval: true },
  GUI: { name: 'gui-design', folder: '03_gui', approval: true },
  TD: { name: 'technical-design', folder: '04_design', approval: false },
  TST: { name: 'test-strategy', folder: '05_test', approval: false },
  TC: { name: 'test-case', folder: '05_test', approval: false },
  WS: { name: 'workstream', folder: '06_plan', approval: false },
  TASK: { name: 'implementation-task', folder: '06_plan', approval: false },
  AC: { name: 'attested-computation', folder: '07_attested', approval: true },
};
const REQUIRED_KEYS = ['id', 'type', 'title', 'status', 'version', 'updated', 'sources', 'verified'];
const ID_PATTERN = /MBRK-([A-Z]+)-(\d{4})/g;
/** 「MBRK-GUI-0003（v1.2）」「MBRK-GUI-0003 (v1.2)」 */
const SOURCE_VERSION = /(MBRK-[A-Z]+-\d{4})\s*[（(]v(\d+(?:\.\d+)*)[）)]/;
/** 「TC-0007-02」「TC-0007-02・03」「TC-0012-01〜03」 */
const CHECK_ID = /TC-(\d{4})-(\d{2})((?:[・〜~]\d{2})*)/g;

const errors = [];
const warnings = [];
/** sources に版を書いていないもの。数が多いので、--verbose のときだけ 1 件ずつ出す */
const unversioned = [];
const verbose = process.argv.includes('--verbose');
const rel = (path) => relative(ROOT, path).split(sep).join('/');

function listFiles(dir, test) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && test(d.name))
    .map((d) => join(d.parentPath, d.name));
}

/** 先頭の --- 〜 --- を読む。sources は「  - 」の行の配列 */
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!m) return null;
  const fm = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) {
      fm[listKey].push(item[1].trim());
      continue;
    }
    const kv = /^([A-Za-z]+):\s*(.*?)\s*(?:#.*)?$/.exec(line);
    if (!kv) continue;
    listKey = kv[2] === '' ? kv[1] : null;
    fm[kv[1]] = kv[2] === '' ? [] : kv[2];
  }
  return { fm, body: text.slice(m[0].length) };
}

/** 版の比較（1.10 > 1.9） */
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** 確認 ID の書き方を、1 つずつの ID に広げる */
function expandCheckIds(text) {
  const ids = new Set();
  for (const m of text.matchAll(CHECK_ID)) {
    const [, tc, first, rest] = m;
    ids.add(`TC-${tc}-${first}`);
    let prev = Number(first);
    for (const part of rest.matchAll(/([・〜~])(\d{2})/g)) {
      const n = Number(part[2]);
      if (part[1] === '・') ids.add(`TC-${tc}-${part[2]}`);
      else for (let i = prev + 1; i <= n; i++) ids.add(`TC-${tc}-${String(i).padStart(2, '0')}`);
      prev = n;
    }
  }
  return ids;
}

// 1. 成果物を読む
const docs = new Map();
for (const path of listFiles(DOC, (name) => /^MBRK-.*\.md$/.test(name))) {
  const file = rel(path);
  const parsed = parseFrontmatter(readFileSync(path, 'utf8'));
  if (!parsed) {
    errors.push(`${file}: frontmatter がない`);
    continue;
  }
  const { fm, body } = parsed;
  for (const key of REQUIRED_KEYS) if (!(key in fm)) errors.push(`${file}: frontmatter に ${key} がない`);
  const idMatch = /^MBRK-([A-Z]+)-(\d{4})$/.exec(fm.id ?? '');
  if (!idMatch) {
    errors.push(`${file}: id「${fm.id}」が MBRK-<種類>-<4 桁> の形でない`);
    continue;
  }
  const kind = KINDS[idMatch[1]];
  if (!kind) {
    errors.push(`${file}: 種類「${idMatch[1]}」が決まりにない`);
    continue;
  }
  const expected = `doc/${kind.folder}/${fm.id}-${kind.name}-ja.md`;
  if (file !== expected) errors.push(`${file}: ファイル名・フォルダは ${expected} のはず`);
  if (docs.has(fm.id)) errors.push(`${file}: id ${fm.id} が ${docs.get(fm.id).file} と重複している`);
  docs.set(fm.id, { file, fm, body, kind: idMatch[1] });
}

const specText = readFileSync(join(DOC, 'specification.md'), 'utf8');
const specVersion = /^- 版：(\d+(?:\.\d+)*)/m.exec(specText)?.[1];
if (!specVersion) errors.push('doc/specification.md: 版（「- 版：」の行）が読めない');

// 2. 成果物ごとの確認
for (const [id, doc] of docs) {
  const { file, fm, body } = doc;
  const sources = Array.isArray(fm.sources) ? fm.sources : [];
  const stable = fm.status === 'stable';

  if (!['draft', 'review', 'stable'].includes(fm.status)) errors.push(`${file}: status「${fm.status}」は draft・review・stable のどれでもない`);
  if (stable && KINDS[doc.kind].approval && (fm.verified ?? 'null') === 'null') errors.push(`${file}: 承認のある種類で stable なのに verified が null`);

  // 参照している ID が実在するか（本文と sources）
  const referenced = new Set([...`${sources.join('\n')}\n${body}`.matchAll(ID_PATTERN)].map((m) => m[0]));
  for (const ref of referenced) if (ref !== id && !docs.has(ref)) errors.push(`${file}: ${ref} は存在しない`);

  // sources の版と status
  const cited = new Map();
  for (const line of sources) {
    const ids = [...line.matchAll(ID_PATTERN)].map((m) => m[0]);
    const version = SOURCE_VERSION.exec(line);
    for (const ref of ids) {
      const v = version && version[1] === ref ? version[2] : null;
      const prev = cited.get(ref);
      if (prev === undefined || (v && (!prev || compareVersions(v, prev) > 0))) cited.set(ref, v);
    }
    const spec = /specification\.md\s*\(v(\d+(?:\.\d+)*)\)/.exec(line);
    if (spec && specVersion && compareVersions(spec[1], specVersion) < 0 && !sources.some((s) => s.includes(`specification.md (v${specVersion})`))) {
      cited.set('spec', cited.has('spec') && compareVersions(cited.get('spec'), spec[1]) > 0 ? cited.get('spec') : spec[1]);
    }
  }
  for (const [ref, v] of cited) {
    if (ref === 'spec') {
      warnings.push(`${file}: 仕様書 v${v} を根拠にしている（今は v${specVersion}。引用した章が変わっていないか確かめる）`);
      continue;
    }
    const target = docs.get(ref);
    if (!target) continue;
    if (v === null) unversioned.push(`${file}: ${ref}`);
    else if (v !== target.fm.version) errors.push(`${file}: sources の ${ref}（v${v}）が、今の版 v${target.fm.version} と違う`);
    if (stable && target.fm.status !== 'stable') errors.push(`${file}: stable なのに、sources の ${ref} が ${target.fm.status}`);
  }
}

// 3. 確認 ID とテストのコード・実施記録
const checkIds = new Map();
for (const doc of docs.values()) {
  if (doc.kind !== 'TC') continue;
  for (const line of doc.body.split(/\r?\n/)) {
    const cells = line.split('|').map((c) => c.trim());
    if (!/^TC-\d{4}-\d{2}$/.test(cells[1] ?? '')) continue;
    const type = cells[3] ?? '';
    // 単体・E2E・ビルド検査はテストのコードに、それ以外（手動・目視・読み合わせ）は実施記録に書く
    const manual = !/単体|E2E|ビルド検査/.test(type);
    checkIds.set(cells[1], { file: doc.file, manual });
  }
}

const codeFiles = [join(ROOT, 'tests'), join(ROOT, 'e2e'), join(ROOT, 'scripts')].flatMap((dir) =>
  listFiles(dir, (name) => /\.(ts|mjs|js)$/.test(name) && name !== 'check-docs.mjs'),
);
const inCode = new Map();
for (const path of codeFiles) {
  for (const cid of expandCheckIds(readFileSync(path, 'utf8'))) {
    if (!inCode.has(cid)) inCode.set(cid, rel(path));
  }
}
const inAc = new Set();
for (const doc of docs.values()) if (doc.kind === 'AC') for (const cid of expandCheckIds(doc.body)) inAc.add(cid);

for (const [cid, path] of inCode) if (!checkIds.has(cid)) errors.push(`${path}: 確認 ID ${cid} が test-case にない`);
for (const [cid, { file, manual }] of checkIds) {
  if (manual && !inAc.has(cid)) errors.push(`${file}: 手動の ${cid} が、どの attested-computation にもない`);
  if (!manual && !inCode.has(cid)) errors.push(`${file}: 自動の ${cid} が、テストのコードにない`);
}

// 4. 結果
if (verbose) for (const u of unversioned) console.log(`版なし ${u}`);
for (const w of warnings) console.log(`注意 ${w}`);
for (const e of errors) console.log(`NG   ${e}`);
console.log(`\n成果物 ${docs.size} 件、確認 ID ${checkIds.size} 件を確かめた（エラー ${errors.length} 件、注意 ${warnings.length} 件）`);
if (unversioned.length > 0) console.log(`sources に版を書いていない参照が ${unversioned.length} 件ある（一覧は --verbose）`);
if (errors.length > 0) process.exit(1);
