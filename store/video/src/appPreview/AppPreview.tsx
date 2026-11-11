import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraView, Captions, LabelPill, SoundTrack, background, cameraAt } from '../kit';
import { KEYS } from './camera';
import { SoftScreen } from './SoftScreen';
import { SEGMENTS, STRIP, TIMELINE } from './timeline';

// Frameless, full bleed: one 886x1920 screen under one shared camera; pills and captions on top. No card, frame or CTA. Soft crossfades with a push between
// every beat and segment (SoftScreen);
export const AppPreview: React.FC<{ portrait?: boolean }> = ({ portrait = true }) => {
  const { fps, width, height } = useVideoConfig();
  const cam = cameraAt(useCurrentFrame() / fps, KEYS);
  return (
    <AbsoluteFill style={{ background: background() }}>
      <CameraView cam={cam} w={width} h={height}>
        <div style={{ position: 'absolute', left: -width / 2, top: -height / 2, width, height }}>
          <SoftScreen segments={SEGMENTS} strips={STRIP} />
        </div>
      </CameraView>
      <LabelPill labels={TIMELINE.labels} portrait={portrait} />
      <Captions vo={TIMELINE.vo} portrait={portrait} />
      <SoundTrack timeline={TIMELINE} />
    </AbsoluteFill>
  );
};
