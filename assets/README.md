# Application Icons

This directory should contain the application icons in the following formats:

- `icon.png` (512x512 or larger PNG for Linux)
- `icon.ico` (Windows ICO format)
- `icon.icns` (macOS ICNS format)

## Icon Requirements

- **Size**: Start with at least 1024x1024 pixels
- **Format**: PNG for the source image
- **Background**: Should work on both light and dark backgrounds

## Tools for Icon Conversion

You can use these online tools or applications to convert your PNG to other formats:

- [Iconifier](https://iconifier.net/) - Convert PNG to all formats
- [ICO Convert](https://icoconvert.com/) - PNG to ICO/ICNS converter
- [Electron Icon Maker](https://github.com/jaretburkett/electron-icon-maker) - CLI tool

## Default Icon

Until you provide custom icons, Electron will use the default Electron icon for your application.

# Assets Directory

This directory contains assets needed for building the POS System across different platforms.

## Required Files for macOS Build

### Icon Files
- `icon.icns` - macOS app icon (required for macOS build)
  - Should be 1024x1024 resolution
  - Can be created from a PNG using online converters or macOS tools

### Entitlements
- `entitlements.mac.plist` - ✅ Already created
  - Defines app permissions for macOS

## Creating macOS Icon

1. **From PNG to ICNS**:
   - Use online converter: https://cloudconvert.com/png-to-icns
   - Or use macOS `iconutil` command:
     ```bash
     mkdir MyIcon.iconset
     # Add various sizes of PNG files
     iconutil -c icns MyIcon.iconset
     ```

2. **Icon Sizes Needed**:
   - 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024

## Temporary Solution

If you don't have an icon file, the build will use Electron's default icon and show a warning.
The app will still work perfectly, just without a custom icon.

## Build Without Icon

The current configuration will build successfully even without the icon file,
but will show this warning: "default Electron icon is used" 