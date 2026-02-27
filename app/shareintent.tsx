import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useShareIntentScreen, type CategorizedFile } from '@/hooks/use-share-intent-screen';
import { formatFileSize } from '@/utils/file';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function TextContent({ text, url }: { text: string | null; url: string | null }) {
  if (!text && !url) return null;

  return (
    <Card style={styles.contentCard}>
      <Badge label={url ? 'URL' : 'Text'} color={colors.primary.DEFAULT} />
      <Text style={styles.contentText} selectable>
        {url ?? text}
      </Text>
    </Card>
  );
}

function ImageContent({ file }: { file: CategorizedFile }) {
  return (
    <Card style={styles.contentCard}>
      <Badge label="Image" color={colors.income} />
      <View style={styles.imageContainer}>
        <Image source={{ uri: file.path }} style={styles.imagePreview} contentFit="contain" />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText} numberOfLines={1}>
          {file.fileName}
        </Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{formatFileSize(file.size)}</Text>
        {file.width != null && file.height != null && (
          <>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>
              {file.width}×{file.height}
            </Text>
          </>
        )}
      </View>
    </Card>
  );
}

function PdfContent({ file }: { file: CategorizedFile }) {
  return (
    <Card style={styles.contentCard}>
      <Badge label="PDF" color={colors.expense} />
      <View style={styles.pdfRow}>
        <View style={styles.pdfIcon}>
          <Ionicons name="document-text" size={32} color={colors.expense} />
        </View>
        <View style={styles.pdfInfo}>
          <Text style={styles.pdfFileName} numberOfLines={2}>
            {file.fileName}
          </Text>
          <Text style={styles.pdfSize}>{formatFileSize(file.size)}</Text>
        </View>
      </View>
    </Card>
  );
}

function FileContent({ file }: { file: CategorizedFile }) {
  return (
    <Card style={styles.contentCard}>
      <Badge label="File" color={colors.gray[600]} />
      <View style={styles.pdfRow}>
        <View style={[styles.pdfIcon, { backgroundColor: colors.gray[100] }]}>
          <Ionicons name="document-outline" size={32} color={colors.gray[600]} />
        </View>
        <View style={styles.pdfInfo}>
          <Text style={styles.pdfFileName} numberOfLines={2}>
            {file.fileName}
          </Text>
          <Text style={styles.pdfSize}>{formatFileSize(file.size)}</Text>
        </View>
      </View>
    </Card>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="share-outline" size={64} color={colors.gray[300]} />
      <Text style={styles.emptyTitle}>No Shared Content</Text>
      <Text style={styles.emptyMessage}>
        Share images, PDFs, or text from other apps to view them here.
      </Text>
    </View>
  );
}

export default function ShareIntentScreen() {
  const insets = useSafeAreaInsets();
  const { hasShareIntent, sharedText, sharedUrl, imageFiles, pdfFiles, otherFiles, handleDismiss } =
    useShareIntentScreen();

  const hasContent =
    hasShareIntent &&
    (sharedText || sharedUrl || imageFiles.length || pdfFiles.length || otherFiles.length);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="outline" onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={22} color={colors.gray[900]} />
        </Button>
        <Text style={styles.headerTitle}>Shared Content</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + design.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {hasContent ? (
          <>
            <TextContent text={sharedText} url={sharedUrl} />
            {imageFiles.map((file, index) => (
              <ImageContent key={file.path ?? index} file={file} />
            ))}
            {pdfFiles.map((file, index) => (
              <PdfContent key={file.path ?? index} file={file} />
            ))}
            {otherFiles.map((file, index) => (
              <FileContent key={file.path ?? index} file={file} />
            ))}
          </>
        ) : (
          <EmptyState />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + design.spacing.md }]}>
        <Button onPress={handleDismiss} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </Button>
      </View>
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
  closeButton: {
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: design.spacing.lg,
    gap: design.spacing.lg,
  },
  footer: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.md,
  },
  doneButton: {
    backgroundColor: colors.primary.DEFAULT,
  },
  doneText: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  contentCard: {
    gap: design.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: design.spacing.sm,
    paddingVertical: design.spacing.xs,
    borderRadius: design.radius.sm,
  },
  badgeText: {
    fontSize: design.fontSize.xs,
    fontWeight: '800',
    color: colors.white,
  },
  contentText: {
    fontSize: design.fontSize.md,
    fontWeight: '500',
    color: colors.gray[800],
    lineHeight: 22,
  },
  imageContainer: {
    aspectRatio: 4 / 3,
    borderRadius: design.radius.md,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.xs,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
  },
  metaDot: {
    fontSize: design.fontSize.xs,
    color: colors.gray[400],
  },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.md,
  },
  pdfIcon: {
    width: 64,
    height: 64,
    borderRadius: design.radius.md,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfInfo: {
    flex: 1,
    gap: 2,
  },
  pdfFileName: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  pdfSize: {
    fontSize: design.fontSize.sm,
    fontWeight: '500',
    color: colors.gray[500],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: design.spacing.sm,
  },
  emptyTitle: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[400],
    marginTop: design.spacing.sm,
  },
  emptyMessage: {
    fontSize: design.fontSize.md,
    fontWeight: '500',
    color: colors.gray[400],
    textAlign: 'center',
    paddingHorizontal: design.spacing.xl,
  },
});
