# iOS Build Instructions

This Angular application has been configured to build as a native iOS app using Capacitor.

## Prerequisites

- macOS with Xcode installed
- Node.js and npm
- CocoaPods (usually installed with Xcode)

## Building for iOS

### 1. Build the Angular App

```bash
npm run build
```

### 2. Sync with Capacitor

```bash
npm run sync:ios
```

Or use the combined command:

```bash
npm run build:ios
```

### 3. Open in Xcode

```bash
npm run open:ios
```

Or manually:

```bash
open ios/App/App.xcworkspace
```

## Development Workflow

1. Make changes to your Angular code
2. Run `npm run build:ios` to build and sync
3. Open Xcode and run the app on a simulator or device

## Important Notes

- The iOS project is located in the `ios/` directory
- The web assets are automatically copied to `ios/App/App/public/` when you sync
- You need to rebuild and sync after making changes to the Angular code
- For live development, you can use `ng serve` for web, but for iOS you need to build and sync

## Running on Device

1. Open the project in Xcode
2. Select your development team in the project settings
3. Connect your iOS device
4. Select your device as the build target
5. Click Run

## App Configuration

The app is configured with:
- **App ID**: `com.apartmentmanager.app`
- **App Name**: `Apartment Manager`
- **Web Directory**: `dist/part-manager/browser`

You can modify these settings in `capacitor.config.ts`.

