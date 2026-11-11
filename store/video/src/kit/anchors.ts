import { CAPTION_WORDS } from '../generated/captionWords';
import type { CameraKey, Label, Segment, VoClip } from './types';

// MARK: - Word anchors: tie a time to a spoken VO word so cuts, camera moves and pills follow the voice.
// `{ vo: 'beat_1b', word: 'share', offset: -0.2 }` = 0.2 s before "share" starts in VO clip beat_1b.
// Resolved when the timeline module loads, from generated/captionWords.ts + the clip's `at`; a missing
// clip or word THROWS (so render, studio and export-timeline.mjs all fail loudly after a script change).

export type WordAnchor = {
  vo: string;
  /** Matched case- and punctuation-insensitively against the script text ("browser" matches "browser,"). */
  word: string;
  /** 1-based occurrence when the word appears more than once in the line (default 1). */
  nth?: number;
  /** Anchor to the word's start (default) or end. */
  edge?: 'start' | 'end';
  offset?: number;
};
export type At = number | WordAnchor;

export type AnchorRecord = { where: string; vo: string; word: string; nth: number; edge: 'start' | 'end'; offset: number; wordTime: number; t: number };
/** Every anchor resolved so far (exported to review/<comp>.timeline.json for checks). */
export const ANCHOR_LOG: AnchorRecord[] = [];

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export const resolveAt = (at: At, vo: VoClip[], where = 'time'): number => {
  if (typeof at === 'number') return at;
  const clip = vo.find((v) => v.name === at.vo);
  if (!clip) throw new Error(`word anchor at ${where}: VO clip '${at.vo}' is not in timeline.vo (${vo.map((v) => v.name).join(', ')})`);
  const words = CAPTION_WORDS[at.vo];
  if (!words) throw new Error(`word anchor at ${where}: no caption words for '${at.vo}' — run align-captions.sh`);
  const nth = at.nth ?? 1;
  const hits = words.filter(([w]) => norm(w) === norm(at.word));
  const hit = hits[nth - 1];
  if (!hit) {
    throw new Error(
      `word anchor at ${where}: '${at.word}'${nth > 1 ? ` (#${nth})` : ''} not found in VO '${at.vo}' ` +
        `(${hits.length} match(es); words: ${words.map(([w]) => w).join(' ')})`,
    );
  }
  const edge = at.edge ?? 'start';
  const wordTime = clip.at + (edge === 'start' ? hit[1] : hit[2]);
  const t = wordTime + (at.offset ?? 0);
  ANCHOR_LOG.push({ where, vo: at.vo, word: at.word, nth, edge, offset: at.offset ?? 0, wordTime, t });
  return t;
};

// MARK: - Helpers for the three things that usually follow the voice

export type AnchoredKey = Omit<CameraKey, 't'> & { t: At };
export type AnchoredLabel = Omit<Label, 'at' | 'until'> & { at: At; until: At };
export type AnchoredSegment = Omit<Segment, 'at' | 'until'> & { at: At; until?: At };

/** Camera keys with anchored times; throws if the resolved keys are not strictly increasing. */
export const anchorKeys = (keys: AnchoredKey[], vo: VoClip[], name = 'KEYS'): CameraKey[] => {
  const out = keys.map((k, i) => ({ ...k, t: resolveAt(k.t, vo, `${name}[${i}]`) }));
  out.forEach((k, i) => {
    if (i > 0 && k.t <= out[i - 1].t) throw new Error(`${name}[${i}] resolves to ${k.t.toFixed(2)} s, not after ${name}[${i - 1}] (${out[i - 1].t.toFixed(2)} s)`);
  });
  return out;
};

export const anchorLabels = (labels: AnchoredLabel[], vo: VoClip[], name = 'labels'): Label[] =>
  labels.map((l, i) => {
    const at = resolveAt(l.at, vo, `${name}[${i}].at`);
    const until = resolveAt(l.until, vo, `${name}[${i}].until`);
    if (until <= at) throw new Error(`${name}[${i}] '${l.title}' ends (${until.toFixed(2)} s) before it starts (${at.toFixed(2)} s)`);
    return { ...l, at, until };
  });

export const anchorSegments = (segs: AnchoredSegment[], vo: VoClip[], name = 'segments'): Segment[] =>
  segs.map((s, i) => ({
    ...s,
    at: resolveAt(s.at, vo, `${name}[${i}].at`),
    until: s.until === undefined ? undefined : resolveAt(s.until, vo, `${name}[${i}].until`),
  }));
