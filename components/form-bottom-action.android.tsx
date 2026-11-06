import { Column, useMaterialColors, type MaterialColors } from '@expo/ui/jetpack-compose';
import { background, fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComposeHost } from '@/components/compose-host';
import {
  FormPrimaryButtonRow,
  type FormPrimaryButtonRowProps,
} from '@/components/form-primary-button-row';
import { ACCENT_COLOR } from '@/constants/accent';

const GAP = 16;

// The accent as the `primary` role (the filled button), white `onPrimary` on it in both themes.
const COLOR_OVERRIDES: Partial<MaterialColors> = {
  primary: ACCENT_COLOR as `#${string}`,
  onPrimary: '#FFFFFF',
};

/**
 * A screen's one primary action pinned under a scrolling list (the onboarding currency step's
 * Continue): a full-width M3 filled button on the `surface` role, above the gesture bar.
 */
export function FormBottomAction(props: FormPrimaryButtonRowProps) {
  return (
    <ComposeHost matchContents={{ vertical: true }} colorOverrides={COLOR_OVERRIDES}>
      <BottomActionSurface {...props} />
    </ComposeHost>
  );
}

function BottomActionSurface(props: FormPrimaryButtonRowProps) {
  const colors = useMaterialColors();
  const insets = useSafeAreaInsets();

  return (
    <Column
      modifiers={[
        fillMaxWidth(),
        background(colors.surface),
        padding(0, GAP / 2, 0, insets.bottom + GAP),
      ]}
    >
      <FormPrimaryButtonRow {...props} />
    </Column>
  );
}
