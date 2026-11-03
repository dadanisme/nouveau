import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionMenu } from '@/components/action-menu';
import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { CategoryPicker } from '@/components/category-picker';
import { DatePicker } from '@/components/date-picker';
import { headerActionOptions } from '@/components/header-action';
import { NumberPad } from '@/components/number-pad';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTransactionForm } from '@/hooks/use-transaction-form';
import { getDateLocale } from '@/lib/i18n';
import { k } from '@/locales/keys';
import { parseIcon } from '@/utils/icon';

export default function AddTransactionScreen() {
  const { id, date: dateParam } = useLocalSearchParams<{ id?: string; date?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const {
    type,
    description,
    selectedCategory,
    date,
    showCategoryPicker,
    showDatePicker,
    alertState,
    filteredCategories,
    isPending,
    isSubmitDisabled,
    isEditMode,
    isDeleting,
    isLoadingTransaction,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleTypeChange,
    handleKeyPress,
    getDisplayAmount,
    handleSubmit,
    handleDelete,
    setDescription,
    openCategoryPicker,
    closeCategoryPicker,
    selectCategory,
    openDatePicker,
    closeDatePicker,
    selectDate,
    dismissAlert,
  } = useTransactionForm(id, dateParam);

  const amountColor = type === 'income' ? colors.income : colors.expense;

  return (
    // Legacy pickers (#27) are BottomSheetModals. The root provider's portal sits under this
    // native formSheet, so they need a provider inside the sheet to show on top of it.
    <BottomSheetModalProvider>
      <View style={styles.container}>
        {isEditMode && (
          <Stack.Screen
            options={headerActionOptions({
              sf: 'ellipsis.circle',
              md: 'more_vert',
              label: t(k.common.moreActions),
              onPress: () => setShowActionMenu(true),
            })}
          />
        )}

        <View style={styles.content}>
          {/* Top section */}
          <View style={styles.topSection}>
            <View style={styles.toggleRow}>
              <Button
                variant={type === 'income' ? 'dark' : 'outline'}
                style={StyleSheet.flatten([
                  styles.toggleButton,
                  type === 'income' && { backgroundColor: colors.income },
                ])}
                onPress={() => handleTypeChange('income')}
              >
                <Text style={[styles.toggleText, type === 'income' && styles.toggleTextActive]}>
                  {t(k.addTransaction.income)}
                </Text>
              </Button>
              <Button
                variant={type === 'expense' ? 'dark' : 'outline'}
                style={StyleSheet.flatten([
                  styles.toggleButton,
                  type === 'expense' && { backgroundColor: colors.expense },
                ])}
                onPress={() => handleTypeChange('expense')}
              >
                <Text style={[styles.toggleText, type === 'expense' && styles.toggleTextActive]}>
                  {t(k.addTransaction.expense)}
                </Text>
              </Button>
            </View>

            <View style={styles.amountSectionContainer}>
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>{t(k.addTransaction.amount)}</Text>
                {isEditMode && isLoadingTransaction ? (
                  <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                ) : (
                  <Text style={[styles.amountText, { color: amountColor }]}>
                    {getDisplayAmount()}
                  </Text>
                )}
              </View>

              <TextInput
                style={styles.descriptionInput}
                placeholder={t(k.addTransaction.addNote)}
                placeholderTextColor={colors.gray[400]}
                value={description}
                onChangeText={setDescription}
                maxLength={100}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
            <View style={styles.selectorRow}>
              <Button variant="outline" style={styles.pill} onPress={openCategoryPicker}>
                {selectedCategory ? (
                  (() => {
                    const parsed = selectedCategory.icon ? parseIcon(selectedCategory.icon) : null;
                    return parsed ? (
                      <Ionicons
                        name={parsed.name as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={selectedCategory.color}
                      />
                    ) : (
                      <View
                        style={[styles.categoryDot, { backgroundColor: selectedCategory.color }]}
                      />
                    );
                  })()
                ) : (
                  <Ionicons name="grid-outline" size={16} color={colors.gray[500]} />
                )}
                <Text style={[styles.pillText, !selectedCategory && styles.pillTextPlaceholder]}>
                  {selectedCategory?.name ?? t(k.addTransaction.category)}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.gray[400]} />
              </Button>

              <Button variant="outline" style={styles.pill} onPress={openDatePicker}>
                <Ionicons name="calendar-outline" size={16} color={colors.gray[600]} />
                <Text style={styles.pillText}>
                  {date.toLocaleDateString(getDateLocale(), {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.gray[400]} />
              </Button>
            </View>
          </View>

          {/* Bottom section */}
          <View
            style={[styles.bottomSection, { paddingBottom: insets.bottom + design.spacing.sm }]}
          >
            <NumberPad onKeyPress={handleKeyPress} />
            {isEditMode ? (
              <View style={styles.submitRow}>
                <Button
                  variant="outline"
                  style={styles.deleteButton}
                  onPress={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={colors.expense} />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color={colors.expense} />
                      <Text style={styles.deleteText}>{t(k.addTransaction.delete)}</Text>
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  style={styles.saveButton}
                  onPress={() => handleSubmit('save')}
                  disabled={isSubmitDisabled}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color={colors.black} />
                  ) : (
                    <Text style={styles.submitText}>{t(k.common.update)}</Text>
                  )}
                </Button>
              </View>
            ) : (
              <View style={styles.submitRow}>
                <Button
                  variant="outline"
                  style={styles.addMoreButton}
                  onPress={() => handleSubmit('add-more')}
                  disabled={isSubmitDisabled}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color={colors.gray[700]} />
                  ) : (
                    <Text style={styles.addMoreText}>{t(k.addTransaction.addMore)}</Text>
                  )}
                </Button>
                <Button
                  variant="primary"
                  style={styles.saveButton}
                  onPress={() => handleSubmit('save')}
                  disabled={isSubmitDisabled}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color={colors.black} />
                  ) : (
                    <Text style={styles.submitText}>{t(k.common.save)}</Text>
                  )}
                </Button>
              </View>
            )}
          </View>
        </View>

        <CategoryPicker
          visible={showCategoryPicker}
          categories={filteredCategories}
          selectedCategoryId={selectedCategory?.id ?? null}
          onSelect={selectCategory}
          onDismiss={closeCategoryPicker}
        />

        <DatePicker
          visible={showDatePicker}
          value={date}
          onSelect={selectDate}
          onDismiss={closeDatePicker}
        />

        <Alert
          visible={!!alertState}
          title={alertState?.title ?? ''}
          message={alertState?.message}
          onDismiss={dismissAlert}
        />

        <Alert
          visible={showDeleteConfirm}
          title={t(k.addTransaction.deleteTransaction)}
          message={t(k.addTransaction.deleteTransactionMessage)}
          actions={[
            { label: t(k.common.cancel), onPress: () => setShowDeleteConfirm(false) },
            { label: t(k.common.delete), variant: 'dark', onPress: handleDelete },
          ]}
          onDismiss={() => setShowDeleteConfirm(false)}
        />

        <ActionMenu
          visible={showActionMenu}
          onDismiss={() => setShowActionMenu(false)}
          actions={[
            {
              icon: 'document-text-outline',
              label: t(k.addTransaction.viewProofs),
              onPress: () => {
                if (id) router.push({ pathname: '/proof-viewer', params: { transactionId: id } });
              },
            },
            {
              icon: 'trash-outline',
              label: t(k.common.delete),
              destructive: true,
              onPress: () => setShowDeleteConfirm(true),
            },
          ]}
        />
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: design.spacing.md,
    paddingHorizontal: design.spacing.lg,
    gap: design.spacing.lg,
  },
  topSection: {
    gap: design.spacing.md,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: design.spacing.sm + 2,
  },
  toggleText: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[600],
  },
  toggleTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  amountSectionContainer: {
    flex: 1,
  },
  amountSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: design.spacing.md,
  },
  amountLabel: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[400],
    marginBottom: design.spacing.xs,
  },
  amountText: {
    fontSize: design.fontSize['3xl'],
    fontWeight: '900',
  },
  descriptionInput: {
    fontSize: design.fontSize.sm,
    color: colors.gray[800],
    textAlign: 'center',
    paddingVertical: design.spacing.sm,
    paddingHorizontal: design.spacing.md,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    borderRadius: design.radius.sm,
    backgroundColor: colors.white,
    ...design.shadow,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  pill: {
    flex: 1,
    borderRadius: design.radius.md,
    paddingVertical: design.spacing.md - 2,
    paddingHorizontal: design.spacing.md,
  },
  pillText: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[800],
  },
  pillTextPlaceholder: {
    color: colors.gray[400],
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  bottomSection: {
    gap: design.spacing.lg,
  },
  submitRow: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  addMoreButton: {
    flex: 2,
  },
  deleteButton: {
    flex: 2,
    borderColor: colors.expense,
  },
  deleteText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.expense,
  },
  saveButton: {
    flex: 3,
  },
  addMoreText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.gray[700],
  },
  submitText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.black,
  },
});
