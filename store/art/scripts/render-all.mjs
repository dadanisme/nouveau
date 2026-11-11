// Renders the store stills for each variant (couple, family) in ID and EN, asserts the layout (text measured in the real browser)
// and the specs, builds one 2x2 contact sheet per variant (review/variant-<v>.png).
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SK = path.join(os.homedir(), '.claude/skills/product-video/scripts');
const browserExecutable = execFileSync('node', [path.join(SK, 'browser-path.mjs')], { encoding: 'utf8' }).trim().split('\n').pop();

const SAFE = {
  header: { x0: 672, x1: 3168, y0: 150, y1: 1496 },
  search: { x0: 450, x1: 2550, y0: 150, y1: 1850 },
};
const SPEC = { header: [3840, 1646], search: [3000, 2000] };
const VARIANTS = (process.env.VARIANTS || 'couple,family').split(',');
const JOBS = [
  { id: 'StoreHeaderId', kind: 'header', lang: 'id', file: 'header.png' },
  { id: 'StoreHeaderEn', kind: 'header', lang: 'en', file: 'header.png' },
  { id: 'StoreSearchId', kind: 'search', lang: 'id', file: 'search-results.png' },
  { id: 'StoreSearchEn', kind: 'search', lang: 'en', file: 'search-results.png' },
];

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const report = { contrast: {}, stills: {}, failures: [] };
const fail = (m) => { report.failures.push(m); console.log('FAIL', m); };
const pass = (m) => console.log('ok  ', m);

const pairs = [['#1C1C1E', '#FFFFFF', 'headline on white', 4.5], ['#1C1C1E', '#F2F2F7', 'headline on grouped gray', 4.5],
  ['#48484A', '#FFFFFF', 'subline on white', 4.5], ['#48484A', '#F2F2F7', 'subline on grouped gray', 4.5]];
for (const [fg, bg, name, min] of pairs) {
  const r = contrast(fg, bg); report.contrast[name] = +r.toFixed(2);
  r >= min ? pass(`contrast ${name} ${r.toFixed(2)}:1 >= ${min}`) : fail(`contrast ${name} ${r.toFixed(2)}`);
}

const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
fs.mkdirSync(path.join(root, 'review'), { recursive: true });

