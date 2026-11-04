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
  layoutPriority,
  lineLimit,
  monospacedDigit,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { PlatformColor } from 'react-native';

import { RowSymbol } from '@/components/row-symbol';
import type { TransactionRowProps } from '@/components/transaction-row-types';
import { useLanguage } from '@/contexts/language';
import { useIsAccessibilityTextSize } from '@/hooks/use-accessibility-text-size';
import { k } from '@/locales/keys';

// Explicit label colors: inside a Button, hierarchical styles resolve against the accent tint.
const PRIMARY = foregroundStyle(PlatformColor('label'));
const SECONDARY = foregroundStyle(PlatformColor('secondaryLabel'));
// Income reads in the system green (as in Wallet); expenses stay in the primary label color.
const INCOME = foregroundStyle(PlatformColor('systemGreen'));

/**
 * A transaction in a native `Form` section (`@/components/native-form`): the category symbol,
 * title over category (with a paperclip when it has proofs), and the signed amount trailing. At
 * accessibility text sizes it stacks instead (symbol, title, category, amount), with no line limits.
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
  const isStacked = useIsAccessibilityTextSize();
  const showProofs = tx.hasProofs && onViewProofs;
  const singleLine = isStacked ? [] : [lineLimit(1)];

  const title = <Text modifiers={[PRIMARY, ...singleLine]}>{tx.title}</Text>;
  // No subtitle line when there's neither a category to name nor proofs to flag.
  const subtitle =
    tx.subtitle || tx.hasProofs ? (
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
        {tx.subtitle ? (
          <Text modifiers={[font({ textStyle: 'subheadline' }), SECONDARY, ...singleLine]}>
            {tx.subtitle}
          </Text>
        ) : null}
      </HStack>
    ) : null;
  const amount = (
    <Text modifiers={[tx.isIncome ? INCOME : PRIMARY, monospacedDigit()]}>{tx.amount}</Text>
  );
  const originalAmount = tx.originalAmount ? (
    <Text modifiers={[font({ textStyle: 'caption' }), SECONDARY, monospacedDigit()]}>
      {tx.originalAmount}
    </Text>
  ) : null;

  const row = (
    <Button onPress={onPress}>
      {isStacked ? (
        <HStack>
          <VStack alignment="leading" spacing={4}>
            <RowSymbol symbol={tx.symbol} />
            {title}
            {subtitle}
            {amount}
            {originalAmount}
          </VStack>
          <Spacer />
        </HStack>
      ) : (
        <HStack spacing={12}>
          <RowSymbol symbol={tx.symbol} />
          <VStack alignment="leading" spacing={2}>
            {title}
            {subtitle}
          </VStack>
          <Spacer />
          {/* The amount never truncates; the title gives way first. */}
          <VStack alignment="trailing" spacing={2} modifiers={[layoutPriority(1)]}>
            {amount}
            {originalAmount}
          </VStack>
        </HStack>
      )}
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
