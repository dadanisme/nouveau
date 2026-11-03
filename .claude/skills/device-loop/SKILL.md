---
name: device-loop
description: Drive the Nouveau app on iOS simulators, the physical iPhone 15 and the Android emulator and capture what it looks like - build/install the dev client, boot the verification matrix (iPhone 17 iOS 27, iPhone 16 iOS 18.5, iPhone Duo outer/inner, Pixel_9a), deep-link to a screen, tap/swipe/type (xcode MCP DeviceInteraction*, AXe, adb, android CLI), read the accessibility/UI tree, and take light + dark screenshots to compare against Apple HIG / Material 3. Use for any "run it on device", "check on simulator/emulator", "screenshot the screen", "verify the native UI", "does it look right in dark mode", visual QA, or definition-of-done check for native UI work.
---

# Device feedback loop

Drive device -> screenshot -> compare -> iterate. **Always run this in a sub-agent.** The sub-agent returns a
<=30-line digest (what was checked, pass/fail per matrix cell, deviations from HIG/M3) plus absolute screenshot
paths. Never paste raw UI trees, build logs or images into the main session.

Scripts live in `.claude/skills/device-loop/scripts/` (call them by absolute path, `S=<repo>/.claude/skills/device-loop/scripts`).

## Rules

- Screenshots go to the session scratchpad (`$SCRATCHPAD/device-loop/`), **never the repo**. `export SHOT_DIR=...`.
- Never hardcode UDIDs; use `matrix.sh udid <key>`.
- Android commands need JDK 17: `. $S/android-env.sh` (sets JAVA_HOME/ANDROID_HOME/PATH; does not touch shell profiles).
- Shut down what you booted and stop Metro when done: `$S/matrix.sh shutdown all`.

## Prerequisites (installed + verified 2026-11-02)

- Xcode 27.1, runtimes iOS 27.0 / 27.1 / 18.5. **No Simulator.app ships with Xcode 27.1** -> sims run headless; `bunx expo run:ios` fails ("Can't determine id of Simulator app"), so iOS builds use `xcodebuild` (below).
- AXe 1.8 (`brew install cameroncooke/axe/axe`), `jq`.
- `android` CLI 1.1 (`brew upgrade android-cli` then `android update` - the launcher and runtime update separately; check `android info`), SDK `cmdline-tools;latest` (`android sdk install cmdline-tools/latest`), JDK 17 (Homebrew).
- xcode MCP: load with ToolSearch `select:mcp__xcode__DeviceInteractionStartSession,mcp__xcode__DeviceInteractionSynthesize,mcp__xcode__DeviceInteractionEndSession`.

## Verification matrix (definition of done)

| key     | device                                | runtime             | notes                                                         |
| ------- | ------------------------------------- | ------------------- | ------------------------------------------------------------- |
| `ios27` | iPhone 17                             | iOS 27.0            | xcode MCP eligible                                            |
| `ios18` | iPhone 16                             | iOS 18.5            | created via `simctl create`; **not** MCP-eligible -> AXe only |
| `duo`   | iPhone Duo (outer + inner)            | iOS 27.1            | two displays, see below                                       |
| `pixel` | Pixel_9a AVD                          | Android 16 (API 36) |                                                               |
| -       | Ramdan's iPhone (iPhone 15, physical) | iOS 26.6.2          | end of every phase                                            |

Every screen under change: each cell, light **and** dark. `$S/matrix.sh list` shows UDID/state;
`$S/matrix.sh boot <key>|all`, `$S/matrix.sh shutdown <key>|all`.

## 1. Build + install the dev client

Start Metro once (background): `CI=1 bunx expo start --dev-client --port 8081`.

iOS simulator (one build serves all sims, arm64):

```bash
xcodebuild -workspace ios/Nouveau.xcworkspace -scheme Nouveau -configuration Debug \
  -destination "platform=iOS Simulator,id=$($S/matrix.sh udid ios27)" -derivedDataPath ios/build build
xcrun simctl install <udid> ios/build/Build/Products/Debug-iphonesimulator/Nouveau.app
xcrun simctl launch <udid> com.muhammadramdan.nouveau   # opens dev launcher -> tap the http://<ip>:8081 server
```

(`ios/` missing? run `bunx expo prebuild -p ios` first.) First load shows the Expo dev menu: `axe tap --label Close --element-type Button --udid <udid>`.

Physical iPhone 15:

