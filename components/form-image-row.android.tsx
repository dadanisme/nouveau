import { Image } from '@expo/ui/jetpack-compose';
import { clip, fillMaxWidth, height, padding, Shapes } from '@expo/ui/jetpack-compose/modifiers';

import type { FormImageRowProps } from '@/components/form-extras-types';

const PREVIEW_HEIGHT = 220;

/** An image preview as a list row: full width inside the 16dp list margins, aspect-fit. */
export function FormImageRow({ uri, accessibilityLabel }: FormImageRowProps) {
  return (
    <Image
      source={{ uri }}
      contentScale="fit"
      contentDescription={accessibilityLabel ?? null}
      modifiers={[
        padding(16, 8, 16, 8),
        fillMaxWidth(),
        height(PREVIEW_HEIGHT),
        clip(Shapes.RoundedCorner(12)),
      ]}
    />
  );
}
