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
    // Native UI uses SF Symbols / Material Symbols, not the Ionicons font.
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
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
    // Alerts go through `showAlertDialog`: `Alert.alert` on iOS, a Material 3 dialog on Android
    // (`Alert.alert` there is the legacy AppCompat dialog). The keyboard closes through
    // `dismissKeyboard`: `Keyboard.dismiss` leaves a focused SwiftUI field's keyboard up.
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['lib/alert-dialog*'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Alert',
          property: 'alert',
          message: "Use showAlertDialog from '@/lib/alert-dialog' (M3 dialog on Android).",
        },
        {
          object: 'Keyboard',
          property: 'dismiss',
          message: "Use dismissKeyboard from '@/lib/keyboard' (it also blurs SwiftUI fields).",
        },
      ],
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
