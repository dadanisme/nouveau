import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { colors, design } from '@/constants/colors';
import { useAuth } from '@/store';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setAlert({ title: 'Missing Fields', message: 'Please enter both email and password.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (error) {
      setAlert({
        title: 'Sign-In Failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      setAlert({
        title: 'Sign-In Failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.heading}>Your financial journey starts here</Text>
          <Text style={styles.subtitle}>
            Manage your money, transactions, and finances seamlessly.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor={colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!isSubmitting}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.gray[500]}
                />
              </Pressable>
            </View>

            <Button onPress={handleEmailSignIn} disabled={isSubmitting}>
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Please wait...' : 'Sign In'}
              </Text>
            </Button>

            <Pressable onPress={() => router.push('/signup')} disabled={isSubmitting}>
              <Text style={styles.toggleText}>
                {"Don't have an account? "}
                <Text style={styles.toggleTextBold}>Sign Up</Text>
              </Text>
            </Pressable>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.buttons}>
            <Button variant="outline" onPress={handleGoogleSignIn}>
              <Image
                source={{
                  uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                }}
                style={styles.googleIcon}
              />
              <Text style={styles.oauthButtonText}>Sign in with Google</Text>
            </Button>

            <Button variant="dark" disabled>
              <Ionicons name="logo-apple" size={20} color={colors.white} />
              <Text style={styles.appleButtonText}>Sign in with Apple</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
      <Alert
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message}
        onDismiss={() => setAlert(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: design.spacing.xl,
  },
  hero: {
    height: 180,
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
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.lg,
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
  form: {
    marginTop: design.spacing.lg,
    gap: design.spacing.sm + design.spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    borderRadius: design.radius.md,
    backgroundColor: colors.white,
    padding: design.spacing.md,
    fontSize: design.fontSize.md,
    color: colors.gray[900],
    ...design.shadow,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: design.spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.black,
  },
  toggleText: {
    textAlign: 'center',
    fontSize: design.fontSize.sm,
    color: colors.gray[500],
  },
  toggleTextBold: {
    fontWeight: '700',
    color: colors.gray[800],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: design.spacing.lg,
    gap: design.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[300],
  },
  dividerText: {
    fontSize: design.fontSize.xs,
    color: colors.gray[400],
  },
  buttons: {
    gap: design.spacing.sm + design.spacing.xs,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  oauthButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[800],
  },
  appleButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
