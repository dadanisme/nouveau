import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, design } from '@/constants/colors';

interface CardProps extends ViewProps {
  variant?: 'default' | 'primary';
}

export function Card({ variant = 'default', style, children, ...props }: CardProps) {
  return (
    <View
      style={[styles.card, variant === 'primary' && styles.primary, design.shadow, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: design.radius.lg,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    padding: design.spacing.md,
  },
  primary: {
    backgroundColor: colors.primary.DEFAULT,
  },
});
