const { withXcodeProject } = require('expo/config-plugins');

/**
 * Registers every declared iOS localization in `project.pbxproj` `knownRegions`.
 *
 * Expo's built-in `withLocales` writes `<lang>.lproj/InfoPlist.strings` and adds it to
 * Copy Bundle Resources, but leaves `knownRegions` at the template default `(en, Base)`.
 * Adding each region here keeps Xcode's Project → Info → Localizations list in sync with
 * `CFBundleLocalizations` and `expo.locales`.
 */
function withIosKnownRegions(config) {
  return withXcodeProject(config, (config) => {
    const regions = new Set([
      ...(config.ios?.infoPlist?.CFBundleLocalizations ?? []),
      ...Object.keys(config.locales ?? {}),
    ]);
    for (const region of regions) {
      if (typeof region === 'string' && region.length > 0) {
        config.modResults.addKnownRegion(region);
      }
    }
    return config;
  });
}

module.exports = withIosKnownRegions;
