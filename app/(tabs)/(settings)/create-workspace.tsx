import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { COMMON_CURRENCIES } from '@/constants/currencies';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useCreateWorkspace } from '@/hooks/use-workspaces';
import { k } from '@/locales/keys';

export default function CreateWorkspaceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { switchWorkspace } = useWorkspace();
  const createWorkspace = useCreateWorkspace();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<string>('IDR');

  const isSubmitDisabled = createWorkspace.isPending || name.trim().length === 0;

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createWorkspace.mutate(
      { name: trimmed, home_currency: currency },
      {
        onSuccess: async (newId) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (newId) await switchWorkspace(newId);
          router.back();
        },
        onError: (error) => {
          Alert.alert(
            t(k.workspace.failedToCreate),
            error instanceof Error ? error.message : t(k.common.unexpectedError),
          );
        },
      },
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t(k.workspace.workspaceName)}</Text>
        <Card style={styles.inputCard}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t(k.workspace.workspaceNamePlaceholder)}
            placeholderTextColor={colors.gray[400]}
            style={styles.input}
            autoFocus
          />
        </Card>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t(k.workspace.homeCurrency)}</Text>
        <View style={styles.currencyRow}>
          {COMMON_CURRENCIES.map((code) => {
            const active = code === currency;
            return (
              <Button
                key={code}
                variant={active ? 'dark' : 'outline'}
                style={StyleSheet.flatten([
                  styles.currencyPill,
                  active && { backgroundColor: colors.primary.DEFAULT },
                ])}
                onPress={() => setCurrency(code)}
              >
                <Text style={[styles.currencyText, active && styles.currencyTextActive]}>
                  {code}
                </Text>
              </Button>
            );
          })}
        </View>
      </View>

      <Button
        variant="primary"
        onPress={handleSubmit}
        disabled={isSubmitDisabled}
        style={styles.submitButton}
      >
        <Ionicons name="checkmark" size={20} color={colors.black} />
        <Text style={styles.submitText}>
          {createWorkspace.isPending ? t(k.common.pleaseWait) : t(k.workspace.create)}
        </Text>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.lg,
    gap: design.spacing.lg,
  },
  fieldGroup: {
    gap: design.spacing.sm,
  },
  fieldLabel: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCard: {
    paddingVertical: design.spacing.sm + 2,
  },
  input: {
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[900],
    padding: 0,
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: design.spacing.sm,
  },
  currencyPill: {
    paddingVertical: design.spacing.sm,
    paddingHorizontal: design.spacing.md,
  },
  currencyText: {
    fontSize: design.fontSize.sm,
    fontWeight: '800',
    color: colors.gray[900],
  },
  currencyTextActive: {
    color: colors.black,
  },
  submitButton: {
    marginTop: design.spacing.md,
  },
  submitText: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
    color: colors.black,
  },
});
