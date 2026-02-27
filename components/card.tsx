import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, design } from '@/constants/colors';

interface CardProps extends ViewProps {
  variant?: 'default' | 'primary';
}

const SHADOW_OFFSET = design.shadowOffset;

const MARGIN_KEYS = [
  'margin',
  'marginBottom',
  'marginTop',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginEnd',
  'marginStart',
] as const;

function extractMargins(style: ViewStyle | undefined) {
  if (!style) return { wrapper: undefined, inner: undefined };
  const wrapper: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  let hasMargin = false;
  for (const key of Object.keys(style) as (keyof ViewStyle)[]) {
    if ((MARGIN_KEYS as readonly string[]).includes(key)) {
      wrapper[key] = style[key];
      hasMargin = true;
    } else {
      inner[key] = style[key];
    }
  }
  return {
    wrapper: hasMargin ? (wrapper as ViewStyle) : undefined,
    inner: Object.keys(inner).length > 0 ? (inner as ViewStyle) : undefined,
  };
}

export function Card({ variant = 'default', style, children, ...props }: CardProps) {
  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
  const { wrapper: wrapperMargins, inner: innerStyle } = extractMargins(flat);
  const borderRadius = (flat?.borderRadius as number | undefined) ?? styles.card.borderRadius;

  return (
    <View style={wrapperMargins}>
      <View style={[styles.shadowLayer, { borderRadius }]} />
      <View style={[styles.card, variant === 'primary' && styles.primary, innerStyle]} {...props}>
        {children}
      </View>
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
  shadowLayer: {
    position: 'absolute',
    top: SHADOW_OFFSET,
    left: SHADOW_OFFSET,
    right: -SHADOW_OFFSET,
    bottom: -SHADOW_OFFSET,
    backgroundColor: colors.black,
    borderRadius: design.radius.lg,
  },
});
