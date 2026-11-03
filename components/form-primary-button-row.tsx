import { Button, HStack, ProgressView, Text } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled,
  frame,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
} from '@expo/ui/swift-ui/modifiers';

export type FormPrimaryButtonRowProps = {
  title: string;
  /** Shows a progress indicator and disables the button while the action runs. */
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * The form's primary action: a full-width, large prominent (accent-filled) button on a clear
 * row, so it sits on the grouped background instead of inside a cell.
 */
export function FormPrimaryButtonRow({
  title,
  loading,
  disabled: isDisabled,
  onPress,
}: FormPrimaryButtonRowProps) {
  return (
    <Button
      onPress={onPress}
      modifiers={[
        buttonStyle('borderedProminent'),
        // A capsule on every iOS version (iOS 26+ default), matching the provider pills below.
        buttonBorderShape('capsule'),
        controlSize('large'),
        disabled(Boolean(isDisabled || loading)),
        listRowBackground('clear'),
        listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
        listRowSeparator('hidden'),
      ]}
    >
      <HStack spacing={8} modifiers={[frame({ maxWidth: Infinity })]}>
        {loading ? <ProgressView /> : null}
        <Text>{title}</Text>
      </HStack>
    </Button>
  );
}
