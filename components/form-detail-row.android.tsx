import { Icon, ListItem, Text, useMaterialColors } from '@expo/ui/jetpack-compose';

import type { FormDetailRowProps } from '@/components/form-extras-types';

/**
 * A non-interactive M3 list item: headline, optional supporting text, optional leading icon and
 * an optional trailing status icon (`primary` check / `error` cross). Compose text isn't
 * selectable here, so `selectable` is iOS only.
 */
export function FormDetailRow({ title, subtitle, icon, status }: FormDetailRowProps) {
  const colors = useMaterialColors();
  return (
    <ListItem>
      {icon ? (
        <ListItem.LeadingContent>
          <Icon source={icon.md} />
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
          <Icon
            source={
              status.tone === 'positive'
                ? require('@/assets/icons/check_circle.xml')
                : require('@/assets/icons/cancel.xml')
            }
            tint={status.tone === 'positive' ? colors.primary : colors.error}
            contentDescription={status.label}
          />
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  );
}
