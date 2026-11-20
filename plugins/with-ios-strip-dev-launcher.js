const { withPodfile, withXcodeProject } = require('expo/config-plugins');

/**
 * Fixes the "[Expo Dev Launcher] Strip Local Network Keys for Release" build phase so it
 * actually runs after the built `Info.plist` exists.
 *
 * `expo-dev-launcher` adds this phase without declared inputs, so it runs in build-phase
 * list order. Info.plist processing happens during late packaging — after the `[CP]` phases
 * `pod install` appends — so the phase used to run before the built plist existed, silently
 * skip (`[ -f "$PLIST_PATH" ]` is false), and leave the dev-launcher keys in Release
 * archives: `NSLocalNetworkUsageDescription` ("Expo Dev Launcher uses the local network…")
 * and `NSBonjourServices` (`_expo._tcp`). Both keys were found in past Nouveau archives
 * (22-09-26 and 11-11-26) despite the phase being present. Declaring the built plist as the
 * phase input instead is not an option: Xcode reports a build-graph cycle on simulator
 * builds (the plist lives inside the product the phase belongs to).
 *
 * This plugin makes the phase deterministic:
 * - sets `alwaysOutOfDate` so the phase runs on every build (it has no inputs/outputs);
 * - moves the phase after the bundling phases at prebuild time (best effort —
 *   `expo-share-intent` may append its embed phase later in the mod pipeline);
 * - appends a `post_integrate` hook to the Podfile that moves the phase to the very end of
 *   the target's build phases during `pod install`, after the `[CP]` phases — the position
 *   where the phase verifiably strips the keys (Nouveau archive 20-11-26).
 *
 * It patches the phase `expo-dev-launcher` already created, or creates a correct one if the
 * package ever stops adding it, and is a no-op for the ShareExtension target.
 */
const PHASE_NAME = '[Expo Dev Launcher] Strip Local Network Keys for Release';

// Same script `expo-dev-launcher` installs; kept verbatim so the phase stays a drop-in.
const STRIP_SCRIPT = `# Strip dev-launcher-specific local network permission keys from release builds.
# This only removes _expo._tcp Bonjour services and the dev-launcher usage description.
# Other Bonjour services and custom descriptions are preserved for production use.
#
# Detect debug builds via the DEBUG compile condition rather than the configuration name,
# so custom debug configurations (e.g. "Dev", "Staging") that define DEBUG keep the keys.
case " $SWIFT_ACTIVE_COMPILATION_CONDITIONS " in
  *" DEBUG "*) IS_DEBUG_BUILD=1 ;;
  *) IS_DEBUG_BUILD=0 ;;
esac

if [ "$IS_DEBUG_BUILD" != "1" ]; then
  PLIST_PATH="\${TARGET_BUILD_DIR}/\${INFOPLIST_PATH}"
  if [ -f "$PLIST_PATH" ]; then
    # Check if NSBonjourServices exists
    if /usr/libexec/PlistBuddy -c "Print :NSBonjourServices" "$PLIST_PATH" >/dev/null 2>&1; then
      # Get the count of services
      COUNT=$(/usr/libexec/PlistBuddy -c "Print :NSBonjourServices" "$PLIST_PATH" 2>/dev/null | grep "^    " | wc -l | tr -d ' ')

      # Remove _expo._tcp
      for ((i=COUNT-1; i>=0; i--)); do
        SERVICE=$(/usr/libexec/PlistBuddy -c "Print :NSBonjourServices:$i" "$PLIST_PATH" 2>/dev/null || echo "")
        if echo "$SERVICE" | grep -q "_expo._tcp"; then
          /usr/libexec/PlistBuddy -c "Delete :NSBonjourServices:$i" "$PLIST_PATH" 2>/dev/null || true
        fi
      done

      # If the array is now empty, remove it entirely
      REMAINING=$(/usr/libexec/PlistBuddy -c "Print :NSBonjourServices" "$PLIST_PATH" 2>/dev/null | grep "^    " | wc -l | tr -d ' ')
      if [ "$REMAINING" -eq "0" ]; then
        /usr/libexec/PlistBuddy -c "Delete :NSBonjourServices" "$PLIST_PATH" 2>/dev/null || true
      fi
    fi

    # Only delete the description if it matches the dev-launcher default text
    DESC=$(/usr/libexec/PlistBuddy -c "Print :NSLocalNetworkUsageDescription" "$PLIST_PATH" 2>/dev/null || echo "")
    if echo "$DESC" | grep -q "Expo Dev Launcher"; then
      /usr/libexec/PlistBuddy -c "Delete :NSLocalNetworkUsageDescription" "$PLIST_PATH" 2>/dev/null || true
    fi
  fi
fi
`;

