# Local Build & App Store Submission

Instructions for building and submitting the app locally without EAS cloud builds.

## Prerequisites

- Xcode (latest stable) with command line tools
- Android Studio with the Android SDK installed, plus `ANDROID_HOME` exported
- JDK 17 (required by React Native 0.83 / AGP)
- Node.js and Bun installed
- CocoaPods: `brew install cocoapods`

## Generate Native Projects

The `ios/` and `android/` folders are already committed. Only regenerate them if you change `app.json` config or need a clean slate:

```bash
bunx expo prebuild --clean
```

> ⚠️ `--clean` wipes the native folders and rewrites them from `app.json`. Any manual native modifications will be lost. Omit `--clean` for a non-destructive sync.

---

## iOS (App Store)

### 1. Open in Xcode

```bash
open ios/Nouveau.xcworkspace
```

### 2. Configure Signing

- Select the **Nouveau** target in the project navigator
- Go to **Signing & Capabilities**
- Set Team to your Apple Developer account (Team ID: `C4SQMCY5WT`)
- Ensure a valid **Distribution** provisioning profile is selected
- Do the same for the **NouveauShareExtension** target

### 3. Archive

1. Set the destination to **Any iOS Device (arm64)** in the toolbar
2. Go to **Product > Archive**
3. Wait for the archive to complete

### 4. Submit to App Store Connect

1. Once archived, the **Organizer** window opens automatically (or open via **Window > Organizer**)
2. Select the latest archive
3. Click **Distribute App**
4. Choose **App Store Connect** > **Upload**
5. Follow the wizard (leave defaults for bitcode/symbols)
6. After upload, go to [App Store Connect](https://appstoreconnect.apple.com) to submit for review

---

## Android

### Quick: Debug APK (sideload / testing)

For an unsigned debug APK — no keystore setup needed:

```bash
cd android && ./gradlew assembleDebug
```

Output:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

This is signed with the bundled `android/app/debug.keystore` and is **not** suitable for Play Store or sharing as a release build.

---

### Set Up Release Signing Keystore

Required for any release build (APK or AAB). Skip this step if you already have a keystore from a previous build.

Generate a release keystore:

```bash
keytool -genkeypair -v \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -alias key0 \
  -dname "CN=Muhammad Ramdan" \
  -keystore android/app/release.keystore
```

If you previously built with EAS, download your existing keystore:

```bash
bunx eas-cli credentials
```

### Configure Signing in Gradle

Add to `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=release.keystore
MYAPP_UPLOAD_KEY_ALIAS=key0
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_STORE_PASSWORD
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

In `android/app/build.gradle`, add a `release` signing config alongside the existing `debug` one, and update the `release` build type to use it:

```groovy
android {
    // ...
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release  // replace the existing `signingConfig signingConfigs.debug`
            // ...keep the existing shrinkResources / minifyEnabled / proguardFiles / crunchPngs lines
        }
    }
}
```

> Note: the generated `android/app/build.gradle` currently points the `release` build type at `signingConfigs.debug`. You must change that single line — adding the new block alone won't take effect.

### Release APK (sideload / direct distribution)

```bash
cd android && ./gradlew assembleRelease
```

Output:

```
android/app/build/outputs/apk/release/app-release.apk
```

Use this for distributing outside the Play Store (e.g. direct download, MDM, internal testing).

### Release AAB (Google Play Store)

```bash
cd android && ./gradlew bundleRelease
```

Output:

```
android/app/build/outputs/bundle/release/app-release.aab
```

### Submit to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (or create a new one with package `com.muhammadramdan.nouveau`)
3. Go to **Production** (or a testing track like Internal/Closed/Open)
4. Click **Create new release**
5. Upload the `app-release.aab` file
6. Add release notes and submit for review

---

## Notes

- Always run `bunx expo prebuild` (without `--clean` if you want to preserve manual native edits) after changing `app.json` to sync native projects
- App version (`expo.version` in `app.json`) is the source of truth; `bunx expo prebuild` propagates it into `Info.plist` and `build.gradle`
- iOS build number is **not** currently set in `app.json` — it lives in `ios/Nouveau/Info.plist` (`CFBundleVersion`) and is bumped via Xcode or by adding `expo.ios.buildNumber` to `app.json` and re-running prebuild
- Android version code lives in `android/app/build.gradle` (`versionCode`, currently `1`) — bump it manually, or add `expo.android.versionCode` to `app.json` and re-run prebuild
- `eas.json` is configured with `"appVersionSource": "remote"`, so EAS-tracked versions don't apply to local Gradle/Xcode builds
- Keep your keystore file safe — you need the same keystore for all future Android updates
- Do **not** commit keystore files or passwords to git. The project's `.gitignore` already ignores the entire `/android` and `/ios` folders (and `*.jks`), but if you ever move keystores elsewhere, make sure they're explicitly ignored — `*.keystore` is **not** in `.gitignore` by default
