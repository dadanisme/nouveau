import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransactionItem } from '@/components/transaction-item';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useCategoryTransactionsSheet } from '@/hooks/use-category-transactions-sheet';
import { k } from '@/locales/keys';
import { toTransactionItemData } from '@/utils/transaction';

/**
 * Insights category drill-down sheet. Params: `categoryId`, `mode`, `year`, `month`.
 * Tapping a row opens the category picker over this sheet; the row list is legacy content until
 * the Insights rebuild (#30).
 */
export default function CategoryTransactionsSheet() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const {
    categoryName,
    categoryColor,
    periodLabel,
    transactions,
    isLoading,
    recategorize,
    viewProofs,
    requestDelete,
  } = useCategoryTransactionsSheet();

  return (
    // The ScrollView is the sheet's first child so iOS can expand the sheet when it is scrolled
    // to the edge; Android needs nested scrolling inside the sheet's own drag behavior.
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + design.spacing.lg }]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={styles.header}>
        <View style={[styles.swatch, { backgroundColor: categoryColor }]} />
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {categoryName}
        </Text>
        <Text style={styles.period}>{periodLabel}</Text>
      </View>
      <Text style={styles.hint}>{t(k.insights.recategorizeHint)}</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        transactions.map((tx, index) => (
          <TransactionItem
            key={tx.id}
            transaction={toTransactionItemData(tx)}
            isLast={index === transactions.length - 1}
            onPress={() => recategorize(tx)}
            onViewProofs={() => viewProofs(tx.id)}
            onDelete={() => requestDelete(tx.id)}
            showEditMenuAction={false}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.sm,
    paddingVertical: design.spacing.sm,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: design.radius.full,
  },
  title: {
    flex: 1,
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  period: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
  },
  hint: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[400],
    marginBottom: design.spacing.sm,
  },
  loading: {
    paddingVertical: design.spacing.xl,
  },
});
