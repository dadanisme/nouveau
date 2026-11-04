// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    // Legacy design system (CLAUDE.md "Legacy"): native UI uses system colors, SF/Material
    // Symbols and @expo/ui controls instead.
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/constants/colors',
              message: 'Legacy palette. Use semantic system colors (PlatformColor / M3 roles).',
            },
          ],
          patterns: [
            {
              group: ['@expo/vector-icons', '@expo/vector-icons/*'],
              message: 'Use SF Symbols (iOS) / Material Symbols (Android).',
            },
          ],
        },
      ],
    },
  },
  {
    // Remaining legacy users, each removed by an open issue: the trend chart (#37), the splash
    // overlay (#39), and the sheet background (#56).
    files: [
      'components/monthly-trend-chart.tsx',
      'components/splash-overlay.tsx',
      'constants/sheet-options.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    ignores: ['dist/*'],
  },
]);
