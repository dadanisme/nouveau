import { Button, CircularProgressIndicator, Row, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, height, padding, size } from '@expo/ui/jetpack-compose/modifiers';

import type { FormPrimaryButtonRowProps } from '@/components/form-primary-button-row';

// A full-width M3 filled button at the 48dp touch-target height (the default is 40dp).
const BUTTON_HEIGHT = 48;
const PROGRESS_SIZE = 18;
// The form's 16dp side margin; each row carries its own, like the native-form rows.
const SIDE = 16;

/** The form's primary action: a full-width Material 3 filled button with a progress state. */
export function FormPrimaryButtonRow({
  title,
  loading,
  disabled,
  onPress,
}: FormPrimaryButtonRowProps) {
  return (
    <Button
      onClick={onPress}
      enabled={!disabled && !loading}
      modifiers={[fillMaxWidth(), padding(SIDE, 0, SIDE, 0), height(BUTTON_HEIGHT)]}
    >
      <Row horizontalArrangement={{ spacedBy: 8 }} verticalAlignment="center">
        {loading ? (
          <CircularProgressIndicator
            strokeWidth={2}
            modifiers={[size(PROGRESS_SIZE, PROGRESS_SIZE)]}
          />
        ) : null}
        <Text>{title}</Text>
      </Row>
    </Button>
  );
}
