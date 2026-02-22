import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';

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
            <Ionicons name="logo-apple" size={20} color="#fff" />
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
    backgroundColor: '#fff',
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  hero: {
    height: 280,
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    backgroundColor: '#F59E0B',
    opacity: 0.85,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: '#111',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
    lineHeight: 22,
  },
  buttons: {
    marginTop: 32,
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#000',
    gap: 10,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
