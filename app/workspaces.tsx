import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useMyPendingInvites } from '@/hooks/use-workspace-invites';
import { k } from '@/locales/keys';

export default function WorkspacesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { currentWorkspaceId, currentWorkspace } = useWorkspace();
  const { data: pendingInvites = [] } = useMyPendingInvites();
  const pendingCount = pendingInvites.length;

  const ITEMS = [
    {
      icon: 'people-circle-outline' as const,
      label: t(k.workspace.workspaceSettings),
      subtitle: currentWorkspace?.name,
      onPress: () => {
        if (!currentWorkspaceId) return;
        router.push({ pathname: '/workspace-settings', params: { id: currentWorkspaceId } });
      },
      disabled: !currentWorkspaceId,
    },
    {
      icon: 'add-circle-outline' as const,
      label: t(k.workspace.create),
      onPress: () => router.push('/create-workspace'),
    },
    {
      icon: 'mail-outline' as const,
      label: t(k.workspace.pendingInvites),
      badge: pendingCount,
      onPress: () => router.push('/workspace-invites'),
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title={t(k.workspace.workspaces)} onBack={() => router.back()} />

      <View style={styles.content}>
        <Card style={styles.menuCard}>
          {ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              style={[styles.row, index < ITEMS.length - 1 && styles.rowBorder]}
              onPress={item.onPress}
              disabled={item.disabled}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={item.disabled ? colors.gray[300] : colors.gray[700]}
              />
              <View style={styles.labelWrap}>
                <Text style={[styles.label, item.disabled && styles.labelDisabled]}>
                  {item.label}
                </Text>
                {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
              </View>
              {item.badge && item.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
              <Ionicons
                name="chevron-forward"
                size={18}
                color={item.disabled ? colors.gray[200] : colors.gray[400]}
              />
            </Pressable>
          ))}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.lg,
    gap: design.spacing.lg,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.md,
    gap: design.spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  labelWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[900],
  },
  labelDisabled: {
    color: colors.gray[400],
  },
  subtitle: {
    fontSize: design.fontSize.xs,
    fontWeight: '500',
    color: colors.gray[500],
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.primary.DEFAULT,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: design.fontSize.xs,
    fontWeight: '800',
    color: colors.black,
  },
});
