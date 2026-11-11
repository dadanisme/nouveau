import React from 'react';
import { Composition } from 'remotion';
import { StoreArt } from './store/StoreArt';
import { SIZES } from './store/tokens';
import { StoreScreenshot } from './screens/StoreScreenshot';
import { CANVAS, SHOT_NOS } from './screens/spec';

// Still compositions for the App Store creative assets (Header 21:9 and Search Results 3:2), ID + EN.
const make = (id: string, kind: 'header' | 'search', lang: 'id' | 'en') => (
  <Composition
    key={id}
    id={id}
    component={StoreArt}
    width={SIZES[kind].width}
    height={SIZES[kind].height}
    fps={30}
    durationInFrames={1}
    defaultProps={{ kind, lang, variant: 'couple' as const }}
  />
);

export const RemotionRoot: React.FC = () => (
  <>
    {make('StoreHeaderId', 'header', 'id')}
    {make('StoreHeaderEn', 'header', 'en')}
    {make('StoreSearchId', 'search', 'id')}
    {make('StoreSearchEn', 'search', 'en')}
    {(['id', 'en'] as const).flatMap((lang) =>
      SHOT_NOS.map((no) => {
        const id = `Screenshot${lang === 'id' ? 'Id' : 'En'}${no}`;
        return <Composition key={id} id={id} component={StoreScreenshot} width={CANVAS.width} height={CANVAS.height} fps={30} durationInFrames={1} defaultProps={{ lang, no }} />;
      }),
    )}
  </>
);
