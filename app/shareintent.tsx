import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ScreenPlaceholder } from '@/components/content-placeholder';
import { FormDetailRow } from '@/components/form-detail-row';
import { FormImageRow } from '@/components/form-image-row';
import { FormButtonRow, FormSection, NativeForm } from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useShareIntentScreen } from '@/hooks/use-share-intent-screen';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { useSystemColors } from '@/hooks/use-system-colors';
import { k } from '@/locales/keys';
import { formatFileSize, formatImageMeta, toFileUri } from '@/utils/file';

const ICONS = {
  empty: { sf: 'square.and.arrow.up', md: require('@/assets/icons/share.xml') },
  text: { sf: 'text.alignleft', md: require('@/assets/icons/notes.xml') },
  link: { sf: 'link', md: require('@/assets/icons/link.xml') },
  pdf: { sf: 'doc.richtext', md: require('@/assets/icons/picture_as_pdf.xml') },
  file: { sf: 'doc', md: require('@/assets/icons/draft.xml') },
  scan: { sf: 'doc.viewfinder', md: require('@/assets/icons/document_scanner.xml') },
} as const;

/**
 * Content shared into the app, as a native form: a section per kind (text or link, images, PDFs,
 * other files) and a Scan Receipt action. Cancel (iOS) / close (Android) in the header dismisses.
 */
export default function ShareIntentScreen() {
  const { t } = useLanguage();
  const {
    hasShareIntent,
    sharedText,
    sharedUrl,
    imageFiles,
    pdfFiles,
    otherFiles,
    canScan,
    isScanning,
    handleDismiss,
    handleScanReceipt,
  } = useShareIntentScreen();
  const closeIcon = useSymbolIcon({ sf: 'xmark', md: 'close' });
  const { groupedBackground } = useSystemColors();

  const sharedValue = sharedUrl ?? sharedText;
  const hasContent =
    hasShareIntent &&
    Boolean(sharedValue || imageFiles.length || pdfFiles.length || otherFiles.length);

  return (
    <>
      <Stack.Toolbar placement="left">
        {Platform.OS === 'ios' ? (
          <Stack.Toolbar.Button onPress={handleDismiss}>
            {canScan ? t(k.common.cancel) : t(k.common.done)}
          </Stack.Toolbar.Button>
        ) : closeIcon ? (
          <Stack.Toolbar.Button
            icon={closeIcon}
            accessibilityLabel={t(k.shareIntent.close)}
            onPress={handleDismiss}
          />
        ) : null}
      </Stack.Toolbar>

      {hasContent ? (
        <NativeForm>
          {sharedValue ? (
            <FormSection
              title={sharedUrl ? t(k.shareIntent.linkSection) : t(k.shareIntent.textSection)}
            >
              <FormDetailRow
                title={sharedValue}
                icon={sharedUrl ? ICONS.link : ICONS.text}
                selectable
              />
            </FormSection>
          ) : null}

          {imageFiles.length > 0 ? (
            <FormSection title={t(k.shareIntent.imagesSection)}>
              {imageFiles.map((file) => (
                <Fragment key={file.path}>
                  <FormImageRow uri={toFileUri(file.path)} accessibilityLabel={file.fileName} />
                  <FormDetailRow
                    title={file.fileName}
                    subtitle={formatImageMeta(file.size, file.width, file.height)}
                  />
                </Fragment>
              ))}
            </FormSection>
          ) : null}

          {pdfFiles.length > 0 ? (
            <FormSection title={t(k.shareIntent.pdfsSection)}>
              {pdfFiles.map((file) => (
                <FormDetailRow
                  key={file.path}
                  title={file.fileName}
                  subtitle={formatFileSize(file.size)}
                  icon={ICONS.pdf}
                />
              ))}
            </FormSection>
          ) : null}

          {otherFiles.length > 0 ? (
            <FormSection title={t(k.shareIntent.filesSection)}>
              {otherFiles.map((file) => (
                <FormDetailRow
                  key={file.path}
                  title={file.fileName}
                  subtitle={formatFileSize(file.size)}
                  icon={ICONS.file}
                />
              ))}
            </FormSection>
          ) : null}

          {canScan ? (
            <FormSection>
              <FormButtonRow
                title={isScanning ? t(k.shareIntent.scanning) : t(k.shareIntent.scanReceipt)}
                icon={ICONS.scan}
                disabled={isScanning}
                onPress={handleScanReceipt}
              />
            </FormSection>
          ) : null}
        </NativeForm>
      ) : (
        <View style={[styles.fill, { backgroundColor: groupedBackground }]}>
          <ScreenPlaceholder
            title={t(k.shareIntent.noContent)}
            message={t(k.shareIntent.noContentMessage)}
            icon={ICONS.empty}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
