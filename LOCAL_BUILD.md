# Local Build & App Store Submission

Instructions for building and submitting the app locally without EAS cloud builds.

## Prerequisites

- Xcode (latest stable) with command line tools
- Android Studio with SDK installed
- Node.js and Bun installed
- CocoaPods: `brew install cocoapods`

## Generate Native Projects

```bash
bunx expo prebuild --clean
```

This regenerates both `ios/` and `android/` directories from the Expo config.

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
- Do the same for the **NouveauShareExtension** target if present

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

## Android (Google Play Store)

### 1. Set Up Signing Keystore

> Skip this step if you already have a keystore from a previous build.

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
eas credentials
```

### 2. Configure Signing in Gradle

Add to `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=release.keystore
MYAPP_UPLOAD_KEY_ALIAS=key0
MYAPP_UPLOAD_STORE_PASSWORD=YOUR_STORE_PASSWORD
MYAPP_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Add the signing config in `android/app/build.gradle` under `android {}`:

```groovy
signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...existing config
    }
}
```

### 3. Build Release AAB

```bash
cd android && ./gradlew bundleRelease
```

The output file will be at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Submit to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (or create a new one with package `com.muhammadramdan.nouveau`)
3. Go to **Production** (or a testing track like Internal/Closed/Open)
4. Click **Create new release**
5. Upload the `app-release.aab` file
6. Add release notes and submit for review

---

## Notes

- Always run `bunx expo prebuild --clean` after changing `app.json` config to regenerate native projects
- iOS version and build number are set in `app.json` under `expo.version` and `expo.ios.buildNumber`
- Android version code is set in `app.json` under `expo.android.versionCode`
- Keep your keystore file safe — you need the same keystore for all future Android updates
- Do **not** commit keystore files or passwords to git
