import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { LanguageMenu } from '@/components/language-menu';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useSession, useSignOut, useUserProfile } from '@/hooks/use-auth';
import { useMyPendingInvites } from '@/hooks/use-workspace-invites';
import { k } from '@/locales/keys';

export default function SettingsScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { data: user, error: userError } = useUserProfile(session?.user.id);
  const signOut = useSignOut();
  const { t } = useLanguage();
  const { currentWorkspace } = useWorkspace();
  const { data: pendingInvites = [] } = useMyPendingInvites();
  const pendingCount = pendingInvites.length;

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const email = user?.email ?? session?.user.email ?? '';
  const profileImage = user?.profile_image ?? session?.user.user_metadata?.avatar_url;

  const MENU_ITEMS = [
    { icon: 'grid-outline', label: t(k.settings.categories), route: '/categories' },
    { icon: 'star-outline', label: t(k.settings.subscriptions), route: '/subscriptions' },
    {
      icon: 'people-circle-outline',
      label: t(k.workspace.workspaces),
      action: 'workspaces' as const,
      badge: pendingCount,
    },
    { icon: 'language-outline', label: t(k.settings.language), action: 'language' },
    { icon: 'notifications-outline', label: t(k.settings.notifications), disabled: true },
    { icon: 'cash-outline', label: t(k.settings.currency), disabled: true },
    { icon: 'download-outline', label: t(k.settings.exportData), disabled: true },
    { icon: 'information-circle-outline', label: t(k.settings.about), disabled: true },
  ] as const;

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onError: (error) => {
        Alert.alert(
          t(k.settings.signOutFailed),
          error instanceof Error ? error.message : t(k.common.unexpectedError),
        );
      },
    });
  };

  const handleMenuPress = (item: (typeof MENU_ITEMS)[number]) => {
    if ('route' in item && item.route) {
      router.push(item.route);
    } else if ('action' in item && item.action === 'workspaces') {
      router.push('/workspaces');
    }
  };

  // The ScrollView must be the screen's root view: wrapped in a View, the native header and
  // tab bar don't track it (no large-title collapse or tab bar minimize, content scrolls
  // under the title).
  return (
    <ScrollView
      style={styles.scroll}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {userError && (
        <Card style={styles.errorCard}>
          <Ionicons name="warning-outline" size={20} color={colors.expense} />
          <Text style={styles.errorText}>{t(k.settings.profileError)}</Text>
        </Card>
      )}

      <Card style={styles.profileCard}>
        <View style={styles.profileTop}>
          <Avatar uri={profileImage} name={displayName} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName || t(k.settings.unknown)}</Text>
            <Text style={styles.profileEmail}>{email || t(k.settings.noEmail)}</Text>
          </View>
        </View>

        <Pressable
          style={styles.switcherTrigger}
          onPress={() => router.push('/workspace-switcher')}
          accessibilityRole="button"
          accessibilityLabel={t(k.workspace.switch)}
        >
          <View style={styles.switcherIcon}>
            <Ionicons
              name={currentWorkspace?.is_personal === false ? 'people-outline' : 'person-outline'}
              size={16}
              color={colors.gray[700]}
            />
          </View>
          <View style={styles.switcherText}>
            <Text style={styles.switcherLabel}>{t(k.workspace.current)}</Text>
            <Text style={styles.switcherName}>
              {currentWorkspace?.name ?? t(k.workspace.switch)}
            </Text>
          </View>
          <Ionicons name="swap-horizontal-outline" size={20} color={colors.gray[500]} />
        </Pressable>
      </Card>

      <Card style={styles.menuCard}>
        {MENU_ITEMS.map((item, index) => {
          const disabled = 'disabled' in item && item.disabled;
          const badge = 'badge' in item ? item.badge : 0;
          const rowStyle = [styles.menuRow, index < MENU_ITEMS.length - 1 && styles.menuRowBorder];
          const rowContent = (
            <>
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={disabled ? colors.gray[300] : colors.gray[700]}
              />
              <Text style={[styles.menuLabel, disabled && styles.menuLabelDisabled]}>
                {item.label}
              </Text>
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
              <Ionicons
                name="chevron-forward"
                size={18}
                color={disabled ? colors.gray[200] : colors.gray[400]}
              />
            </>
          );
          // The language row opens a native menu, which owns the tap. Rows are keyed by their
          // icon, not the translated label: a key that changes with the locale would unmount the
          // menu's native view while iOS is still dismissing it (crash).
          if ('action' in item && item.action === 'language') {
            return (
              <LanguageMenu key={item.icon}>
                <View style={rowStyle}>{rowContent}</View>
              </LanguageMenu>
            );
          }
          return (
            <Pressable
              key={item.icon}
              style={rowStyle}
              onPress={() => handleMenuPress(item)}
              disabled={disabled}
            >
              {rowContent}
            </Pressable>
          );
        })}
      </Card>

      <Button style={styles.signOutButton} onPress={handleSignOut} disabled={signOut.isPending}>
        <Ionicons name="log-out-outline" size={22} color={colors.white} />
        <Text style={styles.signOutText}>
          {signOut.isPending ? t(k.common.pleaseWait) : t(k.settings.signOut)}
        </Text>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.lg,
    paddingBottom: design.spacing.lg,
    gap: design.spacing.lg,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    flex: 1,
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.expense,
  },
  profileCard: {
    gap: design.spacing.md,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  profileEmail: {
    fontSize: design.fontSize.sm,
    color: colors.gray[500],
    fontWeight: '500',
  },
  switcherTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm + 4,
    paddingTop: design.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  switcherIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherText: {
    flex: 1,
    gap: 2,
  },
  switcherLabel: {
    fontSize: design.fontSize.xs,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switcherName: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.md,
    gap: design.spacing.sm,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  menuLabel: {
    flex: 1,
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[900],
  },
  menuLabelDisabled: {
    color: colors.gray[400],
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
  signOutButton: {
    backgroundColor: colors.expense,
  },
  signOutText: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.white,
  },
});
