// MARK: - Shared timeline types (all times in output seconds unless noted)

/** Play `src` (path under public/) from `srcIn` to `srcOut` (source seconds), starting at output time `at`. */
export type Segment = {
  src: string;
  srcIn: number;
  srcOut: number;
  at: number;
  rate?: number;
  /** Dissolve in over the previous segment for this many seconds. */
  xfade?: number;
  /** Instead of a dissolve, the previous segment slides away (sheet dismiss / unlock swipe) over `xfade`. */
  reveal?: 'down' | 'up';
  /** `src` is an image; it holds until `until` (or the end of the composition). */
  still?: boolean;
  until?: number;
};

/** Virtual camera: world point (cx, cy) at the frame centre, zoom z (1 = 1 px per world unit). */
export type Cam = { cx: number; cy: number; z: number };

/** Camera keyframe. `dip` zooms out mid-move by that factor (a swoop). Default easing is cubic inOut. */
export type CameraKey = Cam & { t: number; dip?: number; ease?: 'inOut' | 'out' | 'linear' };

/** A VO clip: `name` matches a line in audio/vo/vo_lines.txt and public/vo/<name>.wav. */
export type VoClip = { name: string; at: number };

/** A label pill over the footage. `right` puts it top-right in landscape. `panel` targets a split-screen panel
 * (a key of LabelPill's `panels` rects, e.g. 'a' | 'b'). */
export type Label = { at: number; until: number; title: string; detail?: string; right?: boolean; panel?: string; top?: number; side?: number };

/** A screen-space rectangle in output pixels. */
export type Rect = { left: number; top: number; width: number; height: number };

/** A story beat: the unit the BRIEF and the timeline share. */
export type Beat = { name: string; from: number; to: number; vo?: VoClip; label?: Label; note?: string };

export type Ending = {
  markIn: number;
  phrases: string[];
  phraseTimes: number[];
  /** Call-to-action line under the phrases, e.g. 'ogmo.app' or 'On the App Store'. */
  cta?: string;
  /** When the CTA appears (default: last phrase time + 0.8 s). */
  ctaAt?: number;
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  /** Composition length in seconds. */
  end: number;
  vo: VoClip[];
  labels: Label[];
  ending?: Ending;
  /** 'mix' plays public/mix.wav (from mix.sh); 'vo' plays each public/vo/<name>.wav (rough cut before mixing). */
  audio: 'mix' | 'vo' | 'none';
  /** Screen segments exported to the timeline report, so mix.json room tracks ("segmentsOf") follow cuts and rates. */
  segments?: Segment[];
};

export const segEnd = (s: Segment, end = Infinity) =>
  s.still ? (s.until ?? end) : s.at + (s.srcOut - s.srcIn) / (s.rate ?? 1);
