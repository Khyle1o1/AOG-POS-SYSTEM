# Electron Desktop Application Deployment Guide

This guide explains how to package and deploy your POS System as a cross-platform desktop application using Electron.

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- For Windows builds: Windows 10+ or Windows Server 2019+
- For macOS builds: macOS 10.13+ and Xcode Command Line Tools
- For Linux builds: Ubuntu 16.04+ or equivalent

## Project Structure

```
├── electron/
│   ├── main.cjs         # Main Electron process (CommonJS)
│   └── preload.cjs      # Preload script for secure IPC (CommonJS)
├── assets/
│   ├── icon.png         # App icon (512x512 PNG)
│   ├── icon.ico         # Windows icon
│   └── icon.icns        # macOS icon
├── dist/                # Built web application
├── release/             # Packaged desktop applications
├── electron-builder.json # Packaging configuration
└── package.json         # Updated with Electron scripts
```

**Note:** The Electron files use `.cjs` extension to ensure they are treated as CommonJS modules, which is required because the main package.json has `"type": "module"`.

## Development

### 1. Run in Development Mode

Start the web development server and Electron simultaneously:

```bash
npm run electron
```

This will:
- Start Vite dev server on http://localhost:5173
- Wait for the server to be ready
- Launch Electron with hot reload

### 2. Development-only Electron

If you want to run just Electron (with the dev server already running):

```bash
npm run electron:dev
```

## Building for Production

### 1. Prepare Application Icons

Create application icons in the `assets/` directory:

- `icon.png` - 512x512 PNG for Linux (can be larger)
- `icon.ico` - Windows ICO format (multiple sizes embedded)
- `icon.icns` - macOS ICNS format (multiple sizes embedded)

