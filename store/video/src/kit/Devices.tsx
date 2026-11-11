import React from 'react';
import { BRAND } from './brand';

// Device frames in WORLD units. Each takes a centre (x/cx, y/cy) and renders `children` into the screen.
// Screen sizes match common capture aspect ratios so recordings fill them with objectFit: cover.

export const PHONE = { screenW: 404.8, screenH: 880, bezel: 13, radius: 70 }; // iPhone 6.3" (1206x2622)
export const ANDROID = { screenW: 396, screenH: 880, bezel: 11, radius: 46 }; // Pixel-like 20:9
export const MAC = { screenW: 1600, screenH: 1000, bezel: 18 }; // MacBook 16:10

type Placed = { x: number; y: number; scale?: number; opacity?: number; children: React.ReactNode };

const ContactShadow: React.FC<{ inset: number; bottom: number; blur: number; alpha?: number }> = ({ inset, bottom, blur, alpha = 0.22 }) => (
  <div
    style={{
      position: 'absolute',
      left: inset,
      right: inset,
      bottom,
      height: 60,
      borderRadius: '50%',
      background: `rgba(30, 32, 40, ${alpha})`,
      filter: `blur(${blur}px)`,
    }}
  />
);

const ScreenClip: React.FC<{ left: number; top: number; w: number; h: number; radius: number | string; bg?: string; children: React.ReactNode }> = ({
  left,
  top,
  w,
  h,
  radius,
  bg = '#000',
  children,
}) => (
  // isolation keeps the clip on its own layer so rounded corners stay crisp under scale
  <div style={{ position: 'absolute', left, top, width: w, height: h, borderRadius: radius, overflow: 'hidden', background: bg, isolation: 'isolate' }}>
    {children}
  </div>
);

// MARK: - iPhone

export const IPhone: React.FC<Placed> = ({ x, y, scale = 1, opacity = 1, children }) => {
  const outerW = PHONE.screenW + PHONE.bezel * 2;
  const outerH = PHONE.screenH + PHONE.bezel * 2;
  return (
    <div style={{ position: 'absolute', left: x - outerW / 2, top: y - outerH / 2, width: outerW, height: outerH, transform: `scale(${scale})`, opacity }}>
      <ContactShadow inset={30} bottom={-28} blur={26} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: PHONE.radius,
          background: 'linear-gradient(145deg, #3a3b40 0%, #16171a 40%, #0b0b0d 100%)',
          boxShadow: '0 0 0 2.5px #c9cbd1, 0 0 0 3.5px #9ea1a8, 0 30px 70px rgba(20, 24, 40, 0.20), 0 8px 20px rgba(20, 24, 40, 0.12)',
        }}
      />
      {[
        { side: 'left', top: 170, h: 34 },
        { side: 'left', top: 225, h: 62 },
        { side: 'left', top: 300, h: 62 },
        { side: 'right', top: 250, h: 92 },
      ].map((b, i) => (
        <div key={i} style={{ position: 'absolute', top: b.top, height: b.h, width: 5, [b.side]: -7, borderRadius: 3, background: 'linear-gradient(90deg, #a7aab1, #d6d8dd)' }} />
      ))}
      <ScreenClip left={PHONE.bezel} top={PHONE.bezel} w={PHONE.screenW} h={PHONE.screenH} radius={PHONE.radius - PHONE.bezel}>
        {children}
      </ScreenClip>
    </div>
  );
};

// MARK: - Android phone (generic Pixel-like: flat sides, punch-hole camera, buttons on the right)

export const AndroidPhone: React.FC<Placed & { punchHole?: boolean }> = ({ x, y, scale = 1, opacity = 1, punchHole = true, children }) => {
  const outerW = ANDROID.screenW + ANDROID.bezel * 2;
  const outerH = ANDROID.screenH + ANDROID.bezel * 2;
  return (
    <div style={{ position: 'absolute', left: x - outerW / 2, top: y - outerH / 2, width: outerW, height: outerH, transform: `scale(${scale})`, opacity }}>
      <ContactShadow inset={30} bottom={-26} blur={24} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: ANDROID.radius,
          background: 'linear-gradient(160deg, #2b2d31 0%, #121315 60%, #08090a 100%)',
          boxShadow: '0 0 0 3px #50545b, 0 0 0 4px #2a2c30, 0 30px 70px rgba(20, 24, 40, 0.20), 0 8px 20px rgba(20, 24, 40, 0.12)',
        }}
      />
      {[
        { top: 190, h: 70 },
        { top: 290, h: 120 },
      ].map((b, i) => (
        <div key={i} style={{ position: 'absolute', top: b.top, height: b.h, width: 5, right: -8, borderRadius: 2, background: 'linear-gradient(90deg, #3a3d42, #6b6f76)' }} />
      ))}
      <ScreenClip left={ANDROID.bezel} top={ANDROID.bezel} w={ANDROID.screenW} h={ANDROID.screenH} radius={ANDROID.radius - ANDROID.bezel}>
        {children}
        {punchHole ? (
          <div style={{ position: 'absolute', top: 18, left: '50%', width: 20, height: 20, marginLeft: -10, borderRadius: 10, background: '#050506', boxShadow: '0 0 0 2px rgba(255,255,255,0.05)' }} />
        ) : null}
      </ScreenClip>
    </div>
  );
};

// MARK: - MacBook

