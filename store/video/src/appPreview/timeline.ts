import { segmentsEnd } from '../kit/timeMap';
import type { CameraKey, Label, Segment, Timeline, VoClip } from '../kit/types';
// Plain data only (export-timeline.mjs bundles this in Node). Frameless App Store preview, 886x1920 @ 30.
// Guideline 2.3.4: every frame is app capture; no device frame, hands, card or CTA.

// v4 (two changes on v3): (A) beat 2 uses take_2_3 and ends on the FILLED invite sheet (dewi@contoh.com, fictional) instead of the
// empty field; (B) every hard cut (between beats and between segments) is a soft transition: a 0.30-0.36 s crossfade, both clips
// playing under it, with a push (a push 1.00 -> 1.03, ease in-out, from the shared camera in camera.ts, then a slow relax). Beat starts and VO
// starts are unchanged: each crossfade is CENTRED on the old cut, the overlap comes from the clips' source handles.
// take_2_3 facts (measured): Pengaturan workspace static 0-10.2 (members Arif (Anda)/Sinta), tap ~10.1, sheet slides 10.23-10.6, empty
// field to ~12.6, then the system Paste/AutoFill callout over the field (12.7-15.1: CUT, never shown), "dewi@contoh.com" typed 14.9-15.3,
// clean filled sheet with the lit send arrow from 15.3 to the end of the clip.
// take_5_2 is static until src 5.2, so srcIn 2.7 holds the headline for 2.5 s (the pill needs 2.3 s); the scroll starts at out ~21.0.
const BEAT5 = { srcIn: 2.7 };

export const VO: VoClip[] = [
  { name: 'beat_1', at: 0.3 },
  { name: 'beat_2', at: 5.9 },
  { name: 'beat_3', at: 10.9 },
  { name: 'beat_4', at: 15.4 },
  { name: 'beat_5', at: 18.5 },
  { name: 'beat_6', at: 22.3 },
];

// Output-time boundaries of the picture beats (the picture may lead its VO by <= 0.5 s).
const T = { b1: 0, b2: 4.8, b3: 9.9, b4: 15.42, b5: 18.52, b6: 22.32 };
export const CUTS = T;

const T11 = 'clips/take_1_1.mp4';
const T23 = 'clips/take_2_3.mp4';
const T31 = 'clips/take_3_1.mp4';
const T41 = 'clips/take_4_1.mp4';
const T52 = 'clips/take_5_2.mp4';
const T61 = 'clips/take_6_1.mp4';

// MARK: - Parts. `start` = the output time the part takes over (the CENTRE of the crossfade into it); `srcIn` = the source second shown
// at `start`. `h` = half the crossfade (s). `strip` = a beat boundary: the top STRIP_H px (status bar + toolbar + large title) switch in ONE frame at the middle, so two toolbars/titles never show over each other (the body below still dissolves).
type Part = { src: string; srcIn: number; start: number; rate?: number; h?: number; strip?: boolean };
const HB = 0.18; // beat boundary: 0.36 s
const HS = 0.15; // inside a beat: 0.30 s
export const STRIP_H = 350;
export const STRIP_FEATHER = 28;
export const STRIP_WINDOW = 0.001; // a hard one-frame switch: no frame shows both toolbars
const END_TARGET = 28.04;

