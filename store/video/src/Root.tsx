import React from 'react';
import { Composition } from 'remotion';
import { AppPreview } from './appPreview/AppPreview';
import { TIMELINE } from './appPreview/timeline';

// App Store preview, portrait 886x1920 @ 30. Keep src/review.ts and mix.json's "timeline" in sync with this id.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="AppPreviewPortrait"
      component={AppPreview}
      width={TIMELINE.width}
      height={TIMELINE.height}
      fps={TIMELINE.fps}
      durationInFrames={Math.round(TIMELINE.end * TIMELINE.fps)}
      defaultProps={{ portrait: true }}
    />
  </>
);
