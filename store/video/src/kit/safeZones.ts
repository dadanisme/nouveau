// MARK: - Safe zones (px at 1920x1080 / 1080x1920)
// Portrait: social apps cover the top ~220 px (account/title) and bottom ~250 px (caption, buttons).
// check.sh crops the caption band at 0.72-1.0 (landscape) / 0.64-0.90 (portrait) of the height: keep captions inside it.

export const SAFE = {
  landscape: { pillTop: 54, pillSide: 72, captionBottom: 54, captionMaxW: 1240, captionFont: 44, maxChunkChars: 90 },
  portrait: { pillTop: 220, pillSide: 56, captionBottom: 200, captionMaxW: 806, captionFont: 46, maxChunkChars: 30 },
} as const;

export type Orientation = keyof typeof SAFE;
export const safe = (portrait: boolean) => SAFE[portrait ? 'portrait' : 'landscape'];