export const MacBook: React.FC<{ cx: number; cy: number; screenW?: number; screenH?: number; opacity?: number; children: React.ReactNode }> = ({
  cx,
  cy,
  screenW = MAC.screenW,
  screenH = MAC.screenH,
  opacity = 1,
  children,
}) => {
  const bezel = MAC.bezel;
  const outerW = screenW + bezel * 2;
  const outerH = screenH + bezel * 2 + 10;
  const left = cx - outerW / 2;
  const top = cy - screenH / 2 - bezel;
  const baseW = outerW + 190;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, opacity }}>
      <div style={{ position: 'absolute', left: cx - baseW / 2 + 60, width: baseW - 120, top: top + outerH - 6, height: 70, borderRadius: '50%', background: 'rgba(30, 32, 40, 0.20)', filter: 'blur(30px)' }} />
      <div style={{ position: 'absolute', left, top, width: outerW, height: outerH, borderRadius: '30px 30px 8px 8px', background: '#0d0d0f', boxShadow: '0 0 0 2px #b9bcc3, 0 30px 80px rgba(20, 24, 40, 0.16)' }} />
      <ScreenClip left={left + bezel} top={top + bezel} w={screenW} h={screenH} radius={12} bg="#fff">
        {children}
      </ScreenClip>
      <div
        style={{
          position: 'absolute',
          left: cx - baseW / 2,
          top: top + outerH,
          width: baseW,
          height: 30,
          borderRadius: '4px 4px 26px 26px / 4px 4px 22px 22px',
          background: 'linear-gradient(180deg, #e9eaee 0%, #d3d5da 45%, #a9acb3 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset',
        }}
      />
      <div style={{ position: 'absolute', left: cx - 150, top: top + outerH, width: 300, height: 11, borderRadius: '0 0 14px 14px', background: 'linear-gradient(180deg, #b4b7be, #cfd1d6)' }} />
    </div>
  );
};

// MARK: - Browser window (Safari-like light chrome: traffic lights, centred URL field)

export const BROWSER_CHROME_H = 64;

// Page sizing: pass pageWidth (the recorded viewport width, px) and the footage is laid out at that size and scaled by
// w / pageWidth (pageHeight defaults to pageWidth * 9/16). The content area (h - BROWSER_CHROME_H) shows page rows
// cropTop .. cropTop + (h - chrome) / scale, so a shorter window crops the page's bottom: use it to keep third-party
// buttons or footer links out of frame. Without pageWidth, children simply fill the content area.
export type BrowserWindowProps = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  url: string;
  opacity?: number;
  scale?: number;
  pageWidth?: number;
  pageHeight?: number;
  cropTop?: number;
  children: React.ReactNode;
};

export const BrowserWindow: React.FC<BrowserWindowProps> = ({ cx, cy, w, h, url, opacity = 1, scale = 1, pageWidth, pageHeight, cropTop = 0, children }) => (
  <div style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity, transform: `scale(${scale})` }}>
    <ContactShadow inset={80} bottom={-30} blur={34} alpha={0.16} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 16,
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.12), 0 30px 80px rgba(20, 24, 40, 0.18), 0 8px 24px rgba(20, 24, 40, 0.10)',
        isolation: 'isolate',
      }}
    >
      <div
        style={{
          height: BROWSER_CHROME_H,
          display: 'flex',
          alignItems: 'center',
          padding: '0 22px',
          background: 'linear-gradient(180deg, #f7f7f8 0%, #ececee 100%)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.10)',
          fontFamily: BRAND.font,
        }}
      >
        <div style={{ display: 'flex', gap: 9 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.15)' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, marginLeft: 30, color: '#8e8e93', fontSize: 22 }}>
          <span>‹</span>
          <span>›</span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              minWidth: Math.min(560, w * 0.45),
              height: 38,
              padding: '0 20px',
              borderRadius: 10,
              background: 'rgba(0, 0, 0, 0.055)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              fontSize: 19,
              color: '#3c3c43',
              letterSpacing: -0.1,
            }}
          >
            <svg width="12" height="15" viewBox="0 0 12 15" aria-hidden>
              <rect x="1" y="6.5" width="10" height="8" rx="2" fill="#6e6e73" />
              <path d="M3.5 6.5V4.5a2.5 2.5 0 0 1 5 0v2" stroke="#6e6e73" strokeWidth="1.6" fill="none" />
            </svg>
            <span>{url}</span>
          </div>
        </div>
        <div style={{ width: 120 }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: BROWSER_CHROME_H, bottom: 0, overflow: 'hidden', background: '#fff' }}>
        {pageWidth ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: -cropTop * (w / pageWidth),
              width: pageWidth,
              height: pageHeight ?? Math.round((pageWidth * 9) / 16),
              transform: `scale(${w / pageWidth})`,
              transformOrigin: '0 0',
            }}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  </div>
);

// MARK: - Frameless (rounded card with a shadow: web embeds, cropped UI, a single panel)

export const Frameless: React.FC<{ cx: number; cy: number; w: number; h: number; radius?: number; opacity?: number; scale?: number; children: React.ReactNode }> = ({
  cx,
  cy,
  w,
  h,
  radius = 24,
  opacity = 1,
  scale = 1,
  children,
}) => (
  <div style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity, transform: `scale(${scale})` }}>
    <ContactShadow inset={40} bottom={-24} blur={28} alpha={0.16} />
    <ScreenClip left={0} top={0} w={w} h={h} radius={radius} bg="#fff">
      {children}
    </ScreenClip>
    <div style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 24px 60px rgba(20, 24, 40, 0.16)', pointerEvents: 'none' }} />
  </div>
);
