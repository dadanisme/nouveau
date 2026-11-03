---
name: device-loop
description: Drive the Nouveau app on iOS simulators, the physical iPhone 15 and the Android emulator and capture what it looks like - open the workspace in Xcode via the xcode MCP and show the sims in Device Hub, build/install the dev client (MCP DeviceInteractionInstallAndRun, or xcodebuild + simctl for fan-out), boot the verification matrix (iPhone 17 iOS 27, iPhone 16 iOS 18.5, iPhone Duo outer/inner, Pixel_9a), deep-link to a screen, tap/swipe/type (xcode MCP DeviceInteraction* first, AXe fallback, adb, android CLI), read the UI tree, and take light + dark screenshots to compare against Apple HIG / Material 3. Use for any "run it on device", "check on simulator/emulator", "screenshot the screen", "verify the native UI", "does it look right in dark mode", visual QA, or definition-of-done check for native UI work.
---

# Device feedback loop

Drive device -> screenshot -> compare -> iterate. **Always run this in a sub-agent.** The sub-agent returns a
<=30-line digest (what was checked, pass/fail per matrix cell, deviations from HIG/M3) plus absolute screenshot
paths. Never paste raw UI trees, build logs or images into the main session.

Scripts live in `.claude/skills/device-loop/scripts/` (call them by absolute path, `S=<repo>/.claude/skills/device-loop/scripts`).

## Rules

- Screenshots go to the session scratchpad (`$SCRATCHPAD/device-loop/<key>/`), **never the repo**. `export SHOT_DIR=...`.
- Never hardcode UDIDs; use `matrix.sh udid <key>`.
- Android commands need JDK 17: `. $S/android-env.sh` (sets JAVA_HOME/ANDROID_HOME/PATH; does not touch shell profiles).
- The user must be able to watch: keep Device Hub open (below). Never run sims "headless" on purpose.
- **Never use AXe accessibility commands on the iPhone Duo** (see Hard warning in section 3).
- Shut down what you booted and stop Metro when done: `$S/matrix.sh shutdown all`.

## Prerequisites (installed 2026-11-02, MCP flow verified 2026-11-03)

- Xcode 27.1, runtimes iOS 27.0 / 27.1 / 18.5. Simulator.app is gone; **Device Hub** replaces it
  (`/Applications/Xcode.app/Contents/Applications/DeviceHub.app`). `bunx expo run:ios` still fails
  ("Can't determine id of Simulator app"), so iOS builds go through the MCP or `xcodebuild` (section 1).
- AXe 1.8 (`brew install cameroncooke/axe/axe`), `jq`. Fallback only.
- `android` CLI 1.1 (`brew upgrade android-cli` then `android update` - the launcher and runtime update separately; check `android info`), SDK `cmdline-tools;latest` (`android sdk install cmdline-tools/latest`), JDK 17 (Homebrew).

### iOS setup: Xcode MCP is the primary driver

1. Xcode Settings -> Intelligence -> Model Context Protocol -> **Xcode Tools** on. If no `mcp__xcode__*` tools exist
   in the session: `claude mcp add --transport stdio xcode -- xcrun mcpbridge`, then restart Claude Code (per ogmo-app,
   unverified in nouveau).
2. Load every tool you need in **one** ToolSearch call:
   `select:mcp__xcode__XcodeOpenWorkspace,mcp__xcode__XcodeListWorkspaces,mcp__xcode__XcodeListRunDestinations,mcp__xcode__XcodeSwitchRunDestination,mcp__xcode__XcodeListSchemes,mcp__xcode__XcodeSwitchScheme,mcp__xcode__BuildProject,mcp__xcode__GetBuildLog,mcp__xcode__DeviceInteractionStartWorkspaceSession,mcp__xcode__DeviceInteractionStartSession,mcp__xcode__DeviceInteractionInstallAndRun,mcp__xcode__DeviceInteractionSynthesize,mcp__xcode__DeviceInteractionEndSession,mcp__xcode__GetConsoleOutput`
