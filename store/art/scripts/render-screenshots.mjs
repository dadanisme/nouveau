// Renders the 12 App Store screenshots (ID + EN, 6 each), measures the layout in the real browser, verifies every spec,
// and builds review/screenshots-contact-{id,en}.png. Run: node scripts/render-screenshots.mjs
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SK = path.join(os.homedir(), '.claude/skills/product-video/scripts');
const browserExecutable = execFileSync('node', [path.join(SK, 'browser-path.mjs')], { encoding: 'utf8' }).trim().split('\n').pop();

const NOS = ['01', '02', '03', '04', '05', '06'];
const NAMES = { '01': '01-workspace', '02': '02-transactions', '03': '03-add-transaction', '04': '04-scan-receipt', '05': '05-insights', '06': '06-welcome' };
const LANGS = ['id', 'en'];
const W = 1320, H = 2868;
const TEXT = '#1C1C1E', ACCENT = '#E24A00';
const MARGIN = 60, GAP = 60;
const CHROME_FROM = 2600; // rows below this in the raw capture are chrome (floating tab bar, home indicator, sheet corner), not content
const BG_RGB = [242, 242, 247]; // systemGroupedBackground

// last row of meaningful (non-background) content in a raw capture, above the chrome band
const lastContentRow = (file) => {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  for (let y = CHROME_FROM - 1; y >= 0; y--) {
    for (let x = 0; x < 1320; x++) {
      const i = (y * 1320 + x) * 3;
      if (Math.abs(buf[i] - BG_RGB[0]) + Math.abs(buf[i + 1] - BG_RGB[1]) + Math.abs(buf[i + 2] - BG_RGB[2]) > 24) return y;
    }
  }
  return -1;
};

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const lumRGB = (r, g, b) => lum('#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''));
const ratio = (l1, l2) => { const [a, b] = [l1, l2].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };

const report = { failures: [], shots: {} };
const fail = (m) => { report.failures.push(m); console.log('FAIL', m); };
const ok = (c, m) => (c ? console.log('ok  ', m) : fail(m));

// stage the raw captures where the bundle can serve them
for (const lang of LANGS) {
  fs.mkdirSync(path.join(root, 'public/shots', lang), { recursive: true });
  for (const no of NOS) {
    const src = path.join(root, 'raw', lang, NAMES[no] + '.png');
    if (!fs.existsSync(src)) { fail(`missing raw ${src}`); continue; }
    fs.copyFileSync(src, path.join(root, 'public/shots', lang, NAMES[no] + '.png'));
  }
}
if (report.failures.length) process.exit(1);

// palette contrast from the actual colours
const BGS = { 'grouped gray #F2F2F7': '#F2F2F7', 'white #FFFFFF': '#FFFFFF', 'soft tint #FDEBDF': '#FDEBDF' };
report.paletteContrast = {};
for (const [n, hex] of Object.entries(BGS)) {
  const r = ratio(lum(TEXT), lum(hex)); report.paletteContrast[n] = +r.toFixed(2);
  ok(r >= 4.5, `contrast headline ${TEXT} on ${n} = ${r.toFixed(2)}:1 (>= 4.5)`);
}
const accRatio = ratio(lum(ACCENT), lum('#F2F2F7'));
console.log(`info accent bar ${ACCENT} on #F2F2F7 = ${accRatio.toFixed(2)}:1 (decorative, not text; non-text >= 3:1)`);
ok(accRatio >= 3, 'accent bar non-text contrast >= 3:1');

const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
const outDir = path.join(root, 'out/screenshots');
fs.mkdirSync(path.join(root, 'review'), { recursive: true });
const outs = {};
const phones = {};

for (const lang of LANGS) {
  fs.mkdirSync(path.join(outDir, lang), { recursive: true });
  for (const no of NOS) {
    const id = `Screenshot${lang === 'id' ? 'Id' : 'En'}${no}`;
    const key = `${lang}/${NAMES[no]}`;
    let L = null;
    const comp = await selectComposition({ serveUrl, id, browserExecutable });
    const tmp = path.join(root, 'review', `raw_${id}.png`);
    await renderStill({
      composition: comp, serveUrl, output: tmp, imageFormat: 'png', browserExecutable,
      onBrowserLog: (l) => { if (l.text.startsWith('SHOT_LAYOUT ')) L = JSON.parse(l.text.slice(12)); },
    });
    const out = path.join(outDir, lang, NAMES[no] + '.png');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-vf', 'format=rgb24', '-frames:v', '1', out]); // flatten to RGB, no alpha
    fs.rmSync(tmp);
    outs[key] = out;
    const s = (report.shots[key] = { file: out });
    const tag = `${key}`;
    if (!L) { fail(`${tag}: no layout log`); continue; }
    const b = L.boxes;

    // font and line count
    ok(L.fontOk, `${tag} SF Pro Display available`);
    ok(L.lines <= 2, `${tag} headline lines = ${L.lines} (<= 2)`);
    // margins: headline text and accent measured in Chrome
    const ht = b.headlineText;
    s.headline = ht;
    ok(ht.x >= MARGIN && ht.x + ht.w <= W - MARGIN && ht.y >= MARGIN,
      `${tag} headline [${Math.round(ht.x)},${Math.round(ht.y)} ${Math.round(ht.w)}x${Math.round(ht.h)}] margins L ${Math.round(ht.x)} R ${Math.round(W - ht.x - ht.w)} T ${Math.round(ht.y)} (>= ${MARGIN})`);
    // top block = above the phone; no overlap, gap
    const blockBottom = Math.max(ht.y + ht.h, b.accent.y + b.accent.h);
    const gap = b.phone.y - blockBottom;
    s.gapToPhone = Math.round(gap);
    ok(gap >= GAP, `${tag} headline block bottom ${Math.round(blockBottom)} vs phone top ${Math.round(b.phone.y)}: gap ${Math.round(gap)} (>= ${GAP}, no overlap)`);
    ok(b.accent.x >= MARGIN && b.accent.x + b.accent.w <= W - MARGIN, `${tag} accent inside margins`);
    // phone geometry: one standard size for every shot (~83% wide screenshot); centred, bleeds off the bottom
    const frac = b.shot.w / W;
    ok(frac >= 0.82 && frac <= 0.86, `${tag} screenshot width ${Math.round(b.shot.w)} = ${(frac * 100).toFixed(1)}% of canvas (82-86%)`);
    phones[key] = { x: b.phone.x, y: b.phone.y, w: b.phone.w, r: b.phone.x + b.phone.w };
    ok(b.phone.x >= 0 && b.phone.x + b.phone.w <= W, `${tag} phone fits the canvas width (${Math.round(b.phone.x)}..${Math.round(b.phone.x + b.phone.w)})`);
    ok(Math.abs(b.phone.x + b.phone.w / 2 - W / 2) < 1, `${tag} phone centred`);
    ok(b.phone.y + b.phone.h > H, `${tag} phone bleeds off the bottom (bottom ${Math.round(b.phone.y + b.phone.h)} > ${H})`);
    // cut line: the canvas bottom cuts the screen at this raw row; it must sit below the last meaningful content row
    const scale = b.shot.h / L.img.natH;
    const cutRow = (H - b.shot.y) / scale;
    const last = lastContentRow(path.join(root, 'raw', lang, NAMES[no] + '.png'));
    s.crop = { phoneW: Math.round(b.phone.w), screenW: Math.round(b.shot.w), visibleScreenH: Math.round(H - b.shot.y), cutRawRow: Math.round(cutRow), lastContentRow: last, marginRaw: Math.round(cutRow - last), marginCanvas: Math.round((cutRow - last) * scale) };
    ok(last >= 0 && cutRow > last, `${tag} cut line raw row ${Math.round(cutRow)} below last content row ${last}: margin ${Math.round(cutRow - last)} raw / ${Math.round((cutRow - last) * scale)} canvas px; phone ${Math.round(b.phone.w)} wide, visible screen ${Math.round(H - b.shot.y)} tall`);
    // not distorted: rendered aspect equals the file's natural aspect
    const aspectRaw = L.img.natW / L.img.natH, aspectBox = L.img.w / L.img.h;
    s.aspect = { natural: +aspectRaw.toFixed(5), rendered: +aspectBox.toFixed(5), natW: L.img.natW, natH: L.img.natH };
    ok(L.img.natW === 1320 && L.img.natH === 2868, `${tag} raw is ${L.img.natW}x${L.img.natH}`);
    ok(Math.abs(aspectRaw / aspectBox - 1) < 0.0005, `${tag} screenshot aspect ${aspectBox.toFixed(5)} == natural ${aspectRaw.toFixed(5)} (no distortion)`);

    // format
    const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,pix_fmt', '-of', 'csv=p=0', out], { encoding: 'utf8' }).trim().split(',');
    const [w, h, pix] = [Number(probe[0]), Number(probe[1]), probe[2]];
    const sips = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'hasAlpha', out], { encoding: 'utf8' });
    const sw = +sips.match(/pixelWidth: (\d+)/)[1], sh = +sips.match(/pixelHeight: (\d+)/)[1], alpha = sips.match(/hasAlpha: (\w+)/)[1];
    Object.assign(s, { width: w, height: h, pix, hasAlpha: alpha, bytes: fs.statSync(out).size });
    ok(w === W && h === H && sw === W && sh === H, `${tag} ${w}x${h} (ffprobe) / ${sw}x${sh} (sips) == ${W}x${H}`);
    ok(alpha === 'no' && pix === 'rgb24', `${tag} no alpha (hasAlpha ${alpha}, ${pix})`);

    // contrast from the rendered pixels: darkest background pixel around the headline vs the text colour
    const pad = 24;
    const cx = Math.max(0, Math.floor(ht.x - pad)), cy = Math.max(0, Math.floor(ht.y - pad));
    const cw = Math.min(W - cx, Math.ceil(ht.w + pad * 2)), ch = Math.min(Math.floor(b.accent.y - 6) - cy, Math.ceil(ht.h + pad * 2));
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', out, '-vf', `crop=${cw}:${ch}:${cx}:${cy}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
    let darkestBg = 1;
    for (let i = 0; i < raw.length; i += 3) {
      const l = lumRGB(raw[i], raw[i + 1], raw[i + 2]);
      if (l >= 0.80 && l < darkestBg) darkestBg = l; // background pixels only (text and antialiasing are far darker)
    }
    const cr = ratio(lum(TEXT), darkestBg);
    s.contrastPixels = +cr.toFixed(2);
    ok(cr >= 4.5, `${tag} headline vs darkest rendered background pixel = ${cr.toFixed(2)}:1 (>= 4.5)`);
  }
}

