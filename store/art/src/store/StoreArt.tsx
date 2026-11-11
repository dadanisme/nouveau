import React, { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from 'remotion';
import { ART, COPY, Kind, Lang, SIZES } from './tokens';

type Rect = { x: number; y: number; w: number; h: number };

const Lockup: React.FC<{ mark: number; size: number }> = ({ mark, size }) => (
  <div data-bbox="lockup" style={{ display: 'flex', alignItems: 'center', gap: mark * 0.32, width: 'max-content' }}>
    <Img src={staticFile('art/mark.svg')} style={{ width: mark, height: mark, display: 'block' }} />
    <div style={{ fontSize: size, fontWeight: 700, letterSpacing: -size * 0.01, color: ART.text, lineHeight: 1 }}>Nouveau</div>
  </div>
);

export type Variant = 'couple' | 'family';

// Per-variant layout. aspect = viewBox w/h of the hero svg; header.w / search.w = hero width in px (height follows the aspect).
const VARIANTS: Record<Variant, {
  src: string;
  aspect: number;
  header: { head: number; sub: number; w: number };
  search: { w: number };
}> = {
  couple: { src: 'art/hero-couple.svg', aspect: 1020 / 930, header: { head: 118, sub: 54, w: 1400 }, search: { w: 1180 } },
  family: { src: 'art/hero-family.svg', aspect: 1180 / 950, header: { head: 116, sub: 54, w: 1420 }, search: { w: 1280 } },
};

export const StoreArt: React.FC<{ lang: Lang; kind: Kind; variant?: Variant }> = ({ lang, kind, variant = 'couple' }) => {
  const V = VARIANTS[variant];
  const { width, height } = SIZES[kind];
  const copy = COPY[kind][lang];
  const root = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender('measure store art'));
  const header = kind === 'header';

  const headSize = header ? V.header.head : 176;
  const subSize = header ? V.header.sub : 66;

  useEffect(() => {
    (async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(root.current!.querySelectorAll('img')).map((i) => (i as HTMLImageElement).decode().catch(() => {})));
      const boxes: Record<string, Rect> = {};
      root.current!.querySelectorAll('[data-bbox]').forEach((el) => {
        const r = el.getBoundingClientRect();
        boxes[(el as HTMLElement).dataset.bbox!] = { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      // the illustration's real content must sit inside its own viewBox (nothing clipped)
      const svgText = await (await fetch(staticFile(V.src))).text();
      const holder = document.createElement('div');
      holder.style.cssText = 'position:absolute;left:-9999px;top:0;width:2000px;height:2000px;visibility:hidden';
      holder.innerHTML = svgText;
      document.body.appendChild(holder);
      const svgEl = holder.querySelector('svg')!;
      const vb = svgEl.viewBox.baseVal;
      const cb = svgEl.getBBox(); // union of all content, children's transforms applied (fills only, strokes excluded)
      const artFit = { vb: [vb.x, vb.y, vb.width, vb.height], content: [cb.x, cb.y, cb.width, cb.height] };
      document.body.removeChild(holder);
      const fontOk = document.fonts.check('700 100px "SF Pro Display"');
      console.log('STORE_LAYOUT ' + JSON.stringify({ kind, lang, width, height, fontOk, boxes, artFit }));
      continueRender(handle);
    })();
  }, [handle, kind, lang, width, height, V.src]);

  const headline = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: header ? 'flex-start' : 'center', gap: 0 }}>
      {copy.headline.map((line, i) => (
        <div
          key={i}
          data-bbox={`headline${i + 1}`}
          style={{ fontSize: headSize, fontWeight: 700, letterSpacing: -headSize * 0.022, lineHeight: 1.1, color: ART.text, width: 'max-content', whiteSpace: 'nowrap' }}
        >
          {line}
        </div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill ref={root} style={{ background: ART.white, fontFamily: ART.font, overflow: 'hidden' }}>
      {/* decorative background only (not content): grouped-gray discs bleeding off the canvas */}
      <div style={{ position: 'absolute', left: -width * 0.16, bottom: -height * 0.42, width: width * 0.5, height: width * 0.5, borderRadius: '50%', background: ART.grouped }} />
      <div style={{ position: 'absolute', right: -width * 0.1, top: -height * 0.5, width: width * 0.4, height: width * 0.4, borderRadius: '50%', background: ART.grouped }} />

      {header ? (
        <>
          <div style={{ position: 'absolute', left: SIZES.header.safe.x0 + 18, top: 0, height, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Lockup mark={104} size={78} />
            <div style={{ height: 56 }} />
            {headline}
            <div style={{ height: 40 }} />
            <div data-bbox="subline" style={{ fontSize: subSize, fontWeight: 500, color: ART.textSecondary, lineHeight: 1.2, width: 'max-content', whiteSpace: 'nowrap' }}>
              {copy.subline}
            </div>
          </div>
          <Img data-bbox="hero" src={staticFile(V.src)} style={{ position: 'absolute', left: SIZES.header.safe.x1 - 18 - V.header.w, top: (height - V.header.w / V.aspect) / 2, width: V.header.w, height: V.header.w / V.aspect }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Lockup mark={112} size={84} />
          <div style={{ height: 56 }} />
          {headline}
          <div style={{ height: 48 }} />
          <Img data-bbox="hero" src={staticFile(V.src)} style={{ width: V.search.w, height: V.search.w / V.aspect, display: 'block' }} />
        </div>
      )}
    </AbsoluteFill>
  );
};