3. `XcodeListWorkspaces`. "No workspaces are currently open" (and the menu-bar bridge item says "No Connected
   Projects") until you call `XcodeOpenWorkspace(path: "<repo>/ios/Nouveau.xcworkspace")` (`ios/` missing? run
   `bunx expo prebuild -p ios` first; open the checkout you are testing). It returns `workspaceIdentifier`
   (`workspace-...`), `activeScheme: "Nouveau"` and `activeRunDestination`. Opening triggers indexing (heavy CPU for a while).
4. `open -a DeviceHub` so the booted sims are visible to the user.

## Verification matrix (definition of done)

| key     | device                                | runtime             | notes                                            |
| ------- | ------------------------------------- | ------------------- | ------------------------------------------------ |
| `ios27` | iPhone 17                             | iOS 27.0            | MCP run destination                              |
| `ios18` | iPhone 16                             | iOS 18.5            | created via `simctl create`; MCP run destination |
| `duo`   | iPhone Duo (outer + inner)            | iOS 27.1            | MCP outer only, **no AXe**; see section 4        |
| `pixel` | Pixel_9a AVD                          | Android 16 (API 36) |                                                  |
| -       | Ramdan's iPhone (iPhone 15, physical) | iOS 26.6.2          | end of every phase; MCP title "Ramdan’s Iphone"  |

`XcodeListRunDestinations(workspaceIdentifier)` lists all four iOS targets as eligible (verified 2026-11-03); use its
`displayTitle` with `XcodeSwitchRunDestination`. DeviceInteraction on iOS 18.5 and the physical phone is not yet
exercised; fall back to AXe / devicectl if a session there fails.

Every screen under change: each cell, light **and** dark. `$S/matrix.sh list` shows UDID/state;
`$S/matrix.sh boot <key>|all` (also opens Device Hub), `$S/matrix.sh shutdown <key>|all`.

## 1. Build + install the dev client

Start Metro once (background) before any install: `CI=1 bunx expo start --dev-client --port 8081`.

**(a) MCP path, one device at a time** (not yet exercised for this RN project):

1. `XcodeSwitchRunDestination(displayTitle, workspaceIdentifier)`.
2. `DeviceInteractionStartWorkspaceSession(sessionIdentifier: "Ios27 Settings Check", deviceIdentifier: <udid>,
workspaceIdentifier)` -> `interactionSessionKey` (same as the sessionIdentifier). It boots the device if needed.
   Its reply says to spawn a sub-agent with a "device-interaction" skill: that skill does not exist in Claude Code; call the tools directly.
3. `DeviceInteractionInstallAndRun(interactionSessionKey, workspaceIdentifier)` builds, installs and launches on the
   active destination. Build errors: `GetBuildLog(severity: "error")`. App logs: `GetConsoleOutput(pattern: ...)`.
4. The dev launcher opens: tap the `http://<ip>:8081` server row (section 3) if it doesn't auto-connect.

**(b) xcodebuild + simctl, fallback and parallel fan-out** (one build serves all sims, arm64):

```bash
xcodebuild -workspace ios/Nouveau.xcworkspace -scheme Nouveau -configuration Debug \
  -destination "platform=iOS Simulator,id=$($S/matrix.sh udid ios27)" -derivedDataPath ios/build build
for k in ios27 ios18 duo; do xcrun simctl install "$($S/matrix.sh udid $k)" ios/build/Build/Products/Debug-iphonesimulator/Nouveau.app; done
xcrun simctl launch <udid> com.muhammadramdan.nouveau   # opens dev launcher -> tap the http://<ip>:8081 server
```

First load shows the Expo dev menu: tap its Close button (MCP; AXe `axe tap --label Close --element-type Button --udid <udid>` except on the Duo).

Physical iPhone 15 (or MCP path (a) with destination "Ramdan’s Iphone"):

```bash
xcodebuild ... -destination "id=<device-udid>" -derivedDataPath ios/build -allowProvisioningUpdates build
xcrun devicectl device install app --device <udid> ios/build/Build/Products/Debug-iphoneos/Nouveau.app
xcrun devicectl device process launch --device <udid> --terminate-existing com.muhammadramdan.nouveau  # phone must be unlocked
```

