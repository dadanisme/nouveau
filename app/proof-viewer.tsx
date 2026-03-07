import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useProofs } from '@/hooks/use-proofs';

export default function ProofViewerScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: proofs, isLoading, error } = useProofs(transactionId);

  const imageWidth = width - design.spacing.lg * 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </Button>
        <Text style={styles.headerTitle}>Receipt Proofs{proofs ? ` (${proofs.length})` : ''}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.expense} />
          <Text style={styles.errorText}>Failed to load proofs</Text>
        </View>
      )}

      {proofs && proofs.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="document-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>No proofs attached</Text>
        </View>
      )}

      {proofs && proofs.length > 0 && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + design.spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {proofs.map((proof) => (
            <Card key={proof.id} style={styles.proofCard}>
              <Text style={styles.filename} numberOfLines={1}>
                {proof.filename}
              </Text>
              {proof.mimeType.startsWith('image/') ? (
                <Image
                  source={{ uri: proof.url }}
                  style={[styles.image, { width: imageWidth - design.spacing.lg * 2 }]}
                  contentFit="contain"
                />
              ) : proof.mimeType === 'text/html' ? (
                <View style={styles.webviewContainer}>
                  <WebView source={{ uri: proof.url }} style={styles.webview} scalesPageToFit />
                </View>
              ) : (
                <View style={styles.unsupported}>
                  <Ionicons name="document-outline" size={32} color={colors.gray[400]} />
                  <Text style={styles.unsupportedText}>
                    Unsupported file type: {proof.mimeType}
                  </Text>
                </View>
              )}
            </Card>
          ))}
        </ScrollView>
      )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: design.spacing.sm + 4,
  },
  errorText: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.expense,
  },
  emptyText: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[400],
  },
  scrollContent: {
    paddingHorizontal: design.spacing.lg,
    gap: design.spacing.md,
  },
  proofCard: {
    padding: design.spacing.lg,
    gap: design.spacing.sm + 4,
  },
  filename: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[600],
  },
  image: {
    aspectRatio: 1,
    borderRadius: design.radius.sm,
  },
  webviewContainer: {
    height: 400,
    borderRadius: design.radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  webview: {
    flex: 1,
  },
  unsupported: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.xl,
    gap: design.spacing.sm,
  },
  unsupportedText: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[400],
  },
});
