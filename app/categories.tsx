import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/alert';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { ColorPicker } from '@/components/color-picker';
import { IconPicker } from '@/components/icon-picker';
import { colors, design } from '@/constants/colors';
import { useCategoryForm } from '@/hooks/use-category-form';
import { useCategoryManagement } from '@/hooks/use-category-management';
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

function CategoryFormSheet({
  visible,
  onDismiss,
  editingCategory,
  onDelete,
}: {
  visible: boolean;
  onDismiss: () => void;
  editingCategory: Tables<'categories'> | null;
  onDelete: () => void;
}) {
  const form = useCategoryForm({ editingCategory, onSuccess: onDismiss });

  return (
    <>
      <BottomSheet visible={visible} onDismiss={onDismiss} snapPoints={['55%']}>
        <BottomSheetView style={styles.formContent}>
          <Text style={styles.formTitle}>{form.isEditing ? 'Edit Category' : 'New Category'}</Text>

          <BottomSheetTextInput
            style={styles.nameInput}
            placeholder="Category name"
            placeholderTextColor={colors.gray[400]}
            value={form.name}
            onChangeText={form.setName}
            maxLength={50}
            autoFocus={!form.isEditing}
          />

          <View style={styles.typeRow}>
            <Button
              variant={form.type === 'expense' ? 'dark' : 'outline'}
              style={StyleSheet.flatten([
                styles.typeButton,
                form.type === 'expense' && { backgroundColor: colors.expense },
              ])}
              onPress={() => form.setType('expense')}
            >
              <Text style={[styles.typeText, form.type === 'expense' && styles.typeTextActive]}>
                Expense
              </Text>
            </Button>
            <Button
              variant={form.type === 'income' ? 'dark' : 'outline'}
              style={StyleSheet.flatten([
                styles.typeButton,
                form.type === 'income' && { backgroundColor: colors.income },
              ])}
              onPress={() => form.setType('income')}
            >
              <Text style={[styles.typeText, form.type === 'income' && styles.typeTextActive]}>
                Income
              </Text>
            </Button>
          </View>

          <View style={styles.pickerRow}>
            <Button variant="outline" style={styles.pickerButton} onPress={form.openIconPicker}>
              {form.icon ? (
                <Ionicons
                  name={form.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={form.color}
                />
              ) : (
                <Ionicons name="apps-outline" size={20} color={colors.gray[400]} />
              )}
              <Text style={[styles.pickerText, !form.icon && styles.pickerTextPlaceholder]}>
                Icon
              </Text>
            </Button>

            <Button variant="outline" style={styles.pickerButton} onPress={form.openColorPicker}>
              <View style={[styles.colorDot, { backgroundColor: form.color }]} />
              <Text style={styles.pickerText}>Color</Text>
            </Button>
          </View>

          <Button
            variant="primary"
            style={styles.saveButton}
            onPress={form.handleSubmit}
            disabled={form.isPending}
          >
            {form.isPending ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.saveText}>{form.isEditing ? 'Update' : 'Save'}</Text>
            )}
          </Button>

          {form.isEditing && (
            <Button variant="outline" style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.expense} />
              <Text style={styles.deleteText}>Delete Category</Text>
            </Button>
          )}
        </BottomSheetView>
      </BottomSheet>

      <IconPicker
        visible={form.showIconPicker}
        selectedIcon={form.icon}
        accentColor={form.color}
        onSelect={form.setIcon}
        onDismiss={form.closeIconPicker}
      />

      <ColorPicker
        visible={form.showColorPicker}
        selectedColor={form.color}
        onSelect={form.setColor}
        onDismiss={form.closeColorPicker}
      />

      <Alert
        visible={!!form.alertState}
        title={form.alertState?.title ?? ''}
        message={form.alertState?.message}
        onDismiss={form.dismissAlert}
      />
    </>
  );
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mgmt = useCategoryManagement();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </Button>
        <Text style={styles.headerTitle}>Categories</Text>
        <Button variant="outline" onPress={mgmt.openAddForm} style={styles.addButton}>
          <Ionicons name="add" size={22} color={colors.gray[900]} />
        </Button>
      </View>

      {mgmt.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + design.spacing.lg },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={mgmt.isRefreshing}
              onRefresh={mgmt.refetch}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
              progressViewOffset={insets.top}
            />
          }
        >
          {mgmt.expenseCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expense</Text>
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
              <Text style={styles.sectionTitle}>Income</Text>
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
              <Text style={styles.emptyText}>No categories yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first category</Text>
            </View>
          )}
        </ScrollView>
      )}

      <CategoryFormSheet
        visible={mgmt.showForm}
        onDismiss={mgmt.closeForm}
        editingCategory={mgmt.editingCategory}
        onDelete={() => {
          if (mgmt.editingCategory) {
            mgmt.confirmDelete(mgmt.editingCategory);
            mgmt.closeForm();
          }
        }}
      />

      <Alert
        visible={!!mgmt.deletingCategory}
        title="Delete Category"
        message={`Are you sure you want to delete "${mgmt.deletingCategory?.name}"?`}
        actions={[
          { label: 'Cancel', variant: 'outline', onPress: mgmt.cancelDelete },
          { label: 'Delete', variant: 'dark', onPress: mgmt.executeDelete },
        ]}
        onDismiss={mgmt.cancelDelete}
      />

      <Alert
        visible={!!mgmt.alertState}
        title={mgmt.alertState?.title ?? ''}
        message={mgmt.alertState?.message}
        onDismiss={mgmt.dismissAlert}
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
  addButton: {
    width: 40,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: design.radius.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.md,
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
  // Form styles
  formContent: {
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.lg,
    gap: design.spacing.md,
  },
  formTitle: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
  },
  nameInput: {
    fontSize: design.fontSize.md,
    color: colors.gray[900],
    paddingVertical: design.spacing.md - 2,
    paddingHorizontal: design.spacing.md,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    borderRadius: design.radius.md,
    backgroundColor: colors.white,
    ...design.shadow,
  },
  typeRow: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: design.spacing.sm + 2,
  },
  typeText: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[600],
  },
  typeTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  pickerButton: {
    flex: 1,
    borderRadius: design.radius.md,
    paddingVertical: design.spacing.md - 2,
  },
  pickerText: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[800],
  },
  pickerTextPlaceholder: {
    color: colors.gray[400],
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  saveButton: {
    marginTop: design.spacing.xs,
  },
  saveText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.black,
  },
  deleteButton: {
    borderColor: colors.expense,
    shadowColor: colors.expense,
  },
  deleteText: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.expense,
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
