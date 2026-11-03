import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useWorkspaceSwitcherSheet } from '@/hooks/use-workspace-switcher-sheet';
import { k } from '@/locales/keys';

/**
 * Workspace switcher sheet: picking a workspace makes it active and closes the sheet. The rows are
 * legacy markup until #33 rebuilds them as a native list.
 */
export default function WorkspaceSwitcherSheet() {
  const { t } = useLanguage();
  const { workspaces, currentWorkspaceId, selectWorkspace } = useWorkspaceSwitcherSheet();

  return (
    // First child so iOS can expand the sheet when it's scrolled to the edge.
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <Text style={styles.title}>{t(k.workspace.switch)}</Text>
      {workspaces.map((ws, idx) => {
        const isActive = ws.id === currentWorkspaceId;
        return (
          <Pressable
            key={ws.id}
            style={[styles.row, idx < workspaces.length - 1 && styles.rowBorder]}
            onPress={() => selectWorkspace(ws.id)}
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
    paddingBottom: design.spacing.xl,
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
});
