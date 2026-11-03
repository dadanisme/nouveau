import { DatePickerDialog, ListItem, Text } from '@expo/ui/jetpack-compose';
import { clickable } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';

import type { DateFieldRowProps } from '@/components/date-field-row';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';
import { formatMediumDate, fromUtcMidnight, toUtcMidnightString } from '@/utils/date';

/**
 * A date row: a Material `ListItem` with the date as supporting text; tapping it opens the
 * Material 3 `DatePickerDialog`. Compose pickers work in UTC-midnight days, so the value is
 * converted to and from the local calendar day.
 */
export function DateFieldRow({ title, value, onChange }: DateFieldRowProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ListItem modifiers={[clickable(() => setIsOpen(true))]}>
        <ListItem.HeadlineContent>
          <Text>{title}</Text>
        </ListItem.HeadlineContent>
        <ListItem.SupportingContent>
          <Text>{formatMediumDate(value.toISOString())}</Text>
        </ListItem.SupportingContent>
      </ListItem>
      {isOpen ? (
        <DatePickerDialog
          initialDate={toUtcMidnightString(value)}
          confirmButtonLabel={t(k.common.ok)}
          dismissButtonLabel={t(k.common.cancel)}
          onDateSelected={(date) => {
            setIsOpen(false);
            onChange(fromUtcMidnight(date));
          }}
          onDismissRequest={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
