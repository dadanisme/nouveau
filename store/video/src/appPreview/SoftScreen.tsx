import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { clamp, ease } from '../kit/camera';
import { Segment, segEnd } from '../kit/types';
import { STRIP_FEATHER, STRIP_H, STRIP_WINDOW } from './timeline';

// Soft-transition player. Every segment after the first dissolves in over the previous one (both keep playing under the crossfade:
// each Sequence stays mounted until the next has fully taken over). The push is the shared camera (camera.ts), so all layers align.
// At beat boundaries (`strip`) the top STRIP_H px (status bar, toolbar, large title) switch over a short window at the middle of the
// crossfade instead of dissolving, so two toolbars/titles never overlap; the body below dissolves as usual.

const Layer: React.FC<{ seg: Segment; strip: boolean }> = ({ seg, strip }) => {
  const frame = useCurrentFrame(); // relative to the Sequence (starts at seg.at)
  const { fps } = useVideoConfig();
  const t = frame / fps; // seconds since seg.at
  const inDur = seg.xfade ?? 0;
  const bp = inDur ? ease.inOut(interpolate(t, [0, inDur], [0, 1], clamp)) : 1;

  let style: React.CSSProperties = {};
  if (inDur && t < inDur) {
    if (strip) {
      const mid = inDur / 2;
      const sp = ease.inOut(interpolate(t, [mid - STRIP_WINDOW / 2, mid + STRIP_WINDOW / 2], [0, 1], clamp));
      const g = `linear-gradient(to bottom, rgba(0,0,0,${sp}) 0px, rgba(0,0,0,${sp}) ${STRIP_H}px, rgba(0,0,0,${bp}) ${STRIP_H + STRIP_FEATHER}px, rgba(0,0,0,${bp}) 100%)`;
      style = { ...style, WebkitMaskImage: g, maskImage: g };
    } else style = { ...style, opacity: bp };
  }
  return (
    <AbsoluteFill style={style}>
      <OffthreadVideo
        src={staticFile(seg.src)}
        trimBefore={Math.round(seg.srcIn * fps)}
        playbackRate={seg.rate ?? 1}
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </AbsoluteFill>
  );
};

export const SoftScreen: React.FC<{ segments: Segment[]; strips: boolean[]; background?: string }> = ({ segments, strips, background = '#F2F2F7' }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const end = durationInFrames / fps;
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background, overflow: 'hidden' }}>
      {segments.map((seg, i) => {
        const next = segments[i + 1];
        const holdUntil = next ? Math.max(segEnd(seg, end), next.at + (next.xfade ?? 0)) : segEnd(seg, end);
        const from = f(seg.at);
        const dur = Math.max(1, f(Math.min(holdUntil, end)) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Layer seg={seg} strip={strips[i]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
