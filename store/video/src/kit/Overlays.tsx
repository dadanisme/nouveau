import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND } from './brand';
import { clamp, ease } from './camera';
import { safe } from './safeZones';
import type { Ending, Label, Rect } from './types';

// MARK: - Label pill (top of frame over the footage; captions own the bottom)

// `panels` (e.g. splitRects(...) from Panels.tsx): a label with `panel: 'b'` sits at that panel's top-left instead of
// the frame's (a panel touching the frame top keeps the safe-zone top inset).
export const LabelPill: React.FC<{ labels: Label[]; portrait?: boolean; panels?: Record<string, Rect> }> = ({ labels, portrait = false, panels }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const zone = safe(portrait);
  const active = labels.find((l) => t >= l.at && t < l.until);
  if (!active) return null;
  const rect = active.panel ? panels?.[active.panel] : undefined;
  const place: React.CSSProperties = rect
    ? { left: rect.left + zone.pillSide, top: rect.top + (rect.top <= 0 ? zone.pillTop : 32) }
    : { ...(active.right ? { right: active.side ?? zone.pillSide } : { left: active.side ?? zone.pillSide }), top: active.top ?? zone.pillTop };
  const inP = ease.out(interpolate(t, [active.at, active.at + 0.55], [0, 1], clamp));
  const outP = interpolate(t, [active.until - 0.4, active.until], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        ...place,
        opacity: Math.min(inP, outP),
        transform: `translateY(${(1 - inP) * -14}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: portrait ? '9px 24px 9px 18px' : '15px 26px 15px 20px',
        borderRadius: 999,
        background: BRAND.pillBg,
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 10px 30px rgba(20, 24, 40, 0.12), 0 2px 6px rgba(20, 24, 40, 0.06)',
        backdropFilter: 'blur(18px)',
        fontFamily: BRAND.font,
        fontSize: portrait ? 30 : 30,
        letterSpacing: -0.2,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ width: 11, height: 11, borderRadius: 6, background: BRAND.accent }} />
      <span style={{ fontWeight: 650, color: BRAND.text }}>{active.title}</span>
      {active.detail ? (
        <>
          <span style={{ color: BRAND.textTertiary, fontWeight: 500 }}>·</span>
          <span style={{ fontWeight: 500, color: BRAND.textSecondary }}>{active.detail}</span>
        </>
      ) : null}
    </div>
  );
};

// MARK: - App icon (BRAND.iconPath, or a rounded accent tile with the initial)

export const AppIcon: React.FC<{ size: number }> = ({ size }) => {
  const radius = size * 0.225;
  const shadow = '0 16px 40px rgba(20, 24, 40, 0.22)';
  if (BRAND.iconPath) {
    return <Img src={staticFile(BRAND.iconPath)} style={{ width: size, height: size, borderRadius: radius, boxShadow: shadow }} />;
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        boxShadow: shadow,
        background: `linear-gradient(145deg, ${BRAND.accent}, ${BRAND.text})`,
        color: '#fff',
        fontFamily: BRAND.font,
        fontWeight: 700,
        fontSize: size * 0.52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {BRAND.appName.slice(0, 1)}
    </div>
  );
};

// MARK: - Final wordmark (the only full-frame card). It keeps drifting so the ending is never a frozen frame.
// Options: mark 'icon' (app icon + name, default) | 'logo' (BRAND.logoPath image instead of icon + name) | 'name';
// headlineFont (default BRAND.fonts.headline || BRAND.font, e.g. a site's serif); accent 'lastPhrase' (default: last
// phrase in the accent colour) | 'lastWord' (last word of the last phrase, accent colour + italic headline font) |
// 'none'; ending.cta adds a call-to-action line ('ogmo.app', 'On the App Store') at ending.ctaAt.

export type WordmarkProps = {
  ending: Ending;
  portrait?: boolean;
  mark?: 'icon' | 'logo' | 'name';
  headlineFont?: string;
  accent?: 'lastPhrase' | 'lastWord' | 'none';
  /** Headline weight (a display serif usually wants 400). */
  headlineWeight?: number;
};

export const Wordmark: React.FC<WordmarkProps> = ({ ending, portrait = false, mark = 'icon', headlineFont, accent = 'lastPhrase', headlineWeight }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  if (t < ending.markIn) return null;
  const end = durationInFrames / fps;
  const head = headlineFont || BRAND.fonts.headline || BRAND.font;
  const serifHead = head !== BRAND.font;
  const p = ease.out(interpolate(t, [ending.markIn, ending.markIn + 1.1], [0, 1], clamp));
  const drift = interpolate(t, [ending.markIn, end], [0, 1], clamp); // slow push-in until the last frame
  const last = ending.phrases.length - 1;
  const ctaAt = ending.ctaAt ?? (ending.phraseTimes[last] ?? ending.markIn + 1 + last) + 0.8;
  const c = ease.out(interpolate(t, [ctaAt, ctaAt + 0.6], [0, 1], clamp));
  const nameSize = portrait ? 150 : 124;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: BRAND.font,
        paddingBottom: portrait ? 260 : 0,
        transform: `scale(${1 + 0.05 * drift})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          alignItems: 'center',
          gap: portrait ? 30 : 34,
          opacity: p,
          transform: `translateY(${(1 - p) * 30}px) scale(${0.96 + 0.04 * p})`,
        }}
      >
        {mark === 'logo' && BRAND.logoPath ? (
          <Img src={staticFile(BRAND.logoPath)} style={{ height: portrait ? 240 : 170, width: 'auto', display: 'block' }} />
        ) : (
          <>
            {mark === 'icon' ? <AppIcon size={portrait ? 220 : 150} /> : null}
            <div
              style={{
                fontFamily: head,
                fontSize: serifHead ? nameSize * 1.25 : nameSize,
                fontWeight: headlineWeight ?? (serifHead ? 400 : 700),
                letterSpacing: serifHead ? -3 : -4,
                color: BRAND.text,
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {BRAND.appName}
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: portrait ? 'column' : 'row', alignItems: 'center', gap: portrait ? 18 : 30, marginTop: portrait ? 64 : 54, minHeight: portrait ? undefined : 50 }}>
        {ending.phrases.map((phrase, i) => {
          const at = ending.phraseTimes[i] ?? ending.markIn + 1 + i;
          const q = ease.out(interpolate(t, [at, at + 0.6], [0, 1], clamp));
          const size = portrait ? 50 : 38;
          const words = phrase.split(' ');
          const tail = accent === 'lastWord' && i === last ? words.pop() : undefined;
          return (
            <div
              key={phrase}
              style={{
                fontSize: size,
                fontWeight: 500,
                letterSpacing: -0.4,
                color: accent === 'lastPhrase' && i === last ? BRAND.accent : BRAND.textSecondary,
                opacity: q,
                transform: `translateY(${(1 - q) * 12}px)`,
                whiteSpace: 'nowrap',
              }}
            >
              {tail === undefined ? (
                phrase
              ) : (
                <>
                  {words.join(' ')}{' '}
                  <span style={{ fontFamily: head, fontStyle: 'italic', fontSize: size * 1.26, color: BRAND.accent, letterSpacing: 0 }}>{tail}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
      {ending.cta ? (
        <div
          style={{
            marginTop: portrait ? 56 : 44,
            padding: portrait ? '16px 34px' : '12px 28px',
            borderRadius: 999,
            border: `2px solid ${BRAND.accent}`,
            color: BRAND.accent,
            fontSize: portrait ? 40 : 30,
            fontWeight: 600,
            letterSpacing: -0.2,
            opacity: c,
            transform: `translateY(${(1 - c) * 10}px)`,
            whiteSpace: 'nowrap',
          }}
        >
          {ending.cta}
        </div>
      ) : null}
    </div>
  );
};
