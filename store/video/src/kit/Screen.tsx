import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { clamp, ease } from './camera';
import { Segment, segEnd } from './types';

// MARK: - One segment of live footage inside a device screen

const SegmentView: React.FC<{ seg: Segment; next?: Segment; statusBarClip: number }> = ({ seg, next, statusBarClip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const fadeFrames = seg.xfade && !seg.reveal ? f(seg.xfade) : 0;
  const opacity = fadeFrames ? interpolate(frame, [0, fadeFrames], [0, 1], clamp) : 1;

  // When the next segment "reveals", this one slides off the screen (sheet dismiss / unlock swipe).
  // The status bar strip is clipped off the sliding layer so the island/clock never doubles up.
  let transform: string | undefined;
  let clipPath: string | undefined;
  if (next?.reveal && next.xfade) {
    const start = f(next.at - seg.at);
    const p = ease.inOut(interpolate(frame, [start, start + f(next.xfade)], [0, 1], clamp));
    if (p > 0) {
      transform = `translateY(${(next.reveal === 'down' ? 1 : -1) * p * 100}%)`;
      clipPath = statusBarClip ? `inset(${statusBarClip * 100}% 0 0 0)` : undefined;
    }
  }

  const fill: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <AbsoluteFill style={{ opacity, transform, clipPath, zIndex: next?.reveal ? 2 : 1 }}>
      {seg.still ? (
        <Img src={staticFile(seg.src)} style={fill} />
      ) : (
        <OffthreadVideo src={staticFile(seg.src)} trimBefore={Math.round(seg.srcIn * fps)} playbackRate={seg.rate ?? 1} muted style={fill} />
      )}
    </AbsoluteFill>
  );
};

// MARK: - Segment player: each segment stays mounted until the next one has fully taken over.
// statusBarClip: fraction of screen height to clip off a sliding layer (0.065 for iPhone, 0 for desktop).

export const Screen: React.FC<{ segments: Segment[]; statusBarClip?: number; background?: string }> = ({ segments, statusBarClip = 0.065, background = '#000' }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const end = durationInFrames / fps;
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background }}>
      {segments.map((seg, i) => {
        const next = segments[i + 1];
        const holdUntil = next ? Math.max(segEnd(seg, end), next.at + (next.xfade ?? 0)) : segEnd(seg, end);
        const from = f(seg.at);
        const dur = Math.max(1, f(Math.min(holdUntil, end)) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} style={{ zIndex: next?.reveal ? 2 : 1 }}>
            <SegmentView seg={seg} next={next} statusBarClip={statusBarClip} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
