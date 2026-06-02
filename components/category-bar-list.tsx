import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Card } from '@/components/card';
import { colors, design } from '@/constants/colors';
import type { CategorySpend } from '@/utils/analytics';
import { formatCompactAmount } from '@/utils/currency';

const BAR_HEIGHT = 12;

interface CategoryBarListProps {
  categories: CategorySpend[];
  onPressCategory?: (category: CategorySpend) => void;
}

export function CategoryBarList({ categories, onPressCategory }: CategoryBarListProps) {
  // List is pre-sorted descending — first entry is the largest spend
  const maxAmount = categories[0]?.amount ?? 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 500 });
  }, [progress, categories]);

  if (categories.length === 0) return null;

  return (
    <Card style={styles.card}>
      {categories.map((cat, index) => (
        <CategoryBarRow
          key={cat.id ?? cat.name}
          category={cat}
          ratio={maxAmount > 0 ? cat.amount / maxAmount : 0}
          progress={progress}
          isLast={index === categories.length - 1}
          // The synthetic "Others" bucket has no id and can't be drilled into
          onPress={onPressCategory && cat.id ? () => onPressCategory(cat) : undefined}
        />
      ))}
    </Card>
  );
}

function CategoryBarRow({
  category,
  ratio,
  progress,
  isLast,
  onPress,
}: {
  category: CategorySpend;
  ratio: number;
  progress: SharedValue<number>;
  isLast: boolean;
  onPress?: () => void;
}) {
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * ratio * 100}%`,
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={category.name}
      style={({ pressed }) => [styles.row, !isLast && styles.rowSpacing, pressed && styles.pressed]}
    >
      <View style={styles.labelRow}>
        <View style={[styles.swatch, { backgroundColor: category.color }]} />
        <Text style={styles.name} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={styles.amount}>{formatCompactAmount(category.amount)}</Text>
        <Text style={styles.percentage}>{Math.round(category.percentage)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { backgroundColor: category.color }, barStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.lg,
  },
  row: {
    gap: design.spacing.xs + 2,
  },
  pressed: {
    opacity: 0.7,
  },
  rowSpacing: {
    marginBottom: design.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.xs + 2,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: design.radius.full,
  },
  name: {
    flex: 1,
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.gray[800],
  },
  amount: {
    fontSize: design.fontSize.sm,
    fontWeight: '800',
    color: colors.gray[900],
  },
  percentage: {
    minWidth: 38,
    textAlign: 'right',
    fontSize: design.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
  },
  track: {
    height: BAR_HEIGHT,
    borderRadius: design.radius.sm,
    backgroundColor: colors.gray[100],
    overflow: 'hidden',
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: design.radius.sm,
  },
});