const PARTS: Part[] = [
  // 1: Transactions + category bar (static take; the push supplies the movement). take_1_2 is NOT used (its sheet shows the profile email).
  { src: T11, srcIn: 0.3, start: T.b1 },
  // 2: Workspace settings (members, then the tap on Undang anggota and the sheet sliding up; the take is static until the tap, so one
  // continuous part: no dead time to cut) -> short dissolve to the FILLED sheet (suggests typing; the Paste/AutoFill callout is never shown).
  { src: T23, srcIn: 7.98, start: T.b2, h: HB, strip: true },
  { src: T23, srcIn: 15.475, start: 7.725, h: 0.175 },
  // 3: Add Transaction. A: form + typing (3.4x), category fills at src ~11.7. B: amount typed (1.4x). C: Simpan -> new row (28.4-29.5; the clip ends at 29.7, so the crossfade handle needs C to stop at 29.5). D: the last frames held (0.24x).
  { src: T31, srcIn: 5.9, start: T.b3, rate: 3.4, h: HB, strip: true },
  { src: T31, srcIn: 20.0, start: T.b3 + (15.5 - 5.9) / 3.4, rate: 1.4, h: HS },
  { src: T31, srcIn: 28.4, start: T.b3 + (15.5 - 5.9) / 3.4 + (21.4 - 20.0) / 1.4, h: HS },
  { src: T31, srcIn: 29.3, start: T.b3 + (15.5 - 5.9) / 3.4 + (21.4 - 20.0) / 1.4 + 1.1, rate: 0.24, h: HS },
  // 4: shared receipt screen -> Pindai Struk. Cross over the scan wait: both ends show "Memindai..." (src 3.8 -> 8.35).
  { src: T41, srcIn: 2.1, start: T.b4, h: HB, strip: true },
  { src: T41, srcIn: 8.35, start: T.b4 + 1.7, h: HS },
  // 5: Insights headline, then the slow scroll starts (out ~21.0)
  { src: T52, srcIn: BEAT5.srcIn, start: T.b5, h: HB, strip: true },
  // 6: slow scroll on Transactions (0.7x). In-point 5.5 is AFTER the native large title has collapsed (src 3.8-4.8) and after the category bar has scrolled out from under the status bar (smear gone by 5.4), and the part before
  // it (Insights at src ~6.5, collapsed too) has the same collapsed toolbar: the strip switch keeps the two titles from overlapping.
  { src: T61, srcIn: 5.5, start: T.b6, rate: 0.7, h: HB, strip: true },
  { src: T61, srcIn: 9.35, start: T.b6 + (6.5 - 5.5) / 0.7, rate: 0.7, h: HS },
];

const r4 = (n: number) => Math.round(n * 10000) / 10000;
export const SEGMENTS: Segment[] = PARTS.map((p, i) => {
  const rate = p.rate ?? 1;
  const h = p.h ?? 0;
  const nextStart = i + 1 < PARTS.length ? PARTS[i + 1].start : END_TARGET;
  const nextH = i + 1 < PARTS.length ? (PARTS[i + 1].h ?? 0) : 0;
  const at = p.start - h;
  const srcIn = p.srcIn - h * rate;
  const srcOut = p.srcIn + (nextStart + nextH - p.start) * rate;
  return { src: p.src, srcIn: r4(srcIn), srcOut: r4(srcOut), at: r4(at), ...(rate !== 1 ? { rate } : {}), ...(h ? { xfade: r4(2 * h) } : {}) };
});
/** Per segment: strip-switch transition into it (beat boundaries). */
export const STRIP: boolean[] = PARTS.map((p) => !!p.strip);

export const END = Math.round(segmentsEnd(SEGMENTS) * 100) / 100;

export const LABELS: Label[] = [
  // Pills sit BESIDE the UI they name, in an empty gap (screen px at z~1.02; checked on the v3 stills), never over a row, header or button.
  // 1: right of the "Hari ini" header, between the category card and the first row.
  { at: 1.9, until: 4.7, title: 'Keluarga Arif', detail: 'Bersama', right: true, top: 678 },
  // 2: just above the real Undang anggota button (the full-width row at screen y ~1135-1235), right of the "Undangan terkirim" header; gone before the sheet slides up (src 10.23 -> out 7.05).
  { at: 4.85, until: 7.0, title: 'Undang anggota', right: true, top: 1030 },
  // 3: right of the "Kategori" header, just above the category row that fills itself (11.6); gone before the list returns (13.9).
  { at: 10.95, until: 13.55, title: 'Kategori otomatis', right: true, top: 526 },
  // 4: free bottom-right corner of the summary card on the list; on the share screen it sits in the receipt card's right margin.
  { at: 15.55, until: 17.65, title: 'Pindai struk', right: true, top: 566 },
  // 5: gap between the Bulan/Tahun control and the headline card; gone before the scroll brings rows up (starts out ~21.0).
  { at: 18.55, until: 20.95, title: 'Ringkasan bulanan', top: 432 },
];

export const TIMELINE: Timeline = {
  fps: 30,
  width: 886,
  height: 1920,
  end: END,
  audio: 'mix',
  vo: VO,
  labels: LABELS,
  segments: SEGMENTS,
};

// MARK: - Camera (see camera.ts for keys). Re-exported so review/export only needs this module.
export type { CameraKey };
