import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

// About the size of a large app icon on the Welcome screen.
const LOGO_SIZE = 88;
// The app icon's corner: about 22.4% of its side, drawn as a continuous curve on iOS (the
// "squircle" of the Home Screen); Android draws a plain rounded square.
const CORNER_RADIUS = Math.round(LOGO_SIZE * 0.2237);

/**
 * The app logo (`assets/images/logo.svg`, bundled by Metro as an asset and drawn by expo-image) in
 * the app-icon shape. Decorative: the title beside it names the app, so VoiceOver and TalkBack skip
 * it.
 */
export function AppLogo() {
  return (
    <View
      style={styles.frame}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={require('@/assets/images/logo.svg')}
        style={styles.image}
        contentFit="cover"
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: CORNER_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  image: { width: LOGO_SIZE, height: LOGO_SIZE },
});
