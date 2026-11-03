import { Box, Icon, ListItem, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { size } from '@expo/ui/jetpack-compose/modifiers';
import type { AndroidSymbol } from 'expo-symbols';

import type { FormDetailRowProps } from '@/components/form-extras-types';
import { useMaterialSymbolSources } from '@/hooks/use-material-symbol-sources';

const ICON_SIZE = 24;
const POSITIVE: AndroidSymbol = 'check_circle';
const NEGATIVE: AndroidSymbol = 'cancel';

/**
 * A non-interactive M3 list item: headline, optional supporting text, optional leading symbol and
 * an optional trailing status icon (`primary` check / `error` cross). Compose text isn't
 * selectable here, so `selectable` is iOS only.
 */
export function FormDetailRow({ title, subtitle, symbol, status }: FormDetailRowProps) {
  const colors = useMaterialColors();
  const statusSymbol = status?.tone === 'positive' ? POSITIVE : NEGATIVE;
  const sources = useMaterialSymbolSources(
    [...(symbol ? [symbol.material] : []), ...(status ? [statusSymbol] : [])],
    ICON_SIZE,
  );
  const symbolSource = symbol ? sources.get(symbol.material) : undefined;
  const statusSource = status ? sources.get(statusSymbol) : undefined;

  return (
    <ListItem>
      {symbol ? (
        <ListItem.LeadingContent>
          {symbolSource ? (
            <Icon source={symbolSource} size={ICON_SIZE} tint={symbol.color} />
          ) : (
            <Box modifiers={[size(ICON_SIZE, ICON_SIZE)]} />
          )}
        </ListItem.LeadingContent>
      ) : null}
      <ListItem.HeadlineContent>
        <Text>{title}</Text>
      </ListItem.HeadlineContent>
      {subtitle ? (
        <ListItem.SupportingContent>
          <Text>{subtitle}</Text>
        </ListItem.SupportingContent>
      ) : null}
      {status ? (
        <ListItem.TrailingContent>
          {statusSource ? (
            <Icon
              source={statusSource}
              size={ICON_SIZE}
              tint={status.tone === 'positive' ? colors.primary : colors.error}
              contentDescription={status.label}
            />
          ) : (
            <Box modifiers={[size(ICON_SIZE, ICON_SIZE)]} />
          )}
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}
