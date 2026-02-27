export const colors = {
  primary: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
  },
  background: '#FFF9EB',
  white: '#FFFFFF',
  black: '#000000',
  income: '#16A34A',
  expense: '#EF4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

const SHADOW_OFFSET = 3;

const shadow = {
  boxShadow: `${SHADOW_OFFSET}px ${SHADOW_OFFSET}px 0px #000000`,
};

export const design = {
  borderWidth: 2.5,
  shadowOffset: SHADOW_OFFSET,
  shadow,
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
  },
  animation: {
    pressIn: { damping: 15, mass: 1, stiffness: 600 },
    pressOut: { damping: 12, mass: 1, stiffness: 400 },
    tabSwitch: { damping: 20, mass: 1, stiffness: 300 },
  },
} as const;
