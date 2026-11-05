import { Stack } from 'expo-router';

import { LARGE_TITLE_OPTIONS } from '@/constants/large-title';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

export const unstable_settings = {
  anchor: 'settings',
};

export default function SettingsLayout() {
  const { t } = useLanguage();

  return (
    <Stack>
      <Stack.Screen
        name="settings"
        options={{ ...LARGE_TITLE_OPTIONS, title: t(k.settings.title) }}
      />
      <Stack.Screen name="categories" options={{ title: t(k.categories.title) }} />
      <Stack.Screen name="subscriptions" options={{ title: t(k.subscriptions.title) }} />
      <Stack.Screen name="workspaces" options={{ title: t(k.workspace.workspaces) }} />
      <Stack.Screen
        name="workspace-settings"
        options={{ title: t(k.workspace.workspaceSettings) }}
      />
      <Stack.Screen name="workspace-invites" options={{ title: t(k.workspace.invitations) }} />
      <Stack.Screen name="create-workspace" options={{ title: t(k.workspace.newWorkspace) }} />
      <Stack.Screen name="profile" options={{ title: t(k.profile.title) }} />
      <Stack.Screen name="profile-name" options={{ title: t(k.profile.name) }} />
      <Stack.Screen name="delete-account" options={{ title: t(k.deleteAccount.title) }} />
    </Stack>
  );
}
