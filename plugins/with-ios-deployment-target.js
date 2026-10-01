const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const BEGIN = '# >>> with-ios-deployment-target';
const END = '# <<< with-ios-deployment-target';

/**
 * React Native's `react_native_post_install` bumps IPHONEOS_DEPLOYMENT_TARGET to the
 * supported minimum, but it only walks pod *library* targets
 * (`pod_target_installation_results[].native_target`). Resource bundle targets — the
 * `*_Privacy` privacy manifests, `GoogleSignIn.bundle`, `SDWebImage.bundle` — keep the
 * deployment target from their podspec (9.0 / 10.0 / 12.0), and Xcode 26+ errors on
 * anything below 15.0.
 *
 * This walks every target in the generated Pods project and raises the floor. Keep
 * `deploymentTarget` in sync with the `expo-build-properties` value in app.json.
 */
function withIosDeploymentTarget(config, { deploymentTarget = '16.0' } = {}) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      // Strip a previously injected block so the target version stays editable.
      const begin = contents.indexOf(BEGIN);
      const end = contents.indexOf(END);
      if (begin !== -1 && end !== -1) {
        contents = contents.slice(0, begin) + contents.slice(end + END.length + 1);
      }

      const anchor = 'post_install do |installer|';
      if (!contents.includes(anchor)) {
        throw new Error(
          `[with-ios-deployment-target] Could not find "${anchor}" in ${podfilePath}.`,
        );
      }

      const snippet = `${anchor}
    ${BEGIN}
    # Raise the deployment target floor on every pod target, including the resource
    # bundles that react_native_post_install skips.
    projects = [installer.pods_project] + installer.generated_projects
    projects.compact.uniq.each do |project|
      project.build_configurations.each do |bc|
        bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'
      end
      project.targets.each do |target|
        target.build_configurations.each do |bc|
          current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
          if current.nil? || current.to_f < ${deploymentTarget}
            bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'
          end
        end
      end
    end
    ${END}
`;

      fs.writeFileSync(podfilePath, contents.replace(anchor, snippet));
      return config;
    },
  ]);
}

module.exports = withIosDeploymentTarget;