// uniformity: all 12 phones identical in width, left/right x and top y
{
  const ps = Object.values(phones);
  const ref = ps[0];
  ok(ps.length === 12, `phone measurements for ${ps.length} shots (12 expected)`);
  const spread = (k) => Math.max(...ps.map((p) => p[k])) - Math.min(...ps.map((p) => p[k]));
  for (const k of ['w', 'x', 'r', 'y']) ok(spread(k) < 0.5, `all 12 phones identical ${{ w: 'width', x: 'left x', r: 'right x', y: 'top y' }[k]} = ${ref[k].toFixed(1)} (spread ${spread(k).toFixed(2)})`);
  report.phoneGeometry = { ref, spread: { w: spread('w'), x: spread('x'), r: spread('r'), y: spread('y') } };
}

// Contact sheets, 3 up x 2, one per language
for (const lang of LANGS) {
  const files = NOS.map((n) => outs[`${lang}/${NAMES[n]}`]);
  const cw = 440, chh = 956, g = 24;
  const inputs = files.flatMap((f) => ['-i', f]);
  const filt = files.map((_, i) => `[${i}]scale=${cw}:${chh}[s${i}]`).join(';') +
    ';' + files.map((_, i) => `[s${i}]`).join('') +
    `xstack=inputs=6:layout=${[0, 1, 2, 3, 4, 5].map((i) => `${g + (i % 3) * (cw + g)}_${g + Math.floor(i / 3) * (chh + g)}`).join('|')}:fill=0x8E8E93,pad=${3 * cw + 4 * g}:${2 * chh + 3 * g}:0:0:0x8E8E93,format=rgb24`;
  const c = path.join(root, `review/screenshots-contact-${lang}.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filt, '-frames:v', '1', c]);
  report[`contact_${lang}`] = c;
}
fs.writeFileSync(path.join(root, 'review/screenshots-checks.json'), JSON.stringify(report, null, 2));
console.log(report.failures.length ? `\n${report.failures.length} FAILURE(S)` : '\nALL CHECKS PASS');
process.exit(report.failures.length ? 1 : 0);
