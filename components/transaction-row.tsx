import {
  Button,
  ContextMenu,
  HStack,
  Image,
  Spacer,
  SwipeActions,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  frame,
  layoutPriority,
  lineLimit,
  monospacedDigit,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';

import type { TransactionRowProps } from '@/components/transaction-row-types';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

// Explicit label colors: inside a Button, hierarchical styles resolve against the accent tint.
const PRIMARY = foregroundStyle(PlatformColor('label'));
const SECONDARY = foregroundStyle(PlatformColor('secondaryLabel'));
// Income reads in the system green (as in Wallet); expenses stay in the primary label color.
const INCOME = foregroundStyle(PlatformColor('systemGreen'));

// Leading glyph box, matching `FormListRow`, so titles line up across rows.
const SYMBOL_WIDTH = 28;

/**
 * A transaction in a native `Form` section (`@/components/native-form`): the category symbol,
 * title over category (with a paperclip when it has proofs), and the signed amount trailing.
 * Tap runs `onPress`; long-press opens a context menu (Edit / View Proofs / Delete); `onDelete`
 * also adds a trailing swipe action.
 */
export function TransactionRow({
  transaction: tx,
  onPress,
  onEdit,
  onViewProofs,
  onDelete,
}: TransactionRowProps) {
  const { t } = useLanguage();
  const showProofs = tx.hasProofs && onViewProofs;

  const row = (
    <Button onPress={onPress}>
      <HStack spacing={12}>
        <Image
          systemName={tx.symbol.sf}
          color={tx.symbol.color}
          modifiers={[frame({ width: SYMBOL_WIDTH, height: SYMBOL_WIDTH })]}
        />
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[PRIMARY, lineLimit(1)]}>{tx.title}</Text>
          <HStack spacing={4}>
            {tx.hasProofs ? (
              <Image
                systemName="paperclip"
                modifiers={[
                  font({ textStyle: 'caption' }),
                  SECONDARY,
                  accessibilityLabel(t(k.transactions.hasProofs)),
                ]}
              />
            ) : null}
            <Text modifiers={[font({ textStyle: 'subheadline' }), SECONDARY, lineLimit(1)]}>
              {tx.subtitle}
            </Text>
          </HStack>
        </VStack>
        <Spacer />
        {/* The amount never truncates; the title gives way first. */}
        <VStack alignment="trailing" spacing={2} modifiers={[layoutPriority(1)]}>
          <Text modifiers={[tx.isIncome ? INCOME : PRIMARY, monospacedDigit()]}>{tx.amount}</Text>
          {tx.originalAmount ? (
            <Text modifiers={[font({ textStyle: 'caption' }), SECONDARY, monospacedDigit()]}>
              {tx.originalAmount}
            </Text>
          ) : null}
        </VStack>
      </HStack>
    </Button>
  );

  const hasMenu = Boolean(onEdit || showProofs || onDelete);
  const withMenu = hasMenu ? (
    <ContextMenu>
      <ContextMenu.Trigger>{row}</ContextMenu.Trigger>
      <ContextMenu.Items>
        {onEdit ? (
          <Button label={t(k.contextMenu.edit)} systemImage="pencil" onPress={onEdit} />
        ) : null}
        {showProofs ? (
          <Button
            label={t(k.contextMenu.viewProofs)}
            systemImage="doc.text.magnifyingglass"
            onPress={onViewProofs}
          />
        ) : null}
        {onDelete ? (
          <Button
            role="destructive"
            label={t(k.contextMenu.delete)}
            systemImage="trash"
            onPress={onDelete}
          />
        ) : null}
      </ContextMenu.Items>
    </ContextMenu>
  ) : (
    row
  );

  if (!onDelete) return withMenu;

  return (
    <SwipeActions>
      {withMenu}
      {/* Not `role="destructive"`: SwiftUI removes a destructive swipe row optimistically, before
          the confirmation, and Cancel can't bring it back. A red tint keeps the destructive look
          (the Host's accent tint would otherwise fill it orange). */}
      <SwipeActions.Actions edge="trailing">
        <Button
          label={t(k.contextMenu.delete)}
          systemImage="trash"
          onPress={onDelete}
          modifiers={[tint(PlatformColor('systemRed'))]}
        />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}
