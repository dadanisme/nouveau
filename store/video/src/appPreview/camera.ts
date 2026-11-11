import type { CameraKey } from '../kit/types';
import { END, SEGMENTS } from './timeline';

// v4: ONE camera shared by every layer, so the layers stay aligned (a per-layer scale ghosted the text of identical screens during
// a dissolve). Inside every crossfade the push eases 1.00-ish -> 1.03 (inOut); between crossfades it relaxes slowly back toward 1.00
// (0.008 per s, never below 1.00), so the zoom never resets under a cut. The first beat drifts in 1.00 -> ~1.02 before its crossfade.
// Zoom never exceeds 1.03, so the toolbar buttons and status bar stay inside the frame; cx/cy stay 0.
export const PUSH_Z = 1.03;
const RELAX = 0.008;
const OPEN_DRIFT = 0.005;
const r = (n: number) => Math.round(n * 1000) / 1000;

const build = (): CameraKey[] => {
  const keys: CameraKey[] = [{ t: 0, cx: 0, cy: 0, z: 1.0 }];
  let lastT = 0;
  let lastZ = 1.0;
  let first = true;
  for (const s of SEGMENTS) {
    if (!s.xfade) continue;
    const a0 = s.at;
    const a1 = s.at + s.xfade;
    const z0 = first ? 1 + OPEN_DRIFT * a0 : Math.max(1.0, lastZ - RELAX * (a0 - lastT));
    keys.push({ t: r(a0), cx: 0, cy: 0, z: r(z0), ease: 'linear' });
    keys.push({ t: r(a1), cx: 0, cy: 0, z: PUSH_Z });
    lastT = a1;
    lastZ = PUSH_Z;
    first = false;
  }
  keys.push({ t: r(END), cx: 0, cy: 0, z: r(Math.max(1.0, lastZ - RELAX * (END - lastT))), ease: 'linear' });
  return keys;
};
export const KEYS: CameraKey[] = build();
