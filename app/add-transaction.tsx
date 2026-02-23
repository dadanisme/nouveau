import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { CategoryPicker } from '@/components/category-picker';
import { NumberPad } from '@/components/number-pad';
import { colors, design } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store';
import type { Tables } from '@/types/supabase';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountString, setAmountString] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Tables<'categories'> | null>(null);
  const [date, setDate] = useState(new Date());
  const [categories, setCategories] = useState<Tables<'categories'>[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data);
    }
    loadCategories();
  }, []);

  function handleTypeChange(newType: 'income' | 'expense') {
    setType(newType);
    setSelectedCategory((prev) => (prev && prev.type !== newType ? null : prev));
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  function handleKeyPress(key: string) {
    Keyboard.dismiss();
    if (key === 'backspace') {
      setAmountString((prev) => prev.slice(0, -1));
      return;
    }
    setAmountString((prev) => {
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      // Max 2 decimal places
      const dotIndex = prev.indexOf('.');
      if (dotIndex !== -1 && prev.length - dotIndex >= 3) return prev;
      // No leading zeros
      if (prev === '0' && key !== '.') return key;
      // Limit length
      if (prev.replace('.', '').length >= 10) return prev;
      return prev + key;
    });
  }

  function formatDisplayAmount(): string {
    if (!amountString) return '$0';
    if (amountString === '0.') return '$0.';
    const parts = amountString.split('.');
    const intPart = parseInt(parts[0] || '0', 10).toLocaleString('en-US');
    if (parts.length === 2) {
      return `$${intPart}.${parts[1]}`;
    }
    return `$${intPart}`;
  }

  async function handleSubmit() {
    const amount = parseFloat(amountString);
    if (!amount || amount <= 0) {
      setAlertState({ title: 'Invalid Amount', message: 'Please enter a valid amount.' });
      return;
    }
    if (!selectedCategory) {
      setAlertState({ title: 'No Category', message: 'Please select a category.' });
      return;
    }

    const userId = session?.user.id;
    if (!userId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        amount,
        category_id: selectedCategory.id,
        date: date.toISOString().split('T')[0],
        description: description.trim() || null,
        type,
        user_id: userId,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      setAlertState({
        title: 'Failed to Save',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const amountColor = type === 'income' ? colors.income : colors.expense;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </Button>
        <Text style={styles.headerTitle}>Add Transaction</Text>
        <View style={styles.headerSpacer} />
      </View>

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
                Income
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
                Expense
              </Text>
            </Button>
          </View>

          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={[styles.amountText, { color: amountColor }]}>{formatDisplayAmount()}</Text>
          </View>

          <TextInput
            style={styles.descriptionInput}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.gray[400]}
            value={description}
            onChangeText={setDescription}
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <View style={styles.selectorRow}>
            <Button
              variant="outline"
              style={styles.pill}
              onPress={() => {
                Keyboard.dismiss();
                setShowCategoryPicker(true);
              }}
            >
              {selectedCategory ? (
                <View style={[styles.categoryDot, { backgroundColor: selectedCategory.color }]} />
              ) : (
                <Ionicons name="grid-outline" size={16} color={colors.gray[500]} />
              )}
              <Text style={[styles.pillText, !selectedCategory && styles.pillTextPlaceholder]}>
                {selectedCategory?.name ?? 'Category'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.gray[400]} />
            </Button>

            <Button
              variant="outline"
              style={styles.pill}
              onPress={() => {
                Keyboard.dismiss();
                setShowDatePicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.gray[600]} />
              <Text style={styles.pillText}>
                {date.toLocaleDateString('en-US', {
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
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + design.spacing.sm }]}>
          <NumberPad onKeyPress={handleKeyPress} />
          <Button
            variant="primary"
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting || !amountString || amountString === '0'}
          >
            <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Add Transaction'}</Text>
          </Button>
        </View>
      </View>

      <CategoryPicker
        visible={showCategoryPicker}
        categories={filteredCategories}
        selectedCategoryId={selectedCategory?.id ?? null}
        onSelect={(category) => {
          setSelectedCategory(category);
          setShowCategoryPicker(false);
        }}
        onDismiss={() => setShowCategoryPicker(false)}
      />

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible
          transparent
          animationType="none"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.dateOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.dateSheet}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateTitle}>Select Date</Text>
                <Button
                  variant="primary"
                  style={styles.dateDone}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.dateDoneText}>Done</Text>
                </Button>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={(_, selectedDate) => {
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <Alert
        visible={!!alertState}
        title={alertState?.title ?? ''}
        message={alertState?.message}
        onDismiss={() => setAlertState(null)}
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: design.spacing.lg,
  },
  topSection: {
    gap: design.spacing.md,
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
  amountSection: {
    alignItems: 'center',
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  selectorRow: {
    flexDirection: 'row',
    gap: design.spacing.sm,
  },
  pill: {
    flex: 1,
    borderRadius: design.radius.full,
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
  submitButton: {
    width: '100%',
  },
  submitText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.black,
  },
  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dateSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: design.radius.xl,
    borderTopRightRadius: design.radius.xl,
    borderWidth: design.borderWidth,
    borderBottomWidth: 0,
    borderColor: colors.black,
    paddingBottom: design.spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.md,
    paddingBottom: design.spacing.sm,
  },
  dateTitle: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
  },
  dateDone: {
    paddingVertical: design.spacing.sm,
    paddingHorizontal: design.spacing.md,
  },
  dateDoneText: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.black,
  },
});
