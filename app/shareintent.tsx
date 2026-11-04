import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { FormDetailRow } from '@/components/form-detail-row';
import { FormImageRow } from '@/components/form-image-row';
import { FormButtonRow, FormSection, NativeForm } from '@/components/native-form';
import type { FormSymbol } from '@/components/native-form-types';
import { SheetCloseToolbar } from '@/components/sheet-toolbar';
import { useLanguage } from '@/contexts/language';
import { useShareIntentScreen } from '@/hooks/use-share-intent-screen';
import { useSystemColors } from '@/hooks/use-system-colors';
import { k } from '@/locales/keys';
import { formatFileSize, formatImageMeta, toFileUri } from '@/utils/file';

const SYMBOLS = {
  empty: { sf: 'square.and.arrow.up', material: 'share' },
  text: { sf: 'text.alignleft', material: 'notes' },
  link: { sf: 'link', material: 'link' },
  pdf: { sf: 'doc.richtext', material: 'picture_as_pdf' },
  file: { sf: 'doc', material: 'draft' },
} as const satisfies Record<string, FormSymbol>;

const SCAN_ICON = {
  sf: 'doc.viewfinder',
  md: require('@/assets/icons/document_scanner.xml'),
} as const;

/**
 * Content shared into the app, as a native form: a section per kind (text or link, images, PDFs,
 * other files) and a Scan Receipt action. The header's leading Close (xmark) dismisses.
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
  const { groupedBackground } = useSystemColors();

  const sharedValue = sharedUrl ?? sharedText;
  const hasContent =
    hasShareIntent &&
    Boolean(sharedValue || imageFiles.length || pdfFiles.length || otherFiles.length);

  return (
    <>
      <SheetCloseToolbar onPress={handleDismiss} />

      {hasContent ? (
        <NativeForm>
          {sharedValue ? (
            <FormSection
              title={sharedUrl ? t(k.shareIntent.linkSection) : t(k.shareIntent.textSection)}
            >
              <FormDetailRow
                title={sharedValue}
                symbol={sharedUrl ? SYMBOLS.link : SYMBOLS.text}
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
                  symbol={SYMBOLS.pdf}
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
                  symbol={SYMBOLS.file}
                />
              ))}
            </FormSection>
          ) : null}

          {canScan ? (
            <FormSection>
              <FormButtonRow
                title={isScanning ? t(k.shareIntent.scanning) : t(k.shareIntent.scanReceipt)}
                icon={SCAN_ICON}
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
            description={t(k.shareIntent.noContentMessage)}
            symbol={SYMBOLS.empty}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
