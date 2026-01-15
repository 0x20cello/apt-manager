# macOS Build Instructions

This Angular application has been configured to build as a native macOS app using Electron.

## Prerequisites

- macOS
- Node.js and npm

## Development

### Run in Development Mode

1. Start the Angular dev server:
```bash
npm start
```

2. In another terminal, run Electron:
```bash
npm run electron:dev
```

This will open the Electron app connected to the Angular dev server with hot reload.

### Build and Run

```bash
npm run electron:build
```

This builds the Angular app and runs it in Electron.

## Building for Distribution

### Create macOS App Bundle

```bash
npm run electron:package:mac
```

This will:
1. Build the Angular application
2. Package it as a macOS app bundle
3. Create a DMG installer
4. Output files will be in the `release/` directory

### Create Universal Build (Intel + Apple Silicon)

The build configuration is set to create universal binaries that work on both Intel and Apple Silicon Macs.

## App Configuration

The app is configured with:
- **App ID**: `com.apartmentmanager.app`
- **Product Name**: `Apartment Manager`
- **Category**: Productivity

You can modify these settings in the `build` section of `package.json`.

## Icon

To add a custom app icon:
1. Create an `icon.icns` file (macOS icon format)
2. Place it in the `electron/` directory
3. The icon will be automatically used when building

You can convert PNG to ICNS using tools like:
- `iconutil` (built into macOS)
- Online converters
- Image2icon app

## Distribution

After building, you'll find:
- **App Bundle**: `release/mac/Apartment Manager.app`
- **DMG**: `release/Apartment Manager-{version}.dmg`

The DMG can be distributed to users. They can drag the app to Applications folder to install.

## Troubleshooting

### App won't open
- Check Console.app for error messages
- Make sure the Angular build completed successfully
- Verify `dist/part-manager/browser/index.html` exists

### Build fails
- Ensure all dependencies are installed: `npm install`
- Check that Angular build succeeds: `npm run build`
- Verify Electron is installed: `npm list electron`

