import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useCalendar } from '@/hooks/use-calendar';
import { colors, design } from '@/constants/colors';
import { isSameDay } from '@/utils/date';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

interface DatePickerProps {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onDismiss: () => void;
}

export function DatePicker(props: DatePickerProps) {
  const {
    modalVisible,
    setModalVisible,
    contentVisible,
    viewYear,
    viewMonth,
    today,
    goToPrevMonth,
    goToNextMonth,
    handleDayPress,
    cells,
    onDismiss,
    value,
  } = useCalendar(props);

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onDismiss}>
      {contentVisible ? (
        <AnimatedPressable
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(100)}
          style={styles.overlay}
          onPress={onDismiss}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(200).mass(0.8)}
            exiting={SlideOutDown.duration(200).withCallback((finished) => {
              'worklet';
              if (finished) {
                scheduleOnRN(setModalVisible, false);
              }
            })}
            style={styles.sheet}
          >
            <Pressable>
              <View style={styles.handle} />

              {/* Month/Year header */}
              <View style={styles.monthHeader}>
                <Pressable onPress={goToPrevMonth} hitSlop={12}>
                  <Ionicons name="chevron-back" size={22} color={colors.gray[700]} />
                </Pressable>
                <Text style={styles.monthTitle}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
                <Pressable onPress={goToNextMonth} hitSlop={12}>
                  <Ionicons name="chevron-forward" size={22} color={colors.gray[700]} />
                </Pressable>
              </View>

              {/* Weekday labels */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((label, i) => (
                  <View key={i} style={styles.weekdayCell}>
                    <Text style={styles.weekdayText}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* Day grid */}
              <View style={styles.grid}>
                {cells.map((day, i) => {
                  if (day === null) {
                    return <View key={i} style={styles.dayCell} />;
                  }

                  const cellDate = new Date(viewYear, viewMonth, day);
                  const isSelected = isSameDay(cellDate, value);
                  const isToday = isSameDay(cellDate, today);

                  return (
                    <Pressable
                      key={i}
                      style={[
                        styles.dayCell,
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
            </Pressable>
          </Animated.View>
        </AnimatedPressable>
      ) : null}
    </Modal>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: design.radius.xl,
    borderTopRightRadius: design.radius.xl,
    borderWidth: design.borderWidth,
    borderBottomWidth: 0,
    borderColor: colors.black,
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: design.spacing.sm,
    marginBottom: design.spacing.md,
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
    height: CELL_SIZE,
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
