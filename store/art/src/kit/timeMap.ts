import { Segment, segEnd } from './types';

// MARK: - Cuts -> segments, and source time <-> output time across cuts and rate changes.
// Pure data (no React/Remotion imports), so timelines and review.ts can use it in plain Node.

/** A kept source range: `[srcIn, srcOut]`, or an object with a playback rate (0.55 = slowed), a dissolve, or
 * `gap` seconds of extra output time before it (e.g. to hold the previous segment's tail under a camera move). */
export type Cut = [number, number] | { srcIn: number; srcOut: number; rate?: number; xfade?: number; gap?: number; src?: string };

/** Lay cuts of one source end to end from output time `at0`; each segment's `at` is computed, never typed by hand. */
export const cutsToSegments = (src: string, cuts: Cut[], at0 = 0): Segment[] => {
  const out: Segment[] = [];
  let at = at0;
  for (const c of cuts) {
    const k = Array.isArray(c) ? { srcIn: c[0], srcOut: c[1] } : c;
    if (!(k.srcOut > k.srcIn)) throw new Error(`cutsToSegments: srcOut must be > srcIn (got ${k.srcIn}..${k.srcOut})`);
    at += 'gap' in k && k.gap ? k.gap : 0;
    const seg: Segment = { src: ('src' in k && k.src) || src, srcIn: k.srcIn, srcOut: k.srcOut, at: round(at) };
    if ('rate' in k && k.rate && k.rate !== 1) seg.rate = k.rate;
    if ('xfade' in k && k.xfade) seg.xfade = k.xfade;
    out.push(seg);
    at += (k.srcOut - k.srcIn) / (seg.rate ?? 1);
  }
  return out;
};

/** Output time at which the last segment ends. */
export const segmentsEnd = (segments: Segment[]) => segments.reduce((m, s) => Math.max(m, segEnd(s)), 0);

const round = (x: number) => Math.round(x * 1e6) / 1e6;

export type TimeMap = {
  /** Output time of source second `src` (in clip `file`, default: any clip). Throws if that moment was cut. */
  out: (src: number, file?: string) => number;
  /** Source second (and clip) shown at output time `t`. Throws in a gap with no segment. */
  src: (t: number) => { src: number; file: string };
  /** The segment playing at output time `t` (the later one during a dissolve), or undefined. */
  segmentAt: (t: number) => Segment | undefined;
};

export const timeMap = (segments: Segment[]): TimeMap => {
  const eps = 1e-6;
  const playing = segments.filter((s) => !s.still);
  const segmentAt = (t: number) => {
    let hit: Segment | undefined;
    for (const s of playing) if (t >= s.at - eps && t <= segEnd(s) + eps) hit = s;
    return hit;
  };
  return {
    out: (src, file) => {
      const s = playing.find((g) => (!file || g.src === file) && src >= g.srcIn - eps && src <= g.srcOut + eps);
      if (!s) throw new Error(`timeMap.out: source time ${src}${file ? ` of ${file}` : ''} is not in any kept segment (it was cut)`);
      return round(s.at + (src - s.srcIn) / (s.rate ?? 1));
    },
    src: (t) => {
      const s = segmentAt(t);
      if (!s) throw new Error(`timeMap.src: no segment plays at output time ${t}`);
      return { src: round(s.srcIn + (t - s.at) * (s.rate ?? 1)), file: s.src };
    },
    segmentAt,
  };
};
