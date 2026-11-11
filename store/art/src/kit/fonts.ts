// MARK: - Web fonts via @remotion/google-fonts (pinned 4.0.539 in package.json). Fonts download from Google at
// render time (network needed) and Remotion waits for them (no FOUT in frames). Static imports keep the bundle small:
//
//   // brand.ts
//   import * as DMSans from '@remotion/google-fonts/DMSans';
//   import * as InstrumentSerif from '@remotion/google-fonts/InstrumentSerif';
//   const BODY = googleFont(DMSans, { weights: ['400', '500', '600', '700'] });
//   const SERIF = googleFont(InstrumentSerif, { weights: ['400'], italic: true });
//   export const BRAND = { ..., font: fontStack(BODY), fonts: { headline: fontStack(SERIF, 'Georgia, serif') } };
//
// Module names are the family without spaces (see node_modules/@remotion/google-fonts/dist/cjs/<Name>.js).

export const SYSTEM_STACK = '-apple-system, "SF Pro Display", system-ui, "Helvetica Neue", "Segoe UI", Roboto, sans-serif';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FontModule = { loadFont: (style?: any, options?: any) => { fontFamily: string } };

export type GoogleFontOptions = { weights?: string[]; subsets?: string[]; italic?: boolean };

/** Load a Google font (normal, plus italic when asked) and return its CSS family name. Call at module level. */
export const googleFont = (mod: FontModule, opts: GoogleFontOptions = {}): string => {
  const o = { weights: opts.weights ?? ['400', '500', '600', '700'], subsets: opts.subsets ?? ['latin'] };
  const { fontFamily } = mod.loadFont('normal', o);
  if (opts.italic) mod.loadFont('italic', o);
  return fontFamily;
};

/** `"Family", <fallback>` for a CSS font-family value. */
export const fontStack = (family: string, fallback = SYSTEM_STACK) => `"${family}", ${fallback}`;
