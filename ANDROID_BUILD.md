# Android APK build

## Prerequisites

- Node.js and npm
- [Android Studio](https://developer.android.com/studio) (or Android SDK + JDK 17)
- Set `ANDROID_HOME` to your SDK path (Android Studio sets this when you install)

## Build debug APK (quick install / testing)

From the project root:

```bash
npm run apk
```

Or step by step:

```bash
npm run build
npm run sync:android
cd android && ./gradlew assembleDebug
```

The debug APK is written to:

`android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected device or emulator:

```bash
cd android && ./gradlew installDebug
```

## Build release APK (for distribution)

1. Sync the web build and open the Android project:

   ```bash
   npm run build:android
   npm run open:android
   ```

2. In Android Studio: **Build → Generate Signed Bundle / APK** → choose **APK** → create or pick a keystore and complete the wizard.

   Or from the command line with a keystore:

   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   Release APK path: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

   For a signed release APK from the CLI, configure signing in `android/app/build.gradle` (signingConfigs and buildTypes.release.signingConfig).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build:android` | Build web app and sync into `android/` |
| `npm run sync:android` | Sync web assets only (after `ng build`) |
| `npm run open:android` | Open the Android project in Android Studio |
| `npm run apk` | Build web app, sync, and run `assembleDebug` (produces debug APK) |

## Run on device/emulator

With Android Studio: open the project with `npm run open:android`, then Run (▶).

From CLI with a device/emulator connected:

```bash
npm run build:android
cd android && ./gradlew installDebug
```

Then start the app "Apartment Manager" on the device.
