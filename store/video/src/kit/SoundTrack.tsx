import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import type { Timeline } from './types';

// MARK: - Audio: the final mix (public/mix.wav from mix.sh) or, for rough cuts, each VO clip at its time

export const SoundTrack: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  const { fps } = useVideoConfig();
  if (timeline.audio === 'none') return null;
  if (timeline.audio === 'mix') return <Audio src={staticFile('mix.wav')} />;
  return (
    <>
      {timeline.vo.map((v) => (
        <Sequence key={v.name} from={Math.round(v.at * fps)}>
          <Audio src={staticFile(`vo/${v.name}.wav`)} />
        </Sequence>
      ))}
    </>
  );
};
