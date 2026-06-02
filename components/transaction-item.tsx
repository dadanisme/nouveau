import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';

import { colors, design } from '@/constants/colors';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { formatCompactAmount, formatForeignAmount } from '@/utils/currency';
import { formatShortDate } from '@/utils/date';
import { parseIcon } from '@/utils/icon';

export interface TransactionItemData {
  id: string;
  description: string | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  date: string;
  /** Amount in the workspace's home currency */
  amount: number;
  /** Original amount/currency when the transaction was made in a foreign currency */
  originalAmount?: number;
  originalCurrency?: string;
  type: 'income' | 'expense';
  hasProofs?: boolean;
}

interface TransactionItemProps {
  transaction: TransactionItemData;
  isLast?: boolean;
  showDate?: boolean;
  onPress?: () => void;
  onViewProofs?: () => void;
  onDelete?: () => void;
  /** Include the Edit entry (mapped to onPress) in the long-press menu. Defaults to true. */
  showEditMenuAction?: boolean;
}

export function TransactionItem({
  transaction,
  isLast,
  showDate = true,
  onPress,
  onViewProofs,
  onDelete,
  showEditMenuAction = true,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? colors.income : colors.expense;
  const amountPrefix = isIncome ? '+' : '-';
  const icon = transaction.categoryIcon ? parseIcon(transaction.categoryIcon) : null;

  const hasContextMenu = !!(onDelete || onViewProofs);
  const pressStartRef = useRef(0);
  const pressPositionRef = useRef({ x: 0, y: 0 });

  // When a ContextMenu wraps a Pressable, the long press that opens the context
  // menu still propagates as a regular press to the inner Pressable, causing both
  // the menu and the onPress action to fire. To work around this, we avoid using
  // Pressable when a context menu is present and instead use raw touch events with
  // a timing threshold — only taps shorter than 300ms that haven't moved more than
  // 10px are treated as a press. This prevents scrolling from triggering onPress.
  const content = (
    <View
      style={[styles.container, !isLast && styles.border]}
      {...(onPress && hasContextMenu
        ? {
            onTouchStart: (e) => {
              pressStartRef.current = Date.now();
              pressPositionRef.current = {
                x: e.nativeEvent.pageX,
                y: e.nativeEvent.pageY,
              };
            },
            onTouchEnd: (e) => {
              const dx = e.nativeEvent.pageX - pressPositionRef.current.x;
              const dy = e.nativeEvent.pageY - pressPositionRef.current.y;
              const moved = Math.sqrt(dx * dx + dy * dy) > 10;
              if (!moved && Date.now() - pressStartRef.current < 300) {
                onPress();
              }
            },
          }
        : {})}
    >
      <View style={[styles.icon, { backgroundColor: transaction.categoryColor + '20' }]}>
        {icon ? (
          <Ionicons
            name={icon.name as React.ComponentProps<typeof Ionicons>['name']}
            size={18}
            color={transaction.categoryColor}
          />
        ) : (
          <View style={[styles.iconDot, { backgroundColor: transaction.categoryColor }]} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description ?? transaction.categoryName}
        </Text>
        <View style={styles.metaRow}>
          {transaction.hasProofs && <Ionicons name="attach" size={12} color={colors.gray[400]} />}
          <Text style={styles.meta}>
            {transaction.categoryName}
            {showDate ? ` \u00B7 ${formatShortDate(transaction.date)}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.amountColumn}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}
          {formatCompactAmount(transaction.amount)}
        </Text>
        {transaction.originalAmount != null && transaction.originalCurrency && (
          <Text style={styles.originalAmount}>
            {formatForeignAmount(transaction.originalAmount, transaction.originalCurrency)}
          </Text>
        )}
      </View>
    </View>
  );

  if (hasContextMenu) {
    const handlers = [
      ...(showEditMenuAction ? [onPress] : []),
      ...(transaction.hasProofs ? [onViewProofs] : []),
      onDelete,
    ];
    const menuActions = [
      ...(showEditMenuAction ? [{ title: i18n.t(k.contextMenu.edit), systemIcon: 'pencil' }] : []),
      ...(transaction.hasProofs
        ? [{ title: i18n.t(k.contextMenu.viewProofs), systemIcon: 'doc.text.magnifyingglass' }]
        : []),
      { title: i18n.t(k.contextMenu.delete), systemIcon: 'trash', destructive: true },
    ];

    return (
      <ContextMenu
        actions={menuActions}
        onPress={(e: { nativeEvent: { index: number } }) => {
          handlers[e.nativeEvent.index]?.();
        }}
        previewBackgroundColor="transparent"
      >
        {content}
      </ContextMenu>
    );
  }

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.sm + 4,
    gap: design.spacing.sm + 4,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: design.radius.sm,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  description: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[900],
  },
  meta: {
    fontSize: design.fontSize.xs,
    color: colors.gray[400],
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  amountColumn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amount: {
    fontSize: design.fontSize.md,
    fontWeight: '800',
  },
  originalAmount: {
    fontSize: design.fontSize.xs,
    color: colors.gray[400],
    fontWeight: '500',
  },
});
