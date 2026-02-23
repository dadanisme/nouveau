import Ionicons from '@expo/vector-icons/Ionicons';
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
import { useSignUpWithEmail } from '@/hooks/use-auth';

export default function SignUpScreen() {
  const signUpWithEmail = useSignUpWithEmail();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const isSubmitting = signUpWithEmail.isPending;

  const handleSignUp = () => {
    if (!email.trim() || !password.trim()) {
      setAlert({ title: 'Missing Fields', message: 'Please enter both email and password.' });
      return;
    }

    signUpWithEmail.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          setAlert({
            title: 'Check Your Email',
            message: 'We sent you a confirmation link. Please verify your email to continue.',
          });
        },
        onError: (error) => {
          setAlert({
            title: 'Sign-Up Failed',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
        },
      },
    );
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
          <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.gray[900]} />
          </Button>

          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subtitle}>Sign up to start managing your finances with Nouveau.</Text>

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
                autoComplete="new-password"
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

            <Button onPress={handleSignUp} disabled={isSubmitting}>
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Please wait...' : 'Sign Up'}
              </Text>
            </Button>

            <Pressable onPress={() => router.back()} disabled={isSubmitting}>
              <Text style={styles.toggleText}>
                {'Already have an account? '}
                <Text style={styles.toggleTextBold}>Sign In</Text>
              </Text>
            </Pressable>
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
  content: {
    paddingHorizontal: design.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: design.spacing.sm,
    paddingHorizontal: design.spacing.sm,
    marginBottom: design.spacing.lg,
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
});
