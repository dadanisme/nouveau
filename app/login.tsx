import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, design } from '@/constants/colors';
import { useAuth } from '@/store';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(
        'Sign-In Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>nouveau</Text>

      <View style={styles.hero}>
        <View style={styles.heroGradient} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>Your financial journey starts here</Text>
        <Text style={styles.subtitle}>
          Manage your money, transactions, and finances seamlessly.
        </Text>

        <View style={styles.buttons}>
          <Pressable style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Image
              source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </Pressable>

          <Pressable style={[styles.appleButton, styles.disabledButton]} disabled>
            <Ionicons name="logo-apple" size={20} color={colors.white} />
            <Text style={styles.appleButtonText}>Sign in with Apple</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  brand: {
    fontSize: design.fontSize.lg,
    fontWeight: '700',
    paddingHorizontal: design.spacing.lg,
    paddingTop: 60,
    color: colors.gray[900],
  },
  hero: {
    height: 280,
    marginHorizontal: design.spacing.lg,
    marginTop: design.spacing.lg,
    borderRadius: design.radius.lg,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    overflow: 'hidden',
    ...design.shadow,
  },
  heroGradient: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
  },
  content: {
    flex: 1,
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.xl,
  },
  heading: {
    fontSize: design.fontSize['2xl'],
    fontWeight: '700',
    lineHeight: 40,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: design.fontSize.sm,
    color: colors.gray[500],
    marginTop: design.spacing.sm,
    lineHeight: 22,
  },
  buttons: {
    marginTop: design.spacing.xl,
    gap: design.spacing.sm + design.spacing.xs,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.md,
    borderRadius: design.radius.md,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    backgroundColor: colors.white,
    gap: design.spacing.sm,
    ...design.shadow,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[800],
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.md,
    borderRadius: design.radius.md,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    backgroundColor: colors.black,
    gap: design.spacing.sm,
    ...design.shadow,
  },
  appleButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
