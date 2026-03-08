import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';
import { useProofDownload } from '@/hooks/use-proof-download';
import { useProofs } from '@/hooks/use-proofs';
import { isSaveableImage } from '@/utils/file';

export default function ProofViewerScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: proofs, isLoading, error } = useProofs(transactionId);
  const { isSaving, isSharing, saveAllToPhotos, share, alert, dismissAlert } = useProofDownload();
  const { t } = useLanguage();

  const hasImages = proofs?.some((p) => isSaveableImage(p.mimeType)) ?? false;

  const FOOTER_HEIGHT = insets.bottom + design.spacing.md + 48 + design.spacing.md;
  const contentWidth = width - design.spacing.lg * 2 - design.borderWidth * 2;
  const [webviewHeights, setWebviewHeights] = useState<Record<string, number>>({});
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </Button>
        <Text style={styles.headerTitle}>
          {t(k.proofs.title)}
          {proofs ? ` (${proofs.length})` : ''}
        </Text>
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
          <Text style={styles.errorText}>{t(k.proofs.failedToLoad)}</Text>
        </View>
      )}

      {proofs && proofs.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="document-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>{t(k.proofs.noProofs)}</Text>
        </View>
      )}

      {proofs && proofs.length > 0 && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: FOOTER_HEIGHT + design.spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {proofs.map((proof) => (
            <Card key={proof.id} style={styles.proofCard}>
              {proof.mimeType.startsWith('image/') ? (
                <Image
                  source={{ uri: proof.url }}
                  style={[
                    styles.image,
                    {
                      width: contentWidth,
                      height: imageAspectRatios[proof.id]
                        ? contentWidth / imageAspectRatios[proof.id]
                        : contentWidth,
                    },
                  ]}
                  contentFit="contain"
                  onLoad={(e) => {
                    const { width: w, height: h } = e.source;
                    if (w && h) {
                      setImageAspectRatios((prev) => ({ ...prev, [proof.id]: w / h }));
                    }
                  }}
                />
              ) : proof.mimeType === 'text/html' ? (
                <View
                  style={[styles.webviewContainer, { height: webviewHeights[proof.id] || 600 }]}
                >
                  <WebView
                    source={{ uri: proof.url }}
                    style={styles.webview}
                    originWhitelist={['https://*']}
                    injectedJavaScript={`
                      setTimeout(() => {
                        window.ReactNativeWebView.postMessage(
                          JSON.stringify({ height: document.documentElement.scrollHeight })
                        );
                      }, 500);
                    `}
                    onMessage={(event) => {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.height) {
                        setWebviewHeights((prev) => ({ ...prev, [proof.id]: data.height }));
                      }
                    }}
                  />
                </View>
              ) : (
                <View style={styles.unsupported}>
                  <Ionicons name="document-outline" size={32} color={colors.gray[400]} />
                  <Text style={styles.unsupportedText}>
                    {t(k.proofs.unsupportedType, { type: proof.mimeType })}
                  </Text>
                </View>
              )}
            </Card>
          ))}
        </ScrollView>
      )}

      {proofs && proofs.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + design.spacing.md }]}>
          {hasImages && (
            <Button
              onPress={() => saveAllToPhotos(proofs)}
              disabled={isSaving || isSharing}
              style={styles.saveButton}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.gray[900]} />
              ) : (
                <Ionicons name="download-outline" size={20} color={colors.gray[900]} />
              )}
              <Text style={styles.footerButtonText}>
                {isSaving ? t(k.proofs.saving) : t(k.proofs.saveToPhotos)}
              </Text>
            </Button>
          )}
          <Button variant="outline" onPress={() => share(proofs)} disabled={isSaving || isSharing}>
            {isSharing ? (
              <ActivityIndicator size="small" color={colors.gray[900]} />
            ) : (
              <Ionicons name="share-outline" size={20} color={colors.gray[900]} />
            )}
          </Button>
        </View>
      )}

      <Alert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onDismiss={dismissAlert}
        actions={[{ label: 'OK', onPress: dismissAlert }]}
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
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    aspectRatio: undefined,
  },
  webviewContainer: {
    overflow: 'hidden',
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
  footer: {
    flexDirection: 'row',
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.md,
    gap: design.spacing.sm,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
  },
  footerButtonText: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
});
