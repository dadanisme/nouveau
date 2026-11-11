import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { clamp, ease } from './camera';
import type { Cam } from './types';

// MARK: - Effects lifted from the 261104 site tour: spotlight dim, whip-pan blur, 2x still holds with a redrawn cursor

/** 0..1 envelope: ramps in over `ramp` after `from`, out over `ramp` before `to`. */
export const envelope = (t: number, from: number, to: number, ramp: number) =>
  Math.min(interpolate(t, [from, from + ramp], [0, 1], clamp), interpolate(t, [to - ramp, to], [1, 0], clamp));

// MARK: - Spotlight: radial dim around a WORLD point that follows the camera

export type SpotlightSpec = {
  from: number;
  to: number;
  ramp: number;
  /** World point kept bright. */
  world: [number, number];
  /** Bright radius in output px at zoom `refZoom` (scales with the camera zoom). */
  radius: number;
  refZoom?: number;
  /** Dim colour (rgb, no alpha) and its strength 0..1. */
  color?: [number, number, number];
  strength?: number;
  /** Also fade one frame edge (e.g. over a mockup with placeholder text). */
  edgeFade?: 'right' | 'left' | null;
};

export const Spotlight: React.FC<{ spec: SpotlightSpec; cam: Cam }> = ({ spec, cam }) => {
  const { fps, width, height } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const o = envelope(t, spec.from, spec.to, spec.ramp);
  if (o <= 0) return null;
  const [r0, g0, b0] = spec.color ?? [20, 20, 30];
  const a = spec.strength ?? 0.75;
  const sx = (spec.world[0] - cam.cx) * cam.z + width / 2;
  const sy = (spec.world[1] - cam.cy) * cam.z + height / 2;
  const r = spec.radius * (cam.z / (spec.refZoom ?? cam.z));
  const dim = `rgba(${r0},${g0},${b0},${a})`;
  const clear = `rgba(${r0},${g0},${b0},0)`;
  const layers = [`radial-gradient(circle at ${sx}px ${sy}px, ${clear} ${r}px, ${dim} ${r * 1.4}px)`];
  if (spec.edgeFade) layers.unshift(`linear-gradient(to ${spec.edgeFade}, ${clear} 78%, ${dim} 96%)`);
  return <AbsoluteFill style={{ opacity: o, background: layers.join(', '), pointerEvents: 'none' }} />;
};

// MARK: - Whip-pan blur: px of blur to add to the world layer's filter during fast camera moves

export type Whip = { from: number; to: number; px: number; ramp: number };

export const whipBlur = (t: number, whips: Whip[]) => whips.reduce((m, w) => Math.max(m, w.px * ease.inOut(envelope(t, w.from, w.to, w.ramp))), 0);

// MARK: - Cursor: the arrow web-take.mjs draws during capture (redrawn over stills so it never vanishes)

export const Cursor: React.FC<{ x: number; y: number; size?: number }> = ({ x, y, size = 28 }) => (
  <div style={{ position: 'absolute', left: x - (5 * size) / 28, top: y - (3 * size) / 28, width: size, height: size, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.35))' }}>
    <svg width={size} height={size} viewBox="0 0 28 28">
      <path d="M5 3 L5 22 L10 17.5 L13.5 25 L17 23.5 L13.5 16 L20 16 Z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  </div>
);

// MARK: - Still holds: a crisp 2x still (same scroll + mouse point as the take) faded over PAUSED video, so a
// push-in past ~1.8x stays sharp. Keep each hold < 2.5 s or keep the camera drifting: a hold with nothing moving
// reads as a slide (check.sh motion).

export type StillHold = { src: string; from: number; to: number; fade: number; cursor?: [number, number] };

/** Render inside the same box as the footage (e.g. a BrowserWindow page). width/height = the page px of the take. */
export const StillHolds: React.FC<{ holds: StillHold[]; width: number; height: number }> = ({ holds, width, height }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  return (
    <>
      {holds.map((h) => {
        if (t < h.from || t >= h.to) return null;
        return (
          // zIndex above Screen's segment layers (they use zIndex 1-2)
          <div key={`${h.src}@${h.from}`} style={{ position: 'absolute', left: 0, top: 0, width, height, zIndex: 5, opacity: envelope(t, h.from, h.to, h.fade) }}>
            <Img src={staticFile(h.src)} style={{ width, height, display: 'block' }} />
            {h.cursor ? <Cursor x={h.cursor[0]} y={h.cursor[1]} /> : null}
          </div>
        );
      })}
    </>
  );
};
