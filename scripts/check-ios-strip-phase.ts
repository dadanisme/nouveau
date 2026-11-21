/**
 * Checks the dev-launcher local-network strip build phase fix (`plugins/with-ios-strip-dev-launcher.js`):
 * - `app.json` registers the plugin;
 * - the plugin targets the exact phase name, sets `alwaysOutOfDate`, and appends the
 *   `post_integrate` Podfile hook that keeps the phase last (after the `[CP]` phases), which
 *   is what makes the phase actually find the built `Info.plist` in Release builds;
 * - when a generated `ios/` exists (gitignored, so absent in CI), `project.pbxproj` carries
 *   the phase with `alwaysOutOfDate = 1` on the Nouveau target only, and the Podfile carries
 *   the `post_integrate` hook.
 *
 * Run: bun scripts/check-ios-strip-phase.ts (exits 1 on any failure).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import appJson from '../app.json';

const PHASE_NAME = '[Expo Dev Launcher] Strip Local Network Keys for Release';
const PLUGIN_ID = './plugins/with-ios-strip-dev-launcher';
const PODFILE_HOOK_MARKER = '# >>> with-ios-strip-dev-launcher';

let passes = 0;
let failures = 0;

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passes += 1;
  } else {
    failures += 1;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Registration: the plugin runs after the Expo built-ins so it can patch the phase
// `expo-dev-launcher` created (it is also self-sufficient when the phase is absent).
const plugins = appJson.expo.plugins ?? [];
check(
  'app.json registers ./plugins/with-ios-strip-dev-launcher',
  plugins.some((plugin) => plugin === PLUGIN_ID),
);

const pluginPath = path.join(root, 'plugins', 'with-ios-strip-dev-launcher.js');
check('plugin file exists', fs.existsSync(pluginPath));
const plugin = fs.existsSync(pluginPath) ? fs.readFileSync(pluginPath, 'utf8') : '';
check('plugin targets the exact phase name', plugin.includes(PHASE_NAME));
check('plugin sets alwaysOutOfDate', /alwaysOutOfDate/.test(plugin));
check(
  'plugin moves the phase after the bundling phases (buildPhases push)',
  /phases\.push\(reference\)/.test(plugin),
);
check(
  'plugin appends the Podfile post_integrate hook',
  /post_integrate do \|installer\|/.test(plugin),
);

// Generated project: only present after a local `expo prebuild` + `pod install`.
const pbxPath = path.join(root, 'ios', 'Nouveau.xcodeproj', 'project.pbxproj');
const podfilePath = path.join(root, 'ios', 'Podfile');
if (fs.existsSync(pbxPath)) {
  const pbx = fs.readFileSync(pbxPath, 'utf8');
  const phaseIndex = pbx.indexOf(`${PHASE_NAME} */ = {`);
  check('generated pbxproj has the strip phase', phaseIndex !== -1);
  if (phaseIndex !== -1) {
    const blockEnd = pbx.indexOf('\n\t\t};', phaseIndex);
    const block = pbx.slice(phaseIndex, blockEnd === -1 ? undefined : blockEnd);
    check('phase has alwaysOutOfDate = 1', /alwaysOutOfDate = 1;/.test(block));

    const targetMatch = /\/\* Nouveau \*\/ = \{\s*isa = PBXNativeTarget;/.exec(pbx);
    check('pbxproj has the Nouveau native target', targetMatch !== null);
    if (targetMatch) {
      const targetBlockEnd = pbx.indexOf('\n\t\t};', targetMatch.index);
      const targetBlock = pbx.slice(
        targetMatch.index,
        targetBlockEnd === -1 ? undefined : targetBlockEnd,
      );
      const phaseRefs = [...targetBlock.matchAll(/\/\* (.*?) \*\/,?/g)].map((match) => match[1]);
      check(
        'phase appears once on the Nouveau target',
        phaseRefs.filter((comment) => comment === PHASE_NAME).length === 1,
      );
    }

    // The ShareExtension must not carry a copy of the phase.
    const extensionMatch = /\/\* NouveauShareExtension \*\/ = \{\s*isa = PBXNativeTarget;/.exec(
      pbx,
    );
    if (extensionMatch) {
      const extensionBlockEnd = pbx.indexOf('\n\t\t};', extensionMatch.index);
      const extensionBlock = pbx.slice(
        extensionMatch.index,
        extensionBlockEnd === -1 ? undefined : extensionBlockEnd,
      );
      check('ShareExtension target has no copy of the phase', !extensionBlock.includes(PHASE_NAME));
    }
  }
} else {
  check('generated ios/ absent — pbxproj checks skipped (run expo prebuild to verify)', true);
}

if (fs.existsSync(podfilePath)) {
  const podfile = fs.readFileSync(podfilePath, 'utf8');
  check(
    'generated Podfile carries the post_integrate hook',
    podfile.includes('post_integrate do |installer|'),
  );
  check('generated Podfile hook targets the strip phase', podfile.includes(PHASE_NAME));
} else {
  check('generated Podfile absent — Podfile checks skipped (run expo prebuild to verify)', true);
}

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
