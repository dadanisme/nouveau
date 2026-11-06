import { Stack } from 'expo-router';

export type OnboardingSkipToolbarProps = {
  title: string;
  onPress: () => void;
};

/** The value pages' Skip (iOS): a text button at the trailing end of the native bar. */
export function OnboardingSkipToolbar({ title, onPress }: OnboardingSkipToolbarProps) {
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button onPress={onPress}>{title}</Stack.Toolbar.Button>
    </Stack.Toolbar>
  );
}
