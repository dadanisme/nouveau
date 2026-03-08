import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { useCalendar } from '@/hooks/use-calendar';
import { colors, design } from '@/constants/colors';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { isSameDay } from '@/utils/date';

interface DatePickerProps {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onDismiss: () => void;
}

export function DatePicker({ visible, value, onSelect, onDismiss }: DatePickerProps) {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - design.spacing.lg * 2) / 7);
  const { viewYear, viewMonth, today, goToPrevMonth, goToNextMonth, handleDayPress, cells } =
    useCalendar({ visible, value, onSelect });
  const monthNames = i18n.t(k.datePicker.months, { returnObjects: true }) as unknown as string[];
  const weekdays = i18n.t(k.datePicker.weekdays, { returnObjects: true }) as unknown as string[];

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <BottomSheetView style={styles.content}>
        {/* Month/Year header */}
        <View style={styles.monthHeader}>
          <Pressable onPress={goToPrevMonth} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.gray[700]} />
          </Pressable>
          <Text style={styles.monthTitle}>
            {monthNames[viewMonth]} {viewYear}
          </Text>
          <Pressable onPress={goToNextMonth} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={colors.gray[700]} />
          </Pressable>
        </View>

        {/* Weekday labels */}
        <View style={styles.weekdayRow}>
          {weekdays.map((label: string, i: number) => (
            <View key={i} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) {
              return <View key={i} style={[styles.dayCell, { height: cellSize }]} />;
            }

            const cellDate = new Date(viewYear, viewMonth, day);
            const isSelected = isSameDay(cellDate, value);
            const isToday = isSameDay(cellDate, today);

            return (
              <Pressable
                key={i}
                style={[
                  styles.dayCell,
                  { height: cellSize },
                  isToday && !isSelected && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => handleDayPress(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && !isSelected && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.xl,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: design.spacing.md,
    paddingHorizontal: design.spacing.xs,
  },
  monthTitle: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: design.spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: design.fontSize.xs,
    fontWeight: '700',
    color: colors.gray[400],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderRadius: design.radius.full,
    borderWidth: 2,
    borderColor: colors.gray[300],
  },
  dayCellSelected: {
    borderRadius: design.radius.full,
    backgroundColor: colors.primary.DEFAULT,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
  },
  dayText: {
    fontSize: design.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },
  dayTextToday: {
    fontWeight: '800',
    color: colors.black,
  },
  dayTextSelected: {
    fontWeight: '800',
    color: colors.black,
  },
});
