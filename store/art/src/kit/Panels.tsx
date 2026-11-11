import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { background as brandBackground } from './brand';
import { cameraAt, clamp, ease, worldTransform } from './camera';
import type { Cam, CameraKey, Rect } from './types';

// MARK: - CameraView: world content seen through one camera in a w x h viewport

export const CameraView: React.FC<{ cam: Cam; w: number; h: number; children: React.ReactNode }> = ({ cam, w, h, children }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: worldTransform(cam, w, h) }}>{children}</div>
);

// MARK: - Split screen: two panels, each with its own camera (lifted from the 261104 share-link short)
// Panel A fills the frame until `from`; then panel B slides in (from the bottom for axis 'vertical' = stacked, from
// the right for 'horizontal' = side by side) over `dur` s until its edge sits at `at` px. A is clipped as B arrives.
// Camera A keys are in full-frame viewport coordinates; camera B keys in panel-B coordinates (its own w x h).

/** `until`: panel B slides back out, finishing at `until` (omit to keep the split to the end). */
export type SplitSpec = { from: number; dur: number; at: number; axis?: 'vertical' | 'horizontal'; until?: number };

export const splitProgress = (t: number, split: SplitSpec) => {
  const open = ease.inOut(interpolate(t, [split.from, split.from + split.dur], [0, 1], clamp));
  if (split.until === undefined) return open;
  return Math.min(open, 1 - ease.inOut(interpolate(t, [split.until - split.dur, split.until], [0, 1], clamp)));
};

/** Where panels A and B are at time t (output px). Use with LabelPill `panels` to put a pill on one panel. */
export const splitRects = (split: SplitSpec, t: number, width: number, height: number): { a: Rect; b: Rect } => {
  const p = splitProgress(t, split);
  if ((split.axis ?? 'vertical') === 'vertical') {
    const bTop = height - (height - split.at) * p;
    return { a: { left: 0, top: 0, width, height: bTop }, b: { left: 0, top: bTop, width, height: height - split.at } };
  }
  const bLeft = width - (width - split.at) * p;
  return { a: { left: 0, top: 0, width: bLeft, height }, b: { left: bLeft, top: 0, width: width - split.at, height } };
};

export const SplitScreen: React.FC<{
  split: SplitSpec;
  keysA: CameraKey[];
  keysB: CameraKey[];
  /** World content for panel A / panel B (e.g. <IPhone x={0} y={0}><Screen .../></IPhone>). */
  a: React.ReactNode;
  b: React.ReactNode;
  background?: string;
}> = ({ split, keysA, keysB, a, b, background }) => {
  const { fps, width, height } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const p = splitProgress(t, split);
  const r = splitRects(split, t, width, height);
  const vertical = (split.axis ?? 'vertical') === 'vertical';
  const bg = background ?? brandBackground();
  // A is clipped a few px under B's edge so B's shadow covers the seam.
  const clipA = vertical ? `inset(0 0 ${Math.max(0, height - r.b.top - 8)}px 0)` : `inset(0 ${Math.max(0, width - r.b.left - 8)}px 0 0)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: p > 0 ? clipA : undefined }}>
        <CameraView cam={cameraAt(t, keysA)} w={width} h={height}>
          {a}
        </CameraView>
      </AbsoluteFill>
      {p > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: r.b.left,
            top: r.b.top,
            width: r.b.width,
            height: r.b.height,
            overflow: 'hidden',
            background: bg,
            ...(vertical
              ? { borderTop: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: '0 -18px 40px rgba(20, 24, 40, 0.10)' }
              : { borderLeft: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: '-18px 0 40px rgba(20, 24, 40, 0.10)' }),
          }}
        >
          <CameraView cam={cameraAt(t, keysB)} w={r.b.width} h={r.b.height}>
            {b}
          </CameraView>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