const PODFILE_HOOK_MARKER = '# >>> with-ios-strip-dev-launcher';

const PODFILE_POST_INTEGRATE = `${PODFILE_HOOK_MARKER}: keep the dev-launcher local-network strip phase
# last, so it runs after Info.plist packaging. A script phase without declared inputs runs in
# build-phase list order; pod install adds the [CP] phases after prebuild, which previously
# left the strip phase too early — it then found no built Info.plist and silently skipped.
post_integrate do |installer|
  installer.aggregate_targets.map(&:user_project).compact.uniq.each do |project|
    target = project.targets.find { |t| t.name == 'Nouveau' }
    next unless target
    phase = target.shell_script_build_phases.find do |p|
      p.name == '[Expo Dev Launcher] Strip Local Network Keys for Release'
    end
    next unless phase
    target.build_phases.delete(phase)
    target.build_phases << phase
    project.save
  end
end
# <<< with-ios-strip-dev-launcher
`;

/**
 * Moves the phase reference to the end of the target's build phases and forces the phase to
 * run on every build. Returns false when the phase is absent.
 */
function movePhaseLast(project, targetKey) {
  const phases = project.pbxNativeTargetSection()[targetKey]?.buildPhases ?? [];
  const index = phases.findIndex((phase) => phase.comment === PHASE_NAME);
  if (index === -1) return false;

  const [reference] = phases.splice(index, 1);
  phases.push(reference);

  const phase = project.hash?.project?.objects?.PBXShellScriptBuildPhase?.[reference.value ?? ''];
  if (phase) {
    phase.alwaysOutOfDate = 1;
  }
  return true;
}

function withStripPhaseOnXcodeProject(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetKey = project.findTargetKey(config.modRequest.projectName ?? '');
    if (!targetKey) {
      console.warn('[with-ios-strip-dev-launcher] Could not find the app target; skipping.');
      return config;
    }

    if (!movePhaseLast(project, targetKey)) {
      // The phase does not exist yet (e.g. expo-dev-launcher is not installed): create it
      // with the correct attributes, then place it last like the patched path does.
      project.addBuildPhase([], 'PBXShellScriptBuildPhase', PHASE_NAME, targetKey, {
        shellPath: '/bin/sh',
        shellScript: STRIP_SCRIPT,
        alwaysOutOfDate: 1,
      });
      movePhaseLast(project, targetKey);
    }
    return config;
  });
}

function withStripPhaseOnPodfile(config) {
  return withPodfile(config, (config) => {
    const modResults = config.modResults;
    // The podfile mod carries `{ contents }` (the Podfile text); handle a plain string too.
    if (modResults && typeof modResults.contents === 'string') {
      if (!modResults.contents.includes(PODFILE_HOOK_MARKER)) {
        modResults.contents = `${modResults.contents}\n${PODFILE_POST_INTEGRATE}`;
      }
    } else if (typeof modResults === 'string' && !modResults.includes(PODFILE_HOOK_MARKER)) {
      config.modResults = `${modResults}\n${PODFILE_POST_INTEGRATE}`;
    }
    return config;
  });
}

function withIosStripDevLauncherPhase(config) {
  config = withStripPhaseOnXcodeProject(config);
  config = withStripPhaseOnPodfile(config);
  return config;
}

module.exports = withIosStripDevLauncherPhase;
