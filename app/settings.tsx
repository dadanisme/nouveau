import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useAuth } from '@/store';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, userError, session, signOut } = useAuth();

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const email = user?.email ?? session?.user.email ?? '';
  const profileImage = user?.profile_image ?? session?.user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        'Sign Out Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
    }
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

        <Button style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.white} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Button>
      </View>
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
  signOutButton: {
    backgroundColor: colors.expense,
  },
  signOutText: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.white,
  },
});
