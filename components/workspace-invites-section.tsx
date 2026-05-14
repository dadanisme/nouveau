import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';
import { formatShortDate } from '@/utils/date';

interface PendingInvite {
  id: string;
  email: string;
  expires_at: string;
}

interface WorkspaceInvitesSectionProps {
  invites: PendingInvite[];
  onRevoke: (inviteId: string) => void;
}

export function WorkspaceInvitesSection({ invites, onRevoke }: WorkspaceInvitesSectionProps) {
  const { t } = useLanguage();

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t(k.workspace.pendingInvites)}</Text>
        <Text style={styles.sectionMeta}>
          {t(k.workspace.invitesCount, { count: invites.length })}
        </Text>
      </View>
      <Card style={styles.listCard}>
        {invites.length === 0 ? (
          <Text style={styles.emptyRow}>{t(k.workspace.noInvites)}</Text>
        ) : (
          invites.map((inv, idx) => (
            <View key={inv.id} style={[styles.row, idx < invites.length - 1 && styles.rowBorder]}>
              <View style={styles.rowIcon}>
                <Ionicons name="mail-outline" size={18} color={colors.gray[700]} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{inv.email}</Text>
                <Text style={styles.rowMeta}>
                  {t(k.workspace.expiresAt, { date: formatShortDate(inv.expires_at) })}
                </Text>
              </View>
              <Button variant="outline" onPress={() => onRevoke(inv.id)} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>{t(k.workspace.revoke)}</Text>
              </Button>
            </View>
          ))
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
