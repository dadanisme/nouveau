import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useCategoryForm } from '@/hooks/use-category-form';
import { k } from '@/locales/keys';

/**
 * Add / edit category sheet. Param: `id` (edit). The icon and color pickers open as sheets over
 * it. The form is legacy markup until #31 rebuilds it natively.
 */
export default function CategoryFormSheet() {
  const { t } = useLanguage();
  const form = useCategoryForm();

  return (
    // First child so iOS can expand the sheet when it's scrolled to the edge; the native sheet
    // moves up with the keyboard on both platforms.
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <Text style={styles.title}>
        {form.isEditing ? t(k.categories.editCategory) : t(k.categories.newCategory)}
      </Text>

      {form.isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <>
          <TextInput
            style={styles.nameInput}
            placeholder={t(k.categories.categoryName)}
            placeholderTextColor={colors.gray[400]}
            value={form.name}
            onChangeText={form.setName}
            maxLength={50}
            autoFocus={!form.isEditing}
            returnKeyType="done"
          />

          <View style={styles.typeRow}>
            <Button
              variant={form.type === 'expense' ? 'dark' : 'outline'}
              style={StyleSheet.flatten([
                styles.typeButton,
                form.type === 'expense' && { backgroundColor: colors.expense },
              ])}
              onPress={() => form.setType('expense')}
              accessibilityState={{ selected: form.type === 'expense' }}
            >
              <Text style={[styles.typeText, form.type === 'expense' && styles.typeTextActive]}>
                {t(k.common.expense)}
              </Text>
            </Button>
            <Button
              variant={form.type === 'income' ? 'dark' : 'outline'}
              style={StyleSheet.flatten([
                styles.typeButton,
                form.type === 'income' && { backgroundColor: colors.income },
              ])}
              onPress={() => form.setType('income')}
              accessibilityState={{ selected: form.type === 'income' }}
            >
              <Text style={[styles.typeText, form.type === 'income' && styles.typeTextActive]}>
                {t(k.common.income)}
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
                {t(k.categories.icon)}
              </Text>
            </Button>

            <Button variant="outline" style={styles.pickerButton} onPress={form.openColorPicker}>
              <View style={[styles.colorDot, { backgroundColor: form.color }]} />
              <Text style={styles.pickerText}>{t(k.categories.color)}</Text>
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
              <Text style={styles.saveText}>
                {form.isEditing ? t(k.common.update) : t(k.common.save)}
              </Text>
            )}
          </Button>

          {form.isEditing && (
            <Button
              variant="outline"
              style={styles.deleteButton}
              onPress={form.requestDelete}
              disabled={form.isPending}
            >
              <Ionicons name="trash-outline" size={18} color={colors.expense} />
              <Text style={styles.deleteText}>{t(k.categories.deleteCategory)}</Text>
            </Button>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: design.spacing.xl,
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.xl,
    gap: design.spacing.md,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
  },
  loading: {
    marginTop: design.spacing.lg,
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
});
