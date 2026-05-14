import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import type { WorkspaceMemberRow } from '@/hooks/use-workspace-members';
import { k } from '@/locales/keys';

interface WorkspaceMembersSectionProps {
  members: WorkspaceMemberRow[];
  currentUserId: string | undefined;
  isOwner: boolean;
  onRemoveMember: (member: { user_id: string; name: string }) => void;
}

export function WorkspaceMembersSection({
  members,
  currentUserId,
  isOwner,
  onRemoveMember,
}: WorkspaceMembersSectionProps) {
  const { t } = useLanguage();

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t(k.workspace.members)}</Text>
        <Text style={styles.sectionMeta}>
          {t(k.workspace.membersCount, { count: members.length })}
        </Text>
      </View>
      <Card style={styles.listCard}>
        {members.length === 0 ? (
          <Text style={styles.emptyRow}>{t(k.workspace.noMembers)}</Text>
        ) : (
          members.map((m, idx) => {
            const displayName = m.users?.display_name || m.users?.email || t(k.settings.unknown);
            const isSelf = m.user_id === currentUserId;
            return (
              <View
                key={m.user_id}
                style={[styles.row, idx < members.length - 1 && styles.rowBorder]}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name="person-outline" size={18} color={colors.gray[700]} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowName}>
                    {displayName}
                    {isSelf ? ` (${t(k.workspace.you)})` : ''}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {m.role === 'owner' ? t(k.workspace.owner) : t(k.workspace.member)}
                  </Text>
                </View>
                {isOwner && !isSelf && m.role !== 'owner' && (
                  <Button
                    variant="outline"
                    onPress={() => onRemoveMember({ user_id: m.user_id, name: displayName })}
                    style={styles.smallButton}
                  >
                    <Text style={styles.smallButtonText}>{t(k.workspace.remove)}</Text>
                  </Button>
                )}
              </View>
            );
          })
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: design.spacing.md,
  },
  sectionTitle: {
    fontSize: design.fontSize.xs,
    fontWeight: '700',
    color: colors.gray[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionMeta: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.sm + 2,
    paddingHorizontal: design.spacing.md,
    gap: design.spacing.sm + 4,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  rowIcon: {
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
  rowName: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  rowMeta: {
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
  },
  emptyRow: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.md,
    textAlign: 'center',
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: design.spacing.sm + 2,
    borderRadius: design.radius.sm,
  },
  smallButtonText: {
    fontSize: design.fontSize.xs,
    fontWeight: '700',
    color: colors.gray[900],
  },
});
