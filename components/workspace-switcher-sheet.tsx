import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useWorkspace } from '@/contexts/workspace';
import { useMyWorkspaces } from '@/hooks/use-workspaces';
import { k } from '@/locales/keys';

interface WorkspaceSwitcherSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function WorkspaceSwitcherSheet({ visible, onDismiss }: WorkspaceSwitcherSheetProps) {
  const { t } = useLanguage();
  const { currentWorkspaceId, switchWorkspace } = useWorkspace();
  const { data: workspaces = [] } = useMyWorkspaces();

  function handleSelect(id: string) {
    if (id !== currentWorkspaceId) {
      switchWorkspace(id);
    }
    onDismiss();
  }

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{t(k.workspace.switch)}</Text>
        {workspaces.map((ws, idx) => {
          const isActive = ws.id === currentWorkspaceId;
          return (
            <Pressable
              key={ws.id}
              style={[styles.row, idx < workspaces.length - 1 && styles.rowBorder]}
              onPress={() => handleSelect(ws.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name={ws.is_personal ? 'person-outline' : 'people-outline'}
                  size={18}
                  color={colors.gray[700]}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{ws.name}</Text>
                <Text style={styles.rowSubtitle}>
                  {ws.is_personal ? t(k.workspace.personal) : t(k.workspace.shared)}
                  {' · '}
                  {ws.home_currency}
                </Text>
              </View>
              {isActive && <Ionicons name="checkmark" size={22} color={colors.primary.DEFAULT} />}
            </Pressable>
          );
        })}
        <View style={styles.bottomPad} />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.sm,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
    paddingVertical: design.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.sm + 4,
    gap: design.spacing.sm + 4,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  rowSubtitle: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
  },
  bottomPad: {
    height: design.spacing.lg,
  },
});
