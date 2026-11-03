import { PdfView } from '@kishannareshpal/expo-pdf';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ScreenPlaceholder } from '@/components/screen-placeholder';
import type { FormSymbol } from '@/components/native-form-types';
import { useLanguage } from '@/contexts/language';
import { useProofDownload } from '@/hooks/use-proof-download';
import { useProofs } from '@/hooks/use-proofs';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { useSystemColors } from '@/hooks/use-system-colors';
import { k } from '@/locales/keys';
import { isSaveableImage } from '@/utils/file';

const SYMBOLS = {
  warning: { sf: 'exclamationmark.triangle', material: 'warning' },
  document: { sf: 'doc', material: 'description' },
} as const satisfies Record<string, FormSymbol>;

// Platform list metrics: 16pt/dp margins, inset-grouped (iOS) / M3 medium (Android) corners.
const MARGIN = 16;
const CORNER_RADIUS = Platform.OS === 'ios' ? 10 : 12;
const DOCUMENT_HEIGHT = 600;
const PLACEHOLDER_HEIGHT = 220;

/**
 * The proofs attached to a transaction, one cell each (image, PDF or HTML receipt), in a modal.
 * Close (iOS) / back (Android) closes it, or Back where Edit Transaction pushes it; the header's
 * Save to Photos and Share actions use the system photo library and share sheet.
 */
export default function ProofViewerScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data: proofs, isLoading, error } = useProofs(transactionId);
  const { isSaving, isSharing, saveAllToPhotos, share } = useProofDownload();
  const { t } = useLanguage();
  const { groupedBackground, cellBackground } = useSystemColors();
  const shareIcon = useSymbolIcon({ sf: 'square.and.arrow.up', md: 'share' });
  const saveIcon = useSymbolIcon({ sf: 'square.and.arrow.down', md: 'download' });

  const hasProofs = !!proofs && proofs.length > 0;
  const hasImages = proofs?.some((p) => isSaveableImage(p.mimeType)) ?? false;
  const isBusy = isSaving || isSharing;

  const contentWidth = width - MARGIN * 2;
  const [webviewHeights, setWebviewHeights] = useState<Record<string, number>>({});
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const [pdfLoaded, setPdfLoaded] = useState<Record<string, boolean>>({});
  const [pdfErrors, setPdfErrors] = useState<Record<string, boolean>>({});

  return (
    <View style={[styles.container, { backgroundColor: groupedBackground }]}>
      <Stack.Screen
        options={{ title: proofs ? `${t(k.proofs.title)} (${proofs.length})` : t(k.proofs.title) }}
      />

      {hasProofs && (
        <Stack.Toolbar placement="right">
          {hasImages && saveIcon && (
            <Stack.Toolbar.Button
              icon={saveIcon}
              accessibilityLabel={isSaving ? t(k.proofs.saving) : t(k.proofs.saveToPhotos)}
              disabled={isBusy}
              onPress={() => saveAllToPhotos(proofs)}
            />
          )}
          {shareIcon && (
            <Stack.Toolbar.Button
              icon={shareIcon}
              accessibilityLabel={t(k.proofs.share)}
              disabled={isBusy}
              onPress={() => share(proofs)}
            />
          )}
        </Stack.Toolbar>
      )}

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {error && <ScreenPlaceholder title={t(k.proofs.failedToLoad)} symbol={SYMBOLS.warning} />}

      {proofs && proofs.length === 0 && (
        <ScreenPlaceholder title={t(k.proofs.noProofs)} symbol={SYMBOLS.document} />
      )}

      {hasProofs && (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          // iOS insets the content itself; Android is edge to edge, so clear the navigation bar.
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === 'android' && { paddingBottom: MARGIN + insets.bottom },
          ]}
        >
          {proofs.map((proof) => (
            <View key={proof.id} style={[styles.cell, { backgroundColor: cellBackground }]}>
              {proof.mimeType.startsWith('image/') ? (
                <Image
                  source={{ uri: proof.url }}
                  style={{
                    width: contentWidth,
                    height: imageAspectRatios[proof.id]
                      ? contentWidth / imageAspectRatios[proof.id]
                      : contentWidth,
                  }}
                  contentFit="contain"
                  accessibilityLabel={proof.filename}
                  onLoad={(e) => {
                    const { width: w, height: h } = e.source;
                    if (w && h) {
                      setImageAspectRatios((prev) => ({ ...prev, [proof.id]: w / h }));
                    }
                  }}
                />
              ) : proof.mimeType === 'text/html' ? (
                <View style={{ height: webviewHeights[proof.id] || DOCUMENT_HEIGHT }}>
                  <WebView
                    source={{ uri: proof.url }}
                    style={styles.fill}
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
              ) : proof.mimeType === 'application/pdf' ? (
                pdfErrors[proof.id] ? (
                  <View style={styles.placeholderCell}>
                    <ScreenPlaceholder title={t(k.proofs.pdfFailed)} symbol={SYMBOLS.warning} />
                  </View>
                ) : (
                  <View style={{ width: contentWidth, height: DOCUMENT_HEIGHT }}>
                    <PdfView
                      uri={proof.url}
                      fitMode="width"
                      style={styles.fill}
                      onLoadComplete={() => setPdfLoaded((prev) => ({ ...prev, [proof.id]: true }))}
                      onError={() => setPdfErrors((prev) => ({ ...prev, [proof.id]: true }))}
                    />
                    {!pdfLoaded[proof.id] && (
                      <View style={styles.overlay}>
                        <ActivityIndicator size="large" />
                      </View>
                    )}
                  </View>
                )
              ) : (
                <View style={styles.placeholderCell}>
                  <ScreenPlaceholder
                    title={t(k.proofs.unsupportedType, { type: proof.mimeType })}
                    symbol={SYMBOLS.document}
                  />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: MARGIN,
    gap: MARGIN,
  },
  cell: {
    borderRadius: CORNER_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  placeholderCell: {
    height: PLACEHOLDER_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
