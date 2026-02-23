import { useEffect, useMemo, useState } from 'react';

import { getDaysInMonth, getFirstDayOfWeek } from '@/utils/date';

interface UseCalendarOptions {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
}

export function useCalendar({ visible, value, onSelect }: UseCalendarOptions) {
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (visible) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [visible, value]);

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayPress(day: number) {
    onSelect(new Date(viewYear, viewMonth, day));
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  // Build 6-row grid (42 cells)
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  return {
    viewYear,
    viewMonth,
    today,
    goToPrevMonth,
    goToNextMonth,
    handleDayPress,
    cells,
  };
}
