import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { headerActionOptions } from '@/components/header-action';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useCategoryManagement } from '@/hooks/use-category-management';
import { k } from '@/locales/keys';
import type { Tables } from '@/types/supabase';
import { parseIcon } from '@/utils/icon';

function CategoryRow({
  category,
  isLast,
  onPress,
}: {
  category: Tables<'categories'>;
  isLast: boolean;
  onPress: () => void;
}) {
  const parsed = category.icon ? parseIcon(category.icon) : null;

  return (
    <Pressable style={[styles.row, !isLast && styles.rowBorder]} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: category.color + '20' }]}>
        {parsed ? (
          <Ionicons
            name={parsed.name as keyof typeof Ionicons.glyphMap}
            size={20}
            color={category.color}
          />
        ) : (
          <View style={[styles.iconDot, { backgroundColor: category.color }]} />
        )}
      </View>
      <Text style={styles.rowName} numberOfLines={1}>
        {category.name}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
    </Pressable>
  );
}

export default function CategoriesScreen() {
  const mgmt = useCategoryManagement();
  const { t } = useLanguage();

  // The ScrollView must be the screen's root view, or the native header and tab bar don't
  // track it (the tab bar stays transparent over the rows on iOS 18).
  return (
    <>
      <Stack.Screen
        options={headerActionOptions({
          sf: 'plus',
          md: 'add',
          label: t(k.categories.newCategory),
          onPress: mgmt.openAddForm,
        })}
      />

      {mgmt.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={mgmt.isRefreshing}
              onRefresh={mgmt.refetch}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
            />
          }
        >
          {mgmt.expenseCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t(k.common.expense)}</Text>
              <View style={styles.sectionCard}>
                {mgmt.expenseCategories.map((cat, i) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    isLast={i === mgmt.expenseCategories.length - 1}
                    onPress={() => mgmt.openEditForm(cat)}
                  />
                ))}
              </View>
            </View>
          )}

          {mgmt.incomeCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t(k.common.income)}</Text>
              <View style={styles.sectionCard}>
                {mgmt.incomeCategories.map((cat, i) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    isLast={i === mgmt.incomeCategories.length - 1}
                    onPress={() => mgmt.openEditForm(cat)}
                  />
                ))}
              </View>
            </View>
          )}

          {mgmt.expenseCategories.length === 0 && mgmt.incomeCategories.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="grid-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyText}>{t(k.categories.noCategories)}</Text>
              <Text style={styles.emptySubtext}>{t(k.categories.addFirst)}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.md,
    paddingBottom: design.spacing.lg,
  },
  section: {
    marginBottom: design.spacing.lg,
  },
  sectionTitle: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: design.spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: design.radius.lg,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    ...design.shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.md - 2,
    paddingHorizontal: design.spacing.md,
    gap: design.spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  rowName: {
    flex: 1,
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[900],
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.xl * 2,
    gap: design.spacing.sm,
  },
  emptyText: {
    fontSize: design.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[400],
  },
  emptySubtext: {
    fontSize: design.fontSize.sm,
    color: colors.gray[400],
  },
});
