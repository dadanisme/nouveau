import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/alert';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useSession, useSignOut, useUserProfile } from '@/hooks/use-auth';

const MENU_ITEMS = [
  { icon: 'grid-outline', label: 'Categories', route: '/categories' },
  { icon: 'star-outline', label: 'Subscriptions', route: '/subscriptions' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'cash-outline', label: 'Currency' },
  { icon: 'download-outline', label: 'Export Data' },
  { icon: 'information-circle-outline', label: 'About' },
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { data: user, error: userError } = useUserProfile(session?.user.id);
  const signOut = useSignOut();

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const email = user?.email ?? session?.user.email ?? '';
  const profileImage = user?.profile_image ?? session?.user.user_metadata?.avatar_url;

  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onError: (error) => {
        setAlert({
          title: 'Sign Out Failed',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </Button>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {userError && (
          <Card style={styles.errorCard}>
            <Ionicons name="warning-outline" size={20} color={colors.expense} />
            <Text style={styles.errorText}>
              Failed to load profile data. Some information may be incomplete.
            </Text>
          </Card>
        )}

        <Card style={styles.profileCard}>
          <Avatar uri={profileImage} name={displayName} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName || 'Unknown'}</Text>
            <Text style={styles.profileEmail}>{email || 'No email'}</Text>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              style={[styles.menuRow, index < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
              onPress={'route' in item ? () => router.push(item.route) : undefined}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={colors.gray[700]}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
            </Pressable>
          ))}
        </Card>

        <Button style={styles.signOutButton} onPress={handleSignOut} disabled={signOut.isPending}>
          <Ionicons name="log-out-outline" size={22} color={colors.white} />
          <Text style={styles.signOutText}>
            {signOut.isPending ? 'Please wait...' : 'Sign Out'}
          </Text>
        </Button>
      </View>
      <Alert
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message}
        onDismiss={() => setAlert(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: design.spacing.lg,
    paddingVertical: design.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: design.radius.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.lg,
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
  signOutButton: {
    backgroundColor: colors.expense,
  },
  signOutText: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.white,
  },
});
