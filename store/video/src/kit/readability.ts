import { ANCHOR_LOG, AnchorRecord } from './anchors';
import { captionChunks, chunkWindow, textOf } from './captionChunks';
import { safe } from './safeZones';
import type { Segment, Timeline, VoClip } from './types';

// MARK: - What is on screen when, for check.sh's reading_time check (written by export-timeline.mjs).
// Pure data: no React/Remotion imports, so it bundles and runs in plain Node.

export type TimelineReport = {
  composition: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  captions: { text: string; start: number; end: number; speechStart: number; speechEnd: number }[];
  labels: { text: string; start: number; end: number }[];
  wordmark: { text: string; start: number; end: number } | null;
  /** Every word anchor resolved by the timeline modules (where, word, its time, the resolved time). */
  anchors: AnchorRecord[];
  /** VO clips (mix.json "timeline" generates its VO tracks from these). */
  vo: VoClip[];
  /** Screen segments (mix.json room tracks with "segmentsOf" follow their srcIn/srcOut/at/rate). */
  segments: Segment[];
};

const r2 = (x: number) => Math.round(x * 1000) / 1000;

export const timelineReport = (composition: string, timeline: Timeline, portrait = false, segments: Segment[] = timeline.segments ?? []): TimelineReport => {
  const chunks = captionChunks(timeline.vo, safe(portrait).maxChunkChars);
  const width = portrait ? Math.min(timeline.width, timeline.height) : Math.max(timeline.width, timeline.height);
  const height = portrait ? Math.max(timeline.width, timeline.height) : Math.min(timeline.width, timeline.height);
  return {
    composition,
    fps: timeline.fps,
    width,
    height,
    duration: timeline.end,
    captions: chunks.map((c, i) => {
      const w = chunkWindow(chunks, i);
      return { text: textOf(c), start: r2(Math.max(0, w.start)), end: r2(Math.min(timeline.end, w.end)), speechStart: c[0][1], speechEnd: c[c.length - 1][2] };
    }),
    labels: timeline.labels.map((l) => ({ text: l.detail ? `${l.title} · ${l.detail}` : l.title, start: l.at, end: Math.min(l.until, timeline.end) })),
    wordmark: timeline.ending
      ? { text: [...timeline.ending.phrases, ...(timeline.ending.cta ? [timeline.ending.cta] : [])].join(' '), start: timeline.ending.markIn, end: timeline.end }
      : null,
    anchors: ANCHOR_LOG,
    vo: timeline.vo.map((v) => ({ name: v.name, at: r2(v.at) })),
    segments: segments.map((g) => ({ ...g })),
  };
};
