import React, { useMemo } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND } from './brand';
import { clamp } from './camera';
import { LEAD, captionChunks, chunkWindow } from './captionChunks';
import { safe } from './safeZones';
import type { VoClip } from './types';

// MARK: - Burned-in VO captions (bottom centre, max two lines, word-by-word reveal)

export const Captions: React.FC<{ vo: VoClip[]; portrait?: boolean }> = ({ vo, portrait = false }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const zone = safe(portrait);
  const chunks = useMemo(() => captionChunks(vo, zone.maxChunkChars), [vo, zone.maxChunkChars]);
  const index = chunks.findIndex((_, i) => {
    const w = chunkWindow(chunks, i);
    return t >= w.start && t < w.end;
  });
  if (index < 0) return null;

  const { start, end } = chunkWindow(chunks, index);
  const prev = index > 0 ? chunkWindow(chunks, index - 1) : undefined;
  const next = index < chunks.length - 1 ? chunkWindow(chunks, index + 1) : undefined;
  // The plate only fades when there is a real pause on either side.
  const fadeIn = prev && start - prev.end < 0.3 ? 1 : interpolate(t, [start, start + 0.15], [0, 1], clamp);
  const fadeOut = next && next.start - end < 0.3 ? 1 : interpolate(t, [end - 0.2, end], [1, 0], clamp);

  // One consistent plate: 40 px side margins, a single centred line (chunks are sized to fit one line), the whole phrase
  // laid out from its first frame (unspoken words dimmed, never missing), so there are no empty lines or one-word plates.
  return (
    <div
      style={{
        position: 'absolute',
        left: 40,
        right: 40,
        bottom: zone.captionBottom,
        display: 'flex',
        justifyContent: 'center',
        opacity: Math.min(fadeIn, fadeOut),
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: zone.captionMaxW,
          padding: '14px 28px 16px',
          borderRadius: 24,
          background: BRAND.captionPlate,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
          fontFamily: BRAND.font,
          fontSize: zone.captionFont,
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: -0.2,
          color: BRAND.captionText,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {chunks[index].map(([word, s], i) => {
          const shown = interpolate(t, [s - LEAD, s - LEAD + 0.08], [0.4, 1], clamp);
          return (
            <span key={i} style={{ opacity: shown }}>
              {word}
              {i < chunks[index].length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};
