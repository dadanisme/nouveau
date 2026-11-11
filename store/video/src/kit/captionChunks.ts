import { CAPTION_WORDS, Word } from '../generated/captionWords';
import type { VoClip } from './types';

// Pure caption chunking/timing (no React): shared by Captions.tsx and the readability export.

// MARK: - Timing rules

export const LEAD = 0.06; // a word shows a hair before it is spoken
export const HOLD = 0.9; // a chunk lingers after its last word...
export const GAP = 0.08; // ...but clears just before the next chunk starts
const MIN_SENTENCE_CHARS = 28; // short sentences ("Acme." "Every word.") merge with the next one

export const textOf = (c: Word[]) => c.map((w) => w[0]).join(' ');

// MARK: - Chunking: one sentence per run; long ones are split by a small DP into plates that fit ONE line
// (<= maxChars), each with at least MIN_WORDS words (no one-word orphans), preferring breaks after punctuation.

const MIN_WORDS = 2;

const splitLong = (c: Word[], maxChars: number): Word[][] => {
  if (textOf(c).length <= maxChars) return [c];
  const n = c.length;
  const len = (i: number, j: number) => textOf(c.slice(i, j)).length; // words i..j-1
  const best: number[] = Array(n + 1).fill(Infinity);
  const from: number[] = Array(n + 1).fill(-1);
  best[0] = 0;
  for (let j = MIN_WORDS; j <= n; j++) {
    for (let i = 0; i <= j - MIN_WORDS; i++) {
      if (!Number.isFinite(best[i]) || len(i, j) > maxChars) continue;
      const endsPunct = j === n || /[,.:;?!]["”')]*$/.test(c[j - 1][0]);
      // 3 per plate, +8 for breaking mid-phrase, plus a mild preference for evenly filled plates
      // a plate must stay up >= 0.9 s (reading_time wants 0.8): same window rule as chunkWindow()
      const winEnd = Math.min(c[j - 1][2] + HOLD, j < n ? c[j][1] - LEAD - GAP : Infinity);
      const tooShort = winEnd - (c[i][1] - LEAD) < 0.9 ? 50 : 0;
      const cost = best[i] + 3 + (endsPunct ? 0 : 8) + tooShort + (maxChars - len(i, j)) / maxChars;
      if (cost < best[j]) {
        best[j] = cost;
        from[j] = i;
      }
    }
  }
  if (!Number.isFinite(best[n])) return [c]; // cannot fit: keep whole (never happens for these scripts)
  const out: Word[][] = [];
  for (let j = n; j > 0; j = from[j]) out.unshift(c.slice(from[j], j));
  return out;
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
