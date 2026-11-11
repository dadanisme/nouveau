import { anchorKeys, anchorLabels, anchorSegments } from '../kit/anchors';
import type { SpotlightSpec, StillHold, Whip } from '../kit/Effects';
import type { SplitSpec } from '../kit/Panels';
import { cutsToSegments, timeMap } from '../kit/timeMap';
import type { CameraKey, Segment, Timeline, VoClip } from '../kit/types';
// Timeline modules import only PURE kit files (anchors, timeMap, types, readability) or `import type`: export-timeline.mjs
// bundles them in plain Node, where React/Remotion components can't load.

// MARK: - Example timeline (placeholder media from make-placeholders.sh). Copy this file per video.

const VO: VoClip[] = [
  { name: 'example_1', at: 0.6 },
  { name: 'example_2', at: 6.4 },
  { name: 'example_3', at: 13.0 },
];

export const TIMELINE: Timeline = {
  fps: 30,
  width: 1920,
  height: 1080,
  end: 18.0,
  audio: 'mix',
  vo: VO,
  // Word anchors: the browser pill lands as the VO says "Open" (see kit/anchors.ts).
  labels: anchorLabels(
    [
      { at: 1.0, until: 5.6, title: 'Live notes', detail: 'every speaker labeled', panel: 'a' },
      { at: { vo: 'example_2', word: 'open', offset: 0.3 }, until: 12.0, title: 'In the browser', detail: 'no install', right: true },
    ],
    VO,
  ),
  ending: { markIn: 12.8, phrases: ['Every word.', 'Everywhere.'], phraseTimes: [13.9, 14.9], cta: 'acme.example' },
};

const PHONE_CLIP = 'placeholder/phone.mp4';
const DESKTOP_CLIP = 'placeholder/desktop.mp4';

// MARK: - World layout (world units)

export const WORLD = {
  android: { x: -560, y: 0 },
  iphone: { x: 0, y: 0 },
  // pageWidth/pageHeight = the take's viewport (placeholder desktop.mp4 is 1600x1000); h crops the page bottom.
  browser: { cx: 1250, cy: -20, w: 1500, h: 960, url: 'acme.example/notes', pageWidth: 1600, pageHeight: 1000 },
  card: { cx: 1250, cy: 720, w: 760, h: 240 },
  mac: { cx: 3200, cy: -40 },
};

// MARK: - Screen segments

export const IPHONE_SEGMENTS: Segment[] = [
  { src: PHONE_CLIP, srcIn: 0, srcOut: 6, at: 0 },
  { src: PHONE_CLIP, srcIn: 8, srcOut: 20, at: 5.6, xfade: 0.4, reveal: 'up' },
];
export const ANDROID_SEGMENTS: Segment[] = [{ src: PHONE_CLIP, srcIn: 2, srcOut: 20, at: 0 }];
// The browser cuts to its second take on "notes" in "the same notes follow you".
export const BROWSER_SEGMENTS = anchorSegments(
  [
    { src: DESKTOP_CLIP, srcIn: 0, srcOut: 7, at: 0 },
    { src: DESKTOP_CLIP, srcIn: 9, srcOut: 20, at: { vo: 'example_2', word: 'notes', offset: -0.2 }, xfade: 0.35 },
  ],
  VO,
  'BROWSER_SEGMENTS',
);
export const CARD_SEGMENTS: Segment[] = [{ src: DESKTOP_CLIP, srcIn: 4, srcOut: 20, at: 0 }];
// Cuts laid end to end (starts computed), with a slowed middle cut; timeMap turns source times into output times.
export const MAC_SEGMENTS: Segment[] = cutsToSegments(DESKTOP_CLIP, [[3, 6], { srcIn: 8, srcOut: 10, rate: 0.5 }, [12, 20]]);
const MAC_TIME = timeMap(MAC_SEGMENTS);

// MARK: - Effects: crisp 2x still over the Mac footage (cursor redrawn), spotlight on the browser, whip on the swoop

export const STILL_HOLDS: StillHold[] = [
  { src: 'placeholder/desktop_2x.png', from: MAC_TIME.out(16.5), to: MAC_TIME.out(16.5) + 1.2, fade: 0.2, cursor: [800, 500] },
];
export const SPOTLIGHT: SpotlightSpec = { from: 8.2, to: 10.4, ramp: 0.5, world: [1250, -20], radius: 420, edgeFade: 'right' };
export const WHIPS: Whip[] = [{ from: 10.3, to: 11.1, px: 6, ramp: 0.3 }];

// Portrait only: the frame splits (iPhone on top, Android phone below), each panel with its own camera.
export const P_SPLIT: SplitSpec = { from: 3.2, dur: 0.6, at: 980, until: 6.1 };
export const P_KEYS_B: CameraKey[] = [
  { t: 3.2, cx: -560, cy: 0, z: 0.98 },
  { t: 6.1, cx: -560, cy: -40, z: 1.06 },
];

// MARK: - Camera keys (landscape 1920x1080 and portrait 1080x1920)

// Two keys are anchored to VO words: the push-in on the iPhone lands on "captioned", the swoop to the
// browser lands just after "browser". Re-timing the VO (speed, new take) moves them with the words.
export const KEYS = anchorKeys(
  [
    { t: 0.0, cx: -280, cy: 0, z: 0.95 },
    { t: { vo: 'example_1', word: 'captioned', offset: 0.4 }, cx: 0, cy: -60, z: 1.5 },
    { t: 5.0, cx: 0, cy: -40, z: 1.56 },
    { t: 6.2, cx: -560, cy: 0, z: 1.3 },
    { t: { vo: 'example_2', word: 'browser', offset: 0.5 }, cx: 1250, cy: 60, z: 0.92, dip: 1.5 },
    { t: 10.0, cx: 1250, cy: 20, z: 1.0 },
    { t: 11.2, cx: 3200, cy: -40, z: 0.95, dip: 1.4 },
    { t: 12.8, cx: 3200, cy: -40, z: 1.0 },
  ],
  VO,
  'KEYS',
);

export const P_KEYS: CameraKey[] = [
  { t: 0.0, cx: 0, cy: 0, z: 1.55 },
  { t: 3.0, cx: 0, cy: -120, z: 2.0 },
  { t: 5.0, cx: 0, cy: -100, z: 2.05 },
  { t: 6.2, cx: -560, cy: 0, z: 1.6 },
  { t: 7.6, cx: 1250, cy: 200, z: 0.62, dip: 1.4 },
  { t: 9.0, cx: 1000, cy: -250, z: 1.3 },
  { t: 10.4, cx: 1450, cy: -250, z: 1.3 },
  { t: 11.4, cx: 3200, cy: -40, z: 0.6, dip: 1.3 },
  { t: 12.8, cx: 3200, cy: -40, z: 0.64 },
];

export const WORLD_OUT = { from: 12.6, to: 13.6 };

// Segments exported to the timeline report (mix.json room tracks can follow them with "segmentsOf").
TIMELINE.segments = [...BROWSER_SEGMENTS, ...MAC_SEGMENTS];
