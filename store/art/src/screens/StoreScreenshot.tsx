import React, { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from 'remotion';
import { ART, Lang } from '../store/tokens';
import { BG, CANVAS, HEADLINES, LAYOUT, RAW_NAMES, ShotNo } from './spec';

type Rect = { x: number; y: number; w: number; h: number };
const rectOf = (r: DOMRect): Rect => ({ x: r.x, y: r.y, w: r.width, h: r.height });

// Slim graphite iPhone (Dynamic Island is part of the capture itself), after the kit's IPhone: gradient body, thin rim, side buttons.
const Phone: React.FC<{ left: number; top: number; layout: typeof LAYOUT; children: React.ReactNode }> = ({ left, top, layout, children }) => {
  const { screenW, screenH, bezel, screenRadius } = layout;
  const k = screenW / LAYOUT.screenW; // side buttons and rim scale with the phone
  const outerW = screenW + bezel * 2;
  const outerH = screenH + bezel * 2;
  const buttons = (
    [
      { side: 'left', top: 300, h: 70 },
      { side: 'left', top: 420, h: 130 },
      { side: 'left', top: 580, h: 130 },
      { side: 'right', top: 470, h: 190 },
    ] as const
  ).map((b) => ({ ...b, top: b.top * k, h: b.h * k }));
  return (
    <div data-bbox="phone" style={{ position: 'absolute', left, top, width: outerW, height: outerH }}>
      {buttons.map((b, i) => (
        <div key={i} style={{ position: 'absolute', top: b.top, height: b.h, width: 8 * k, [b.side]: -8 * k, borderRadius: 4 * k, background: 'linear-gradient(90deg, #7d8087, #b9bcc2)' }} />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: screenRadius + bezel,
          background: 'linear-gradient(145deg, #4a4b50 0%, #26272b 38%, #151517 100%)',
          boxShadow: '0 0 0 3px #a9acb3, 0 0 0 5px #d3d5da, 0 50px 110px rgba(28, 28, 30, 0.22), 0 14px 36px rgba(28, 28, 30, 0.14)',
        }}
      />
      <div style={{ position: 'absolute', left: bezel, top: bezel, width: screenW, height: screenH, borderRadius: screenRadius, overflow: 'hidden', background: '#000', isolation: 'isolate' }}>
        {children}
      </div>
    </div>
  );
};

export const StoreScreenshot: React.FC<{ lang: Lang; no: ShotNo }> = ({ lang, no }) => {
  const { width, height } = CANVAS;
  const L = LAYOUT;
  const root = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender('measure screenshot'));
  const text = HEADLINES[no][lang];

  useEffect(() => {
    (async () => {
      await document.fonts.ready;
      const img = root.current!.querySelector('img') as HTMLImageElement;
      await img.decode().catch(() => {});
      const boxes: Record<string, Rect> = {};
      root.current!.querySelectorAll('[data-bbox]').forEach((el) => {
        boxes[(el as HTMLElement).dataset.bbox!] = rectOf(el.getBoundingClientRect());
      });
      // Real text extents: union of the per-line rects of the headline's text node (not the wide container).
      const h1 = root.current!.querySelector('[data-headline]')!;
      const range = document.createRange();
      range.selectNodeContents(h1);
      const lineRects = Array.from(range.getClientRects()).map(rectOf);
      const tops = new Set(lineRects.map((r) => Math.round(r.y)));
      const x0 = Math.min(...lineRects.map((r) => r.x));
      const y0 = Math.min(...lineRects.map((r) => r.y));
      const x1 = Math.max(...lineRects.map((r) => r.x + r.w));
      const y1 = Math.max(...lineRects.map((r) => r.y + r.h));
      boxes.headlineText = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      const layout = {
        lang, no, width, height,
        fontOk: document.fonts.check('700 100px "SF Pro Display"'),
        lines: tops.size,
        boxes,
        img: { natW: img.naturalWidth, natH: img.naturalHeight, w: boxes.shot.w, h: boxes.shot.h },
      };
      console.log('SHOT_LAYOUT ' + JSON.stringify(layout));
      continueRender(handle);
    })();
  }, [handle, lang, no, width, height]);

  const outerW = L.screenW + L.bezel * 2;
  return (
    <AbsoluteFill ref={root} style={{ fontFamily: ART.font, overflow: 'hidden', background: `linear-gradient(180deg, ${BG.top} 0%, ${BG.bottom} 100%)` }}>
      {/* one very soft warm tint, decorative only */}
      <div style={{ position: 'absolute', left: width - 760, top: 120, width: 1300, height: 1300, borderRadius: '50%', background: `radial-gradient(circle at 50% 50%, ${BG.tint} 0%, rgba(253,235,223,0) 68%)` }} />

      <div style={{ position: 'absolute', left: 0, top: 0, width, height: L.zoneH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div
          data-bbox="headline"
          data-headline
          style={{
            width: L.headlineMaxW,
            textAlign: 'center',
            textWrap: 'balance',
            fontSize: L.headlineSize,
            fontWeight: 700,
            letterSpacing: -L.headlineSize * 0.022,
            lineHeight: L.headlineLineHeight,
            color: ART.text,
          }}
        >
          {text}
        </div>
        {/* thin orange accent, never text */}
        <div data-bbox="accent" style={{ marginTop: 34, width: 112, height: 10, borderRadius: 5, background: ART.accent }} />
      </div>

      <Phone left={(width - outerW) / 2} top={L.phoneTop} layout={L}>
        <Img
          data-bbox="shot"
          src={staticFile(`shots/${lang}/${RAW_NAMES[no]}.png`)}
          style={{ display: 'block', width: L.screenW, height: L.screenH }}
        />
      </Phone>
    </AbsoluteFill>
  );
};
