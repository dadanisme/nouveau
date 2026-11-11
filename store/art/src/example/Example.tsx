import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  AndroidPhone,
  BrowserWindow,
  CameraView,
  Captions,
  Frameless,
  IPhone,
  LabelPill,
  MacBook,
  MAC,
  SoundTrack,
  Screen,
  SplitScreen,
  Spotlight,
  StillHolds,
  Wordmark,
  background,
  cameraAt,
  clamp,
  ease,
  splitRects,
  whipBlur,
} from '../kit';
import {
  ANDROID_SEGMENTS,
  BROWSER_SEGMENTS,
  CARD_SEGMENTS,
  IPHONE_SEGMENTS,
  KEYS,
  MAC_SEGMENTS,
  P_KEYS,
  P_KEYS_B,
  P_SPLIT,
  SPOTLIGHT,
  STILL_HOLDS,
  TIMELINE,
  WHIPS,
  WORLD,
  WORLD_OUT,
} from './timeline';

/** fx=false turns off the spotlight, whip blur and still holds (the self-test renders both to prove they draw). */
export type ExampleProps = { portrait?: boolean; fx?: boolean };

// MARK: - Composition: every device in one world, one virtual camera (two in the portrait split), overlays on top

export const Example: React.FC<ExampleProps> = ({ portrait = false, fx = true }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const cam = cameraAt(t, portrait ? P_KEYS : KEYS);
  const out = ease.inOut(interpolate(t, [WORLD_OUT.from, WORLD_OUT.to], [0, 1], clamp));
  const blur = out * 10 + (fx ? whipBlur(t, WHIPS) : 0);
  const b = WORLD.browser;
  const world = (
    <>
      <AndroidPhone x={WORLD.android.x} y={WORLD.android.y}>
        <Screen segments={ANDROID_SEGMENTS} statusBarClip={0} />
      </AndroidPhone>
      <IPhone x={WORLD.iphone.x} y={WORLD.iphone.y}>
        <Screen segments={IPHONE_SEGMENTS} />
      </IPhone>
      <BrowserWindow cx={b.cx} cy={b.cy} w={b.w} h={b.h} url={b.url} pageWidth={b.pageWidth} pageHeight={b.pageHeight}>
        <Screen segments={BROWSER_SEGMENTS} statusBarClip={0} background="#fff" />
      </BrowserWindow>
      <Frameless cx={WORLD.card.cx} cy={WORLD.card.cy} w={WORLD.card.w} h={WORLD.card.h}>
        <Screen segments={CARD_SEGMENTS} statusBarClip={0} />
      </Frameless>
      <MacBook cx={WORLD.mac.cx} cy={WORLD.mac.cy}>
        <Screen segments={MAC_SEGMENTS} statusBarClip={0} />
        {fx ? <StillHolds holds={STILL_HOLDS} width={MAC.screenW} height={MAC.screenH} /> : null}
      </MacBook>
    </>
  );
  return (
    <AbsoluteFill style={{ background: background() }}>
      <AbsoluteFill
        style={{
          opacity: 1 - out,
          transform: `scale(${1 - 0.06 * out}) translateY(${-40 * out}px)`,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        }}
      >
        {portrait ? (
          <SplitScreen split={P_SPLIT} keysA={P_KEYS} keysB={P_KEYS_B} a={world} b={world} />
        ) : (
          <CameraView cam={cam} w={width} h={height}>
            {world}
          </CameraView>
        )}
        {fx ? <Spotlight spec={SPOTLIGHT} cam={cam} /> : null}
      </AbsoluteFill>

      <LabelPill labels={TIMELINE.labels} portrait={portrait} panels={portrait ? splitRects(P_SPLIT, t, width, height) : undefined} />
      {TIMELINE.ending ? <Wordmark ending={TIMELINE.ending} portrait={portrait} accent="lastWord" headlineFont='Georgia, "Times New Roman", serif' /> : null}
      <Captions vo={TIMELINE.vo} portrait={portrait} />
      <SoundTrack timeline={TIMELINE} />
    </AbsoluteFill>
  );
};
