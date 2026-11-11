import type { Cam, CameraKey } from './types';

// MARK: - Easing

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
export const ease = { inOut: easeInOut, out: easeOut, linear: (p: number) => p };

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// MARK: - Keyframe camera: position eased, zoom interpolated in log space (constant perceived speed), optional dip

export const cameraAt = (t: number, keys: CameraKey[]): Cam => {
  if (keys.length === 0) return { cx: 0, cy: 0, z: 1 };
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t < b.t) {
      const p = (t - a.t) / (b.t - a.t);
      const e = ease[b.ease ?? 'inOut'](p);
      const logZ = Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e;
      const dip = b.dip ? Math.log(b.dip) * Math.sin(Math.PI * e) : 0;
      return { cx: a.cx + (b.cx - a.cx) * e, cy: a.cy + (b.cy - a.cy) * e, z: Math.exp(logZ - dip) };
    }
  }
  return keys[keys.length - 1];
};

/** CSS transform that maps world coordinates into a w x h viewport through `cam`. Apply with transformOrigin '0 0'. */
export const worldTransform = (cam: Cam, w: number, h: number) =>
  `translate(${w / 2}px, ${h / 2}px) scale(${cam.z}) translate(${-cam.cx}px, ${-cam.cy}px)`;
