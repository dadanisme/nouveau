import { useLocalSearchParams } from 'expo-router';

import { useSheetResponder } from '@/hooks/use-sheet-result';
import { parseLocalDateString } from '@/utils/date';

export interface DatePickerSheetParams {
  /** The selected date as `YYYY-MM-DD` (local); today when omitted or malformed. */
  value?: string;
  requestId: string;
}

/** Screen hook for the `date-picker` sheet route. */
export function useDatePickerSheet() {
  const { value } = useLocalSearchParams<Omit<DatePickerSheetParams, 'requestId'>>();
  const respond = useSheetResponder('date-picker');

  function selectDate(date: Date) {
    respond({ date });
  }

  return {
    value: parseLocalDateString(value) ?? new Date(),
    selectDate,
  };
}
