import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { colors, design } from '@/constants/colors';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Button variant="outline" onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </Button>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.title}>{title}</Text>
      {rightAction ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: design.spacing.lg,
    paddingVertical: design.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: design.radius.sm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.gray[900],
  },
  spacer: {
    width: 40,
  },
});