Android: `. $S/android-env.sh && CI=1 bunx expo run:android --device Pixel_9a --no-bundler` (builds, installs, opens dev client).

## 2. Deep-link to a screen

Routes are `app/*.tsx` names: `nouveau://settings`, `nouveau://signup`, `nouveau://categories`, ...

- iOS sim: `xcrun simctl openurl <udid> nouveau://settings`, then tap **Open** on the system sheet (MCP tap from the
  hierarchy; AXe `axe tap --label Open --element-type Button --wait-timeout 5 --udid <udid>` except on the Duo).
- Android: `adb -s <serial> shell am start -W -a android.intent.action.VIEW -d nouveau://settings com.muhammadramdan.nouveau`.
- Physical iPhone: unverified (`devicectl device process launch --payload-url` is a candidate).
  Auth: Android emulator holds a logged-in demo session; a fresh iOS install lands on the login screen (`/login`, `/signup` reachable without auth).

## 3. Drive it

**iOS, xcode MCP first.** Start a session (section 1 (a), or `DeviceInteractionStartSession(deviceIdentifier,
sessionIdentifier)` when the app is already installed; it can interact but not install/run).

1. `DeviceInteractionSynthesize(interactSessionKey, [interactionCommand], [activationBundleId])`. No command =
   capture only: returns paths to a screenshot, a thumbnail, a UI hierarchy (text: element type, `{{x,y},{w,h}}`
   frame, `hitPoint`, labels) and logs, plus `applicationState`. **grep the hierarchy file; view only the thumbnail.**
2. Coordinates are points, taken from the latest hierarchy, never guessed from pixels. Verified grammar: tap `t X Y`,
   long press `t X Y 1.2`, swipe `t X1 Y1 f X2 Y2 [dur]` (several space-separated taps in one command worked once
   on the Duo). Per ogmo-app, unverified in nouveau: one command per call (prefer it), type `sender keyboard kbd <text>`, `orientation <portrait|landscapeLeft|...>`. From Xcode's embedded docs
   (unverified): double tap `d X Y`, `drag X1 Y1 X2 Y2`. Re-capture after each command.
3. `activationBundleId: "com.muhammadramdan.nouveau"` brings the app to the front first.
4. `DeviceInteractionEndSession(interactionSessionKey)` -> "Session stopped". Always, even on failure.

Device Hub -> Device -> Keyboard -> Simulate Hardware Keyboard is on by default, so focusing a field shows no
on-screen keyboard; turn it off per sim to test keyboard layouts (per ogmo-app, unverified in nouveau).

**iOS, AXe fallback** (ios27 / ios18 only, when the MCP is unavailable or fails):

```bash
axe describe-ui --udid <udid> | jq -r '.. | objects | select(.AXLabel? != null and .AXLabel != "") | "\(.type) \"\(.AXLabel)\" \(.AXFrame)"'
axe tap --label "Sign In" [--element-type Button] [--wait-timeout 5] --udid <udid>   # or -x X -y Y (points)
axe swipe --start-x 200 --start-y 600 --end-x 200 --end-y 300 --udid <udid>
axe type 'text' --udid <udid>    # tap the field first; it dropped trailing chars once ("demo@examp") -> re-read AXValue
```

> **Hard warning: no AXe on the iPhone Duo.** `axe describe-ui` and label taps on the Duo (iOS 27.1 runtime)
> crash-loop SpringBoard + AccessibilityUIServer (38 macOS crash windows in 3 minutes, 2026-11-03). Drive the
> Duo only through the MCP. If the MCP is down, mark the Duo cells UNTESTED; don't reach for AXe.

**Back navigation:** AXe edge-swipe back doesn't work, not even in Apple's Settings app. Use the header back
button. An MCP edge swipe (`t 1 Y f 250 Y` with the verified swipe grammar) is untested; report it as such.

**Android** (`. $S/android-env.sh`; coordinates are pixels):

