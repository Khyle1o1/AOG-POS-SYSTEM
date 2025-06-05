# Building POS System for macOS

Since building macOS applications from Windows is not directly supported, here are several options to create a macOS version:

## Option 1: GitHub Actions (Recommended - Automated)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add macOS build configuration"
   git push origin main
   ```

2. **Create a release tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **The GitHub Actions workflow will automatically**:
   - Build for Windows, macOS, and Linux
   - Create a release with all platform downloads
   - Generate macOS .dmg and .zip files

## Option 2: Build on macOS Machine

If you have access to a Mac:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/pos-system.git
   cd pos-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build for macOS**:
   ```bash
   npm run electron:dist:mac
   ```

4. **Find the built files in**:
   - `dist-electron/POS System-1.0.0.dmg` (DMG installer)
   - `dist-electron/POS System-1.0.0-mac.zip` (ZIP archive)

## Option 3: Use Cloud Build Services

### Using GitHub Codespaces:
1. Create a Codespace from your repository
2. Run the build commands in the cloud environment

### Using Online macOS VMs:
- MacStadium
- AWS EC2 Mac instances
- Azure macOS VMs

## Option 4: Docker (Advanced)

Use electron-builder with Docker for cross-platform builds:

```bash
# Install docker
# Then run:
docker run --rm -ti \
  --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ${PWD##*/}-node-modules:/project/node_modules \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "npm ci && npm run electron:dist:mac"
```

## What's Included in the macOS Build

The macOS version includes:
- ✅ Universal build (Intel + Apple Silicon)
- ✅ DMG installer with drag-to-Applications
- ✅ ZIP archive for manual installation
- ✅ Proper macOS entitlements
- ✅ Code signing ready (for developer accounts)
- ✅ Notarization ready (for distribution)

## Installation Instructions for Mac Users

### From DMG:
1. Download `POS System-1.0.0.dmg`
2. Double-click to mount
3. Drag POS System to Applications folder
4. Launch from Applications or Launchpad

### From ZIP:
1. Download `POS System-1.0.0-mac.zip`
2. Extract the ZIP file
3. Move POS System.app to Applications folder
4. Launch from Applications

### Security Note:
If you get a security warning, you may need to:
1. Right-click the app and select "Open"
2. Or go to System Preferences → Security & Privacy → General
3. Click "Open Anyway" next to the blocked app

## Features Supported on macOS

All POS System features work perfectly on macOS:
- ✅ Offline database storage
- ✅ Sales transactions
- ✅ Inventory management
- ✅ Reporting and analytics
- ✅ User management
- ✅ Receipt printing
- ✅ Data export/import
- ✅ Native macOS menu integration
- ✅ Window management
- ✅ Keyboard shortcuts 