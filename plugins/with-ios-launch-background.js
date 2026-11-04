const { withFinalizedMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Paints the iOS launch screen with `systemGroupedBackgroundColor`, the background of the first
 * screen (a grouped Form), so launch cuts to it without a flash (HIG launching#Launch-screens).
 *
 * `expo-splash-screen` only writes its background color into the storyboard together with an
 * image. With no image (no logo: "Don't advertise.") it leaves the bare template's
 * `systemBackgroundColor` (white in light mode), plus the template's centering constraints for
 * the image view it removed. This runs after every other mod, swaps the background for the
 * semantic grouped color (which also follows dark mode and Increase Contrast) and drops the
 * dangling constraints and image resource.
 */
function withIosLaunchBackground(config) {
  return withFinalizedMod(config, [
    'ios',
    (config) => {
      const storyboardPath = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName,
        'SplashScreen.storyboard',
      );
      if (!fs.existsSync(storyboardPath)) return config;

      let xml = fs.readFileSync(storyboardPath, 'utf8');
      xml = xml.replace(
        /<color key="backgroundColor" [^>]*\/>/,
        '<color key="backgroundColor" systemColor="systemGroupedBackgroundColor"/>',
      );
      if (!xml.includes('id="EXPO-SplashScreen"')) {
        xml = xml
          .replace(/\s*<constraint firstItem="EXPO-SplashScreen"[^>]*\/>/g, '')
          .replace(/\s*<image name="SplashScreenLogo"[^>]*\/>/g, '');
      }
      // Interface Builder lists each system color the document uses, with its light value.
      xml = xml.replace(/\s*<systemColor name="systemBackgroundColor">[\s\S]*?<\/systemColor>/, '');
      if (!xml.includes('<systemColor name="systemGroupedBackgroundColor">')) {
        xml = xml.replace(
          '</resources>',
          '    <systemColor name="systemGroupedBackgroundColor">\n' +
            '            <color red="0.94901960784313721" green="0.94901960784313721" blue="0.96862745098039216" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>\n' +
            '        </systemColor>\n' +
            '    </resources>',
        );
      }
      if (!xml.includes('systemColor="systemGroupedBackgroundColor"')) {
        throw new Error('with-ios-launch-background: unexpected SplashScreen.storyboard layout');
      }
      fs.writeFileSync(storyboardPath, xml);
      return config;
    },
  ]);
}

module.exports = withIosLaunchBackground;
