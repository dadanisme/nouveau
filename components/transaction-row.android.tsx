import {
  Column,
  DropdownMenu,
  DropdownMenuItem,
  ListItem,
  Row,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { clickable, combinedClickable } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';

import { ComposeSymbolIcon } from '@/components/compose-symbol-icon';
import type { TransactionRowProps } from '@/components/transaction-row-types';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

const PROOF_SYMBOL = { sf: 'paperclip', material: 'attach_file' } as const;
const PROOF_ICON_SIZE = 16;

type MenuAction = { key: string; label: string; destructive?: boolean; onPress: () => void };

/**
 * A transaction as a Material 3 list item inside `NativeForm`: the category symbol leading, title
 * over category (with a paperclip when it has proofs) and the signed amount trailing. Tap runs
 * `onPress`; long-press opens a dropdown menu (Edit / View Proofs / Delete). Compose in
 * `@expo/ui` has no swipe-to-dismiss, so Delete lives in the menu only.
 */
export function TransactionRow({
  transaction: tx,
  onPress,
  onEdit,
  onViewProofs,
  onDelete,
}: TransactionRowProps) {
  const colors = useMaterialColors();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const actions: MenuAction[] = [];
  if (onEdit) actions.push({ key: 'edit', label: t(k.contextMenu.edit), onPress: onEdit });
  if (tx.hasProofs && onViewProofs) {
    actions.push({ key: 'proofs', label: t(k.contextMenu.viewProofs), onPress: onViewProofs });
  }
  if (onDelete) {
    actions.push({
      key: 'delete',
      label: t(k.contextMenu.delete),
      destructive: true,
      onPress: onDelete,
    });
  }

  const item = (
    <ListItem
      modifiers={[
        actions.length > 0
          ? combinedClickable({ onClick: onPress, onLongClick: () => setMenuOpen(true) })
          : clickable(onPress),
      ]}
    >
      <ListItem.LeadingContent>
        <ComposeSymbolIcon symbol={tx.symbol} />
      </ListItem.LeadingContent>
      <ListItem.HeadlineContent>
        <Text maxLines={1} overflow="ellipsis">
          {tx.title}
        </Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 4 }}>
          {tx.hasProofs ? (
            <ComposeSymbolIcon
              symbol={{ ...PROOF_SYMBOL, color: colors.onSurfaceVariant }}
              iconSize={PROOF_ICON_SIZE}
            />
          ) : null}
          <Text maxLines={1} overflow="ellipsis">
            {tx.subtitle}
          </Text>
        </Row>
      </ListItem.SupportingContent>
      <ListItem.TrailingContent>
        {/* No green in Material 3's roles: income is told apart by its `+` sign. */}
        <Column horizontalAlignment="end">
          <Text color={colors.onSurface} style={{ typography: 'bodyLarge' }}>
            {tx.amount}
          </Text>
          {tx.originalAmount ? (
            <Text color={colors.onSurfaceVariant} style={{ typography: 'bodySmall' }}>
              {tx.originalAmount}
            </Text>
          ) : null}
        </Column>
      </ListItem.TrailingContent>
    </ListItem>
  );

  if (actions.length === 0) return item;

  return (
    <DropdownMenu expanded={menuOpen} onDismissRequest={() => setMenuOpen(false)}>
      <DropdownMenu.Trigger>{item}</DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            onClick={() => {
              setMenuOpen(false);
              action.onPress();
            }}
          >
            <DropdownMenuItem.Text>
              <Text color={action.destructive ? colors.error : undefined}>{action.label}</Text>
            </DropdownMenuItem.Text>
          </DropdownMenuItem>
        ))}
      </DropdownMenu.Items>
    </DropdownMenu>
  );
}
