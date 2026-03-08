import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/alert';
import { Avatar } from '@/components/avatar';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useSession, useSignOut, useUserProfile } from '@/hooks/use-auth';
import { k } from '@/locales/keys';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const { data: user, error: userError } = useUserProfile(session?.user.id);
  const signOut = useSignOut();
  const { t, locale, setLocale } = useLanguage();

  const displayName = user?.display_name ?? session?.user.user_metadata?.full_name ?? '';
  const email = user?.email ?? session?.user.email ?? '';
  const profileImage = user?.profile_image ?? session?.user.user_metadata?.avatar_url;

  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const MENU_ITEMS = [
    { icon: 'grid-outline', label: t(k.settings.categories), route: '/categories' },
    { icon: 'star-outline', label: t(k.settings.subscriptions), route: '/subscriptions' },
    { icon: 'language-outline', label: t(k.settings.language), action: 'language' },
    { icon: 'notifications-outline', label: t(k.settings.notifications), disabled: true },
    { icon: 'cash-outline', label: t(k.settings.currency), disabled: true },
    { icon: 'download-outline', label: t(k.settings.exportData), disabled: true },
    { icon: 'information-circle-outline', label: t(k.settings.about), disabled: true },
  ] as const;

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onError: (error) => {
        setAlert({
          title: t(k.settings.signOutFailed),
          message: error instanceof Error ? error.message : t(k.common.unexpectedError),
        });
      },
    });
  };

  const handleMenuPress = (item: (typeof MENU_ITEMS)[number]) => {
    if ('route' in item && item.route) {
      router.push(item.route);
    } else if ('action' in item && item.action === 'language') {
      setShowLanguagePicker(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </Button>
        <Text style={styles.headerTitle}>{t(k.settings.title)}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {userError && (
          <Card style={styles.errorCard}>
            <Ionicons name="warning-outline" size={20} color={colors.expense} />
            <Text style={styles.errorText}>{t(k.settings.profileError)}</Text>
          </Card>
        )}

        <Card style={styles.profileCard}>
          <Avatar uri={profileImage} name={displayName} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName || t(k.settings.unknown)}</Text>
            <Text style={styles.profileEmail}>{email || t(k.settings.noEmail)}</Text>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => {
            const disabled = 'disabled' in item && item.disabled;
            return (
              <Pressable
                key={item.label}
                style={[styles.menuRow, index < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
                onPress={() => handleMenuPress(item)}
                disabled={disabled}
              >
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={disabled ? colors.gray[300] : colors.gray[700]}
                />
                <Text style={[styles.menuLabel, disabled && styles.menuLabelDisabled]}>
                  {item.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={disabled ? colors.gray[200] : colors.gray[400]}
                />
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
      </View>

      <BottomSheet
        visible={showLanguagePicker}
        onDismiss={() => setShowLanguagePicker(false)}
        snapPoints={['30%']}
      >
        <BottomSheetView style={styles.languageContent}>
          <Text style={styles.languageTitle}>{t(k.settings.selectLanguage)}</Text>
          <Button
            variant="outline"
            style={[styles.languageOption, locale === 'en' && styles.languageOptionActive]}
            onPress={() => {
              setLocale('en');
              setShowLanguagePicker(false);
            }}
          >
            <View style={styles.languageOptionLeft}>
              <View style={styles.flagContainer}>
                <Image
                  source={{ uri: 'https://flagcdn.com/w80/gb.png' }}
                  style={styles.flagImage}
                />
              </View>
              <Text style={styles.languageLabel}>{t(k.settings.english)}</Text>
            </View>
            {locale === 'en' && <Ionicons name="checkmark" size={22} color={colors.gray[900]} />}
          </Button>
          <Button
            variant="outline"
            style={[styles.languageOption, locale === 'id' && styles.languageOptionActive]}
            onPress={() => {
              setLocale('id');
              setShowLanguagePicker(false);
            }}
          >
            <View style={styles.languageOptionLeft}>
              <View style={styles.flagContainer}>
                <Image
                  source={{ uri: 'https://flagcdn.com/w80/id.png' }}
                  style={styles.flagImage}
                />
              </View>
              <Text style={styles.languageLabel}>{t(k.settings.indonesian)}</Text>
            </View>
            {locale === 'id' && <Ionicons name="checkmark" size={22} color={colors.gray[900]} />}
          </Button>
        </BottomSheetView>
      </BottomSheet>

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
  menuLabelDisabled: {
    color: colors.gray[400],
  },
  signOutButton: {
    backgroundColor: colors.expense,
  },
  signOutText: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.white,
  },
  languageContent: {
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.lg,
    gap: design.spacing.sm,
  },
  languageTitle: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
    marginBottom: design.spacing.sm,
  },
  languageOption: {
    justifyContent: 'space-between',
  },
  languageOptionActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm,
  },
  flagContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    ...design.shadow,
  },
  flagImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  languageLabel: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
});
