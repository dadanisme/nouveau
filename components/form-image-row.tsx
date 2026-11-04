import { HStack, Image, Spacer } from '@expo/ui/swift-ui';
import {
  accessibilityLabel as a11yLabel,
  aspectRatio,
  frame,
  resizable,
} from '@expo/ui/swift-ui/modifiers';

import type { FormImageRowProps } from '@/components/form-extras-types';

const PREVIEW_HEIGHT = 220;

/**
 * A local image preview filling a form row: aspect-fit in a fixed-height frame, centered. A
 * SwiftUI `Image(uiImage:)` reads the file synchronously, so use it for local files only (e.g.
 * shared images); an expo-image hosted in the row rendered blank.
 */
export function FormImageRow({ uri, accessibilityLabel }: FormImageRowProps) {
  return (
    <HStack>
      <Spacer />
      <Image
        uiImage={uri}
        modifiers={[
          resizable(),
          aspectRatio({ contentMode: 'fit' }),
          frame({ height: PREVIEW_HEIGHT }),
          ...(accessibilityLabel ? [a11yLabel(accessibilityLabel)] : []),
        ]}
      />
      <Spacer />
    </HStack>
  );
}