for (const V of VARIANTS) {
  const outs = {};
  const logs = {};
  for (const j of JOBS) {
    const K = `${V}/${j.id}`;
    const comp = await selectComposition({ serveUrl, id: j.id, browserExecutable, inputProps: { kind: j.kind, lang: j.lang, variant: V } });
    const raw = path.join(root, 'review', `raw_${V}_${j.id}.png`);
    await renderStill({
      composition: comp, serveUrl, output: raw, imageFormat: 'png', browserExecutable, inputProps: { kind: j.kind, lang: j.lang, variant: V },
      onBrowserLog: (l) => { if (l.text.startsWith('STORE_LAYOUT ')) logs[K] = JSON.parse(l.text.slice(13)); },
    });
    const dir = path.join(root, 'out/store-art-variants', V, j.lang);
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, j.file);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-vf', 'format=rgb24', '-frames:v', '1', out]); // drop Chrome's alpha channel
    fs.rmSync(raw);
    outs[j.id] = out;

    const L = logs[K];
    const s = { file: out };
    report.stills[K] = s;
    if (!L) { fail(`${K}: no layout log`); continue; }
    const sf = SAFE[j.kind];
    s.fontOk = L.fontOk; L.fontOk ? pass(`${K} SF Pro Display loaded`) : fail(`${K} SF Pro Display not available`);
    s.boxes = L.boxes;
    for (const [name, b] of Object.entries(L.boxes)) {
      const inside = b.x >= sf.x0 && b.x + b.w <= sf.x1 && b.y >= sf.y0 && b.y + b.h <= sf.y1;
      const m = `${K} ${name} [${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.w)}x${Math.round(b.h)}] inside safe x${sf.x0}-${sf.x1} y${sf.y0}-${sf.y1}`;
      inside ? pass(m) : fail(m);
    }
    {
      const { vb, content } = L.artFit;
      const ok = content[0] >= vb[0] && content[1] >= vb[1] && content[0] + content[2] <= vb[0] + vb[2] && content[1] + content[3] <= vb[1] + vb[3];
      const m = `${K} hero art content ${content.map(Math.round)} inside its viewBox ${vb.map(Math.round)} (nothing clipped)`;
      ok ? pass(m) : fail(m);
    }
    const hero = L.boxes.hero;
    const textNames = Object.keys(L.boxes).filter((n) => n !== 'hero');
    for (const n of textNames) {
      const t = L.boxes[n];
      const gap = Math.max(hero.x - (t.x + t.w), t.x - (hero.x + hero.w), hero.y - (t.y + t.h), t.y - (hero.y + hero.h));
      const m = `${K} ${n} vs hero gap ${Math.round(gap)}px (>= 40)`;
      gap >= 40 ? pass(m) : fail(m);
    }
    for (let a = 0; a < textNames.length; a++) for (let b = a + 1; b < textNames.length; b++) {
      const p = L.boxes[textNames[a]], q = L.boxes[textNames[b]];
      if (p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h) fail(`${K} ${textNames[a]} overlaps ${textNames[b]}`);
    }
    if (j.kind === 'header') {
      const first = L.boxes.lockup, last = L.boxes.subline;
      const textMid = (first.y + last.y + last.h) / 2, heroMid = hero.y + hero.h / 2;
      const m = `${K} text block centre y ${Math.round(textMid)} vs hero centre y ${Math.round(heroMid)} (within 20)`;
      Math.abs(textMid - heroMid) <= 20 ? pass(m) : fail(m);
      const hw = Math.round((hero.w / 3840) * 100);
      s.heroPctOfHeaderWidth = hw; s.heroPctOfSafeWidth = Math.round((hero.w / (SAFE.header.x1 - SAFE.header.x0)) * 100);
      console.log(`info ${K} hero = ${hw}% of Header width, ${s.heroPctOfSafeWidth}% of safe width`);
    }
  }

  for (const j of JOBS) {
    const K = `${V}/${j.id}`;
    const f = outs[j.id];
    const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim().split(',').map(Number);
    const pix = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=pix_fmt', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim();
    const alpha = execFileSync('sips', ['-g', 'hasAlpha', f], { encoding: 'utf8' }).match(/hasAlpha: (\w+)/)[1];
    const size = fs.statSync(f).size;
    const [ew, eh] = SPEC[j.kind];
    Object.assign(report.stills[K] ?? {}, { width: w, height: h, pix, hasAlpha: alpha, bytes: size });
    (w === ew && h === eh) ? pass(`${K} ${w}x${h}`) : fail(`${K} size ${w}x${h} != ${ew}x${eh}`);
    (alpha === 'no' && pix === 'rgb24') ? pass(`${K} no alpha (${pix}, hasAlpha ${alpha})`) : fail(`${K} alpha/pix ${alpha} ${pix}`);
    (size < 30e6) ? pass(`${K} ${(size / 1e6).toFixed(2)} MB`) : fail(`${K} too big`);
  }

  // 2x2 contact sheet: Header ID | Header EN over Search ID | Search EN
  const c = path.join(root, `review/variant-${V}.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error',
    '-i', outs.StoreHeaderId, '-i', outs.StoreHeaderEn, '-i', outs.StoreSearchId, '-i', outs.StoreSearchEn,
    '-filter_complex', '[0]scale=1600:-1[a];[1]scale=1600:-1[b];[2]scale=1000:-1[c];[3]scale=1000:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|1620_0|300_706|1920_706:fill=0x8E8E93,pad=3220:1393:0:0:color=0x8E8E93,format=rgb24',
    '-frames:v', '1', c]);
  report.contact = { ...(report.contact || {}), [V]: c };
}
fs.writeFileSync(path.join(root, 'review/variants-checks.json'), JSON.stringify(report, null, 2));
console.log(report.failures.length ? `\n${report.failures.length} FAILURE(S)` : '\nALL CHECKS PASS');
process.exit(report.failures.length ? 1 : 0);
