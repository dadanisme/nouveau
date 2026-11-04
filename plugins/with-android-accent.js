const { AndroidConfig, withAndroidColors, withAndroidStyles } = require('expo/config-plugins');

const COLOR_NAME = 'colorAccent';

/**
 * Tints native Android widgets that read the AppCompat theme, most visibly the `Alert.alert`
 * dialog buttons (teal by default), with the brand accent. Expo's `primaryColor` (app.json)
 * only sets `colorPrimary`; AppCompat dialogs and controls take `colorAccent`, so this adds it
 * to `AppTheme`. Keep `color` in sync with `ACCENT_COLOR` in `constants/accent.ts`. Dark mode keeps
 * the same hex (see CLAUDE.md), so it lives in `values/` only.
 */
function withAndroidAccent(config, { color }) {
  if (!color) throw new Error('with-android-accent: `color` is required');

  config = withAndroidColors(config, (config) => {
    config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, {
      name: COLOR_NAME,
      value: color,
    });
    return config;
  });

  config = withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: COLOR_NAME,
      value: `@color/${COLOR_NAME}`,
    });
    return config;
  });

  return config;
}

module.exports = withAndroidAccent;
