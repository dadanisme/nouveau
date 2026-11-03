import { StyleSheet, View } from 'react-native';

import { CalendarGrid } from '@/components/calendar-grid';
import { design } from '@/constants/colors';
import { useDatePickerSheet } from '@/hooks/use-date-picker-sheet';

/**
 * Date picker sheet (fits its content). Params: `value` (YYYY-MM-DD), `requestId`; result:
 * `date-picker`. The calendar is legacy until #29 swaps in the native DatePicker.
 */
export default function DatePickerSheet() {
  const { value, selectDate } = useDatePickerSheet();

  return (
    <View style={styles.content}>
      <CalendarGrid value={value} onSelect={selectDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: design.spacing.xl,
  },
});