```bash
android layout --device <serial> | jq -r '.. | objects | select((.text // ."content-desc" // "") != "") | "\(.text // ."content-desc") \(.center) \(.interactions // "")"'
adb -s <serial> shell input tap X Y
adb -s <serial> shell input swipe X1 Y1 X2 Y2 300
adb -s <serial> shell input text 'hello'
```

If `android layout` fails with "Error communicating with instrumentation server", logcat shows
`UiAutomationService ... already registered`: another UiAutomation client holds the device (seen: a leftover
`com.mobilenext.mobilecli.DeviceServer`, or a hung `uiautomator dump`). Find it with
`adb shell ps -A -o PID,ARGS | grep -E 'app_process|uiautomator'`, `adb shell kill <pid>`, then
`adb shell am force-stop com.android.cli.interact.instrumentation` and retry.

## 4. Screenshots, light + dark

`$S/shot.sh <ios|iphone|android> <key|udid|serial> <name> [light|dark] [outdir]` -> prints the PNG path.
It sets appearance (`simctl ui <udid> appearance`, `devicectl device settings appearance --mode`,
`adb shell cmd uimode night yes|no`), waits, captures (`simctl io screenshot`, `devicectl device capture screenshot`,
`adb exec-out screencap -p`). Reset to light afterwards. Downscale before viewing: `sips -Z 600 in.png --out small.png`.
`android screen capture --device <serial> -o f.png` also works (`--annotate` + `android screen resolve` for labelled targets).

**iPhone Duo displays**: `simctl io <udid> enumerate` shows two screens: `primary` (1398x2034, active by default)
and `primary-1` (2007x2853, black while inactive). Per ogmo-app, unverified in nouveau:

- The MCP drives only the **outer** display; with the device open, MCP taps don't land and MCP captures are black.
- Capture the **inner** display with `SIM_DISPLAY=primary-1 $S/shot.sh ios duo <name> [mode]`
  (`simctl io <udid> screenshot --display=primary-1`).
- A pose change ends the MCP session: start a new one after every fold/unfold.
- No CLI/MCP pose control: the Closed / Partially Open / Open buttons sit under the bezel in Device Hub. Ask the
  user to change the pose by hand, wait for confirmation, then continue.

## 5. Compare

For each shot, check against Apple HIG (iOS: navigation bars/large titles, SF Symbols, 44pt targets, safe areas,
Dynamic Type, system materials) and Material 3 (Android: top app bars, 48dp targets, M3 color roles, edge-to-edge
insets, predictive back). Report deviations per matrix cell, with the screenshot path.

## Parallel runs (one sub-agent per device)

- One Metro on 8081 serves every device: start it once and have the per-device agents reuse it.
- Build once with path (b) and `simctl install` to every sim; don't let agents call `XcodeSwitchRunDestination` /
  `DeviceInteractionInstallAndRun` concurrently (the workspace has one active destination).
- One MCP session per device, each with a unique `sessionIdentifier` (e.g. "Duo Outer Settings Dark"); each agent
  ends its own.
- Each agent writes only to its own scratch subfolder (`$SCRATCHPAD/device-loop/<key>/`) for shots and helper
  scripts. A shared folder let one agent overwrite another's `ui.sh`.
- Agents share the test account: name test rows per device and delete only your own.

## Known issues (2026-11-03)

- **iPhone Duo + AXe crash-loops SpringBoard and AccessibilityUIServer** (38 crash windows in 3 minutes). Never use
  AXe accessibility commands on the Duo; earlier AXe taps there also didn't register.
- `DeviceInteractionStartWorkspaceSession`'s reply mentions a "device-interaction" skill that doesn't exist in
  Claude Code. Ignore it and call the DeviceInteraction tools directly.
- The iOS 27 launch crash (`EXC_BREAKPOINT`, no UIScene lifecycle) is fixed by the SDK 58 upgrade (#24). If it
  reappears, check that prebuild still generates `SceneDelegate.swift`.
- The app has no native dark theme yet, so dark screenshots currently match light ones (the toggles do work).
- A debug Android build opened cold from a share intent stops at the dev-server picker first; connect to Metro and the
  share screen follows.