**Tools for icon generation:**
- [Iconifier](https://iconifier.net/) - Online converter
- [Electron Icon Maker](https://github.com/jaretburkett/electron-icon-maker) - CLI tool

### 2. Build Web Application

```bash
npm run build:prod
```

### 3. Package for Current Platform

```bash
npm run electron:pack
```

### 4. Build Distributables

#### For Current Platform
```bash
npm run electron:dist
```

#### For Specific Platforms
```bash
# Windows only
npm run electron:dist:win

# macOS only
npm run electron:dist:mac

# Linux only
npm run electron:dist:linux

# All platforms (requires appropriate build environment)
npm run electron:dist:all
```

## Output Files

Packaged applications will be created in the `release/` directory:

### Windows
- `.exe` installer (NSIS)
- `.exe` portable version
- `.zip` archive

### macOS
- `.dmg` installer
- `.zip` archive

### Linux
- `.AppImage` universal package
- `.deb` Debian/Ubuntu package
- `.rpm` Red Hat/SUSE package
- `.tar.gz` archive

## Cross-Platform Building

### Building on Different Platforms

| Build Platform | Can Build For |
|----------------|---------------|
| Windows        | Windows, Linux |
| macOS          | macOS, Windows, Linux |
| Linux          | Linux, Windows |

**Note:** Code signing requires the target platform (e.g., macOS code signing requires macOS).

### Docker for Cross-Platform Building

For consistent builds across platforms, you can use Docker:

```bash
# Build for all platforms using Docker
docker run --rm -ti \
  --env ELECTRON_CACHE="/tmp/electron" \
  --env ELECTRON_BUILDER_CACHE="/tmp/electron-builder" \
  -v $(pwd):/project \
  -v $(pwd)/node_modules:/project/node_modules \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run electron:dist:all"
```

## Configuration

### Electron Builder Configuration

The `electron-builder.json` file contains packaging configuration:

- **App metadata:** Name, ID, copyright
- **File patterns:** What to include/exclude
- **Platform-specific settings:** Icons, installers, code signing
- **Auto-updater:** GitHub releases integration

### Important Configuration Options

```json
{
  "appId": "com.posystem.app",
  "productName": "POS System",
  "directories": {
    "output": "release"
  },
  "publish": {
    "provider": "github",
    "owner": "your-github-username",
    "repo": "pos-system"
  }
}
```

## Security Considerations

The Electron setup includes several security best practices:

1. **Context Isolation:** Enabled by default
2. **Node Integration:** Disabled in renderer
3. **Preload Script:** Secure API exposure
4. **Content Security Policy:** Web security
5. **Protocol Handler:** Prevents navigation attacks

## Auto-Updates

The application includes auto-update functionality using `electron-updater`:

1. Configure your GitHub repository in `electron-builder.json`
2. Create GitHub releases with the built artifacts
3. The app will automatically check for and install updates

### Publishing Releases

```bash
# Build and publish to GitHub Releases
npm run electron:dist -- --publish=always
```

## Debugging

### Development Debugging

- DevTools are automatically opened in development
- Use `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Opt+I` (macOS) to toggle DevTools
- Main process logs appear in the terminal
- Renderer process logs appear in DevTools console

### Production Debugging

```bash
# Enable DevTools in production build
cross-env NODE_ENV=development npm run electron:dist
```

## Performance Optimization

### Reducing Bundle Size

1. **Exclude unnecessary files:**
   ```json
   "files": [
     "!node_modules/**/*.md",
     "!node_modules/**/test/**/*"
   ]
   ```

2. **Use `asarUnpack` for native modules:**
   ```json
   "asarUnpack": ["**/*.node"]
   ```

3. **Enable compression:**
   ```json
   "compression": "maximum"
   ```

### Startup Performance

- Preload critical resources
- Defer non-essential initialization
- Use `ready-to-show` event to prevent visual flash

## Common Issues and Solutions

### Issue: "require is not defined in ES module scope"
**Solution:** This occurs when `package.json` has `"type": "module"` but Electron files use CommonJS syntax. 
- Rename `electron/main.js` to `electron/main.cjs`
- Rename `electron/preload.js` to `electron/preload.cjs`
- Update `package.json` main field to point to `.cjs` file
- Update preload path in main process to use `.cjs` extension

This project has already been configured with this fix.

### Issue: Application won't start
- Check that `dist/` directory exists and contains built files
- Verify `electron/main.cjs` path is correct
- Check console for error messages

### Issue: Icons not displaying
- Ensure icon files exist in `assets/` directory
- Verify icon file formats and sizes
- Check file paths in `electron-builder.json`

### Issue: Auto-updater not working
- Verify GitHub repository configuration
- Check release artifacts are properly uploaded
- Ensure code signing is set up for production

### Issue: Large application size
- Review included files in `electron-builder.json`
- Exclude development dependencies
- Use `electron-builder` analysis tools

## Testing

### Manual Testing Checklist

- [ ] Application starts correctly
- [ ] All main features work as expected
- [ ] Menu items function properly
- [ ] Print functionality works
- [ ] File operations work (if applicable)
- [ ] Application closes cleanly
- [ ] Auto-updater works (in production builds)

### Automated Testing

Consider adding E2E tests using tools like:
- [Spectron](https://github.com/electron-userland/spectron) (deprecated, but still usable)
- [Playwright](https://playwright.dev/) with Electron support
- [WebdriverIO](https://webdriver.io/) with Electron service

## Distribution

### Code Signing

For production applications, code signing is recommended:

#### Windows (requires Windows)
```bash
# Install certificate and sign
electron-builder --win --publish=never
```

#### macOS (requires macOS and Apple Developer Account)
```bash
# Sign and notarize
electron-builder --mac --publish=never
```

### Deployment Strategies

1. **Direct Download:** Host installers on your website
2. **GitHub Releases:** Use GitHub's release system
3. **App Stores:** Submit to Microsoft Store, Mac App Store
4. **Enterprise Distribution:** Internal deployment systems

## Support

For issues specific to Electron packaging:
- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [GitHub Issues](https://github.com/electron-userland/electron-builder/issues) 