```bash
xcodebuild ... -destination "id=<device-udid>" -derivedDataPath ios/build -allowProvisioningUpdates build
xcrun devicectl device install app --device <udid> ios/build/Build/Products/Debug-iphoneos/Nouveau.app
xcrun devicectl device process launch --device <udid> --terminate-existing com.muhammadramdan.nouveau  # phone must be unlocked
```

Android: `. $S/android-env.sh && CI=1 bunx expo run:android --device Pixel_9a --no-bundler` (builds, installs, opens dev client).

## 2. Deep-link to a screen

Routes are `app/*.tsx` names: `nouveau://settings`, `nouveau://signup`, `nouveau://categories`, ...

- iOS sim: `xcrun simctl openurl <udid> nouveau://settings` then confirm the system sheet:
  `axe tap --label Open --element-type Button --wait-timeout 5 --udid <udid>`.
- Android: `adb -s <serial> shell am start -W -a android.intent.action.VIEW -d nouveau://settings com.muhammadramdan.nouveau`.
- Physical iPhone: unverified (`devicectl device process launch --payload-url` is a candidate).
  Auth: Android emulator holds a logged-in demo session; a fresh iOS install lands on the login screen (`/login`, `/signup` reachable without auth).

## 3. Drive it

**iOS, xcode MCP first** (iOS 27 sims only - it lists no iOS 18.5 sims and no physical device on iOS 26):

1. `DeviceInteractionStartSession(deviceIdentifier=<udid>, sessionIdentifier="Title Case")` -> key.
2. `DeviceInteractionSynthesize(interactSessionKey, interactionCommand)`; empty command = capture only. Returns
   paths to screenshot, thumbnail and a text hierarchy with `hitPoint`s (use those, never guess from pixels).
   Verified grammar: tap `t X Y`, swipe `t X1 Y1 f X2 Y2 [dur]`. From Xcode's embedded docs (unverified):
   double tap `d X Y`, `drag X1 Y1 X2 Y2`, type text as last command, `activationBundleId` to launch an app.
3. Always `DeviceInteractionEndSession` (sessions are expensive).

**iOS, AXe fallback** (all sims incl. 18.5):

```bash
axe describe-ui --udid <udid> | jq -r '.. | objects | select(.AXLabel? != null and .AXLabel != "") | "\(.type) \"\(.AXLabel)\" \(.AXFrame)"'
axe tap --label "Sign In" [--element-type Button] [--wait-timeout 5] --udid <udid>   # or -x X -y Y (points)
axe swipe --start-x 200 --start-y 600 --end-x 200 --end-y 300 --udid <udid>
axe type 'text' --udid <udid>    # tap the field first; it dropped trailing chars once ("demo@examp") -> re-read AXValue
```

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

**iPhone Duo displays**: `simctl io <udid> enumerate` shows two phone screens: `primary` (1398x2034, active by
default) and `primary-1` (2007x2853, black while inactive). Capture one with `SIM_DISPLAY=primary|primary-1 $S/shot.sh ios duo ...`.
Which is "outer" vs "inner" and how to switch pose/fold state is **unknown**: no simctl, AXe or MCP command found,
and the Simulator.app UI that would expose it is absent in Xcode 27.1. Ask the user / check Xcode's device window.

## 5. Compare

For each shot, check against Apple HIG (iOS: navigation bars/large titles, SF Symbols, 44pt targets, safe areas,
Dynamic Type, system materials) and Material 3 (Android: top app bars, 48dp targets, M3 color roles, edge-to-edge
insets, predictive back). Report deviations per matrix cell, with the screenshot path.

## Known issues (2026-11-03)

- The iOS 27 launch crash (`EXC_BREAKPOINT`, no UIScene lifecycle) is fixed by the SDK 58 upgrade (#24). If it
  reappears, check that prebuild still generates `SceneDelegate.swift`.
- The app has no native dark theme yet, so dark screenshots currently match light ones (the toggles do work).
- **iPhone Duo:** AXe taps don't register (`axe type` works); tap with the xcode MCP instead. Long press is
  `t X Y 1.2`; several taps go in one command separated by spaces, not `;`. There is no CLI/MCP way to unfold,
  so the inner display (`primary-1`) stays black. Unfold from Xcode's device window by hand, or mark inner UNTESTED.
- One Metro serves every device: start it once (`bunx expo start --dev-client`) and have parallel per-device
  agents reuse it. They share the test account, so name test rows per device and delete only your own.
- A debug Android build opened cold from a share intent stops at the dev-server picker first; connect to Metro and the
  share screen follows.
- xcode MCP cannot target the physical iPhone 15 (iOS 26.6.2) or iOS 18.5 sims; use AXe / devicectl there.
