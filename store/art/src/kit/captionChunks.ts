import { CAPTION_WORDS, Word } from '../generated/captionWords';
import type { VoClip } from './types';

// Pure caption chunking/timing (no React): shared by Captions.tsx and the readability export.

// MARK: - Timing rules

export const LEAD = 0.06; // a word shows a hair before it is spoken
export const HOLD = 0.9; // a chunk lingers after its last word...
export const GAP = 0.08; // ...but clears just before the next chunk starts
const MIN_SENTENCE_CHARS = 28; // short sentences ("Acme." "Every word.") merge with the next one

export const textOf = (c: Word[]) => c.map((w) => w[0]).join(' ');

// MARK: - Chunking: one sentence per plate; long ones split at the punctuation nearest the middle

const splitLong = (c: Word[], maxChars: number): Word[][] => {
  if (textOf(c).length <= maxChars || c.length < 4) return [c];
  const half = textOf(c).length / 2;
  let best = -1;
  let bestDist = Infinity;
  let pos = 0;
  c.forEach(([w], i) => {
    pos += w.length + 1;
    if (i < c.length - 1 && /[,.:;?!”"')]$/.test(w) && Math.abs(pos - half) < bestDist) {
      best = i;
      bestDist = Math.abs(pos - half);
    }
  });
  if (best < 0) best = Math.floor(c.length / 2) - 1;
  return [...splitLong(c.slice(0, best + 1), maxChars), ...splitLong(c.slice(best + 1), maxChars)];
};

const sentences = (words: Word[]): Word[][] => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const endsSentence = /[.?!]["”')]*$/.test(w[0]);
    if ((endsSentence && textOf(cur).length >= MIN_SENTENCE_CHARS) || i === words.length - 1) {
      out.push(cur);
      cur = [];
    }
  });
  return out;
};

/** Absolute-time chunks for the given VO placements. */
export const captionChunks = (vo: VoClip[], maxChars: number): Word[][] =>
  vo
    .flatMap((clip) => {
      const words = (CAPTION_WORDS[clip.name] ?? []).map(([w, s, e]) => [w, s + clip.at, e + clip.at] as Word);
      return sentences(words).flatMap((c) => splitLong(c, maxChars));
    })
    .sort((a, b) => a[0][1] - b[0][1]);

/** When chunk i is on screen. */
export const chunkWindow = (chunks: Word[][], i: number) => {
  const words = chunks[i];
  const next = chunks[i + 1];
  const start = words[0][1] - LEAD;
  const end = Math.min(words[words.length - 1][2] + HOLD, next ? next[0][1] - LEAD - GAP : Infinity);
  return { start, end };
};
