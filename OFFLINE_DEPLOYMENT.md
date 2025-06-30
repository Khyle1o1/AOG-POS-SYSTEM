# 🚀 POS System - Offline Deployment Guide

This guide covers all the offline deployment options available for your POS System. Choose the method that best fits your needs.

## 🎯 Quick Start Options

### Option 1: One-Click Deployment (Simplest)
**Just double-click and go!**

1. **Double-click** `deploy-offline.bat`
2. Wait for the build process to complete
3. Your browser will automatically open to the POS System
4. Start using your system immediately!

**Best for:** Quick testing and immediate use

### Option 2: Enhanced PowerShell Deployment
**More control and better user experience**

1. **Right-click** `deploy-offline.ps1` → "Run with PowerShell"
2. Follow the guided setup process
3. Choose from multiple options when complete
4. Get detailed status information throughout

**Best for:** Regular use and when you want more control

### Option 3: Create Portable Package
**Share with others or deploy on multiple computers**

1. Run: `npm run deploy:portable`
2. Get a complete portable package in `pos-system-portable/`
3. Share the folder or ZIP file with others
4. Recipients just double-click `Launch-POS-System.bat`

**Best for:** Distribution to other computers or users

## 📋 Available Commands

### NPM Scripts (run with `npm run <script>`)

| Script | Description |
|--------|-------------|
| `deploy:offline` | Enhanced PowerShell deployment with guided setup |
| `deploy:portable` | Creates a complete portable package for distribution |
| `deploy:quick` | Quick deployment with auto-start (no user interaction) |
| `deploy:local` | Standard local deployment (existing script) |

### Direct Script Execution

| File | Description |
|------|-------------|
| `deploy-offline.bat` | Simple double-click deployment |
| `deploy-offline.ps1` | Enhanced PowerShell deployment |
| `scripts/create-portable-package.ps1` | Creates portable distribution package |

## 🎪 Features of Each Method

### `deploy-offline.bat` Features:
- ✅ Simple double-click execution
- ✅ Automatic browser opening
- ✅ Clear error messages
- ✅ No technical knowledge required
- ✅ Colorful progress display

### `deploy-offline.ps1` Features:
- ✅ Step-by-step progress tracking
- ✅ Smart build detection (skip if already built)
- ✅ Multiple post-deployment options
- ✅ Enhanced error handling
- ✅ Beautiful colored output
- ✅ Portable package creation in dist folder

### Portable Package Features:
- ✅ Complete standalone package
- ✅ Multiple launcher options (batch + PowerShell)
- ✅ Desktop shortcut creator
- ✅ System requirements checker
- ✅ Comprehensive user documentation
- ✅ ZIP package for easy distribution

## 📦 What's Included in Portable Packages

When you create a portable package, you get:

```
pos-system-portable/
├── Launch-POS-System.bat          # Main launcher (double-click this)
├── Launch-POS-System.ps1          # PowerShell launcher
├── Create-Desktop-Shortcut.bat    # Creates desktop shortcut
├── System-Check.bat               # Checks system requirements
├── README.txt                     # User guide
└── [All POS System files]         # Your application files
```

## 🔧 System Requirements

### For Development/Building:
- Node.js 18+ installed
- npm package manager
- Windows PowerShell (for enhanced scripts)

### For End Users (Portable Package):
- Node.js 18+ installed
- Modern web browser
- Windows 10/11 (scripts optimized for Windows)
- No internet connection required after setup

## 🛠️ Troubleshooting

### "Node.js not found" Error
```bash
# Install Node.js from https://nodejs.org/
# After installation, restart your computer
# Then try running the script again
```

### "Build failed" Error
```bash
# Try cleaning and rebuilding:
npm run clean
npm install
npm run build:prod
```

### Port Already in Use
```bash
# Close other applications using port 3000, or
# Manually specify a different port:
npx serve dist -s -p 3001
```

### PowerShell Execution Policy Error
```powershell
# Run this command as Administrator:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎨 Customization Options

### Change Default Port
Edit the scripts and change `3000` to your preferred port:
- In `deploy-offline.bat`: Change the port in the `npx serve` command
- In `deploy-offline.ps1`: Change the `$Port = "3000"` parameter
- In portable scripts: Modify the port in the launcher templates

### Custom Package Names
```powershell
# Create portable package with custom name:
.\scripts\create-portable-package.ps1 -OutputDir "my-custom-pos" -Version "2.0.0"
```

### Auto-Start Deployment
```powershell
# Deploy and start automatically without user interaction:
.\deploy-offline.ps1 -AutoStart -NoInteraction
```

## 📋 Deployment Checklist

### Before Deploying:
- [ ] Node.js is installed
- [ ] All dependencies are working (`npm install`)
- [ ] Application builds successfully (`npm run build:prod`)
- [ ] No linting errors (`npm run lint`)

### For Distribution:
- [ ] Create portable package (`npm run deploy:portable`)
- [ ] Test the launcher scripts
- [ ] Include system requirements in documentation
- [ ] Provide support contact information

### For Recipients:
- [ ] Install Node.js from https://nodejs.org/
- [ ] Extract/copy the portable package
- [ ] Double-click `Launch-POS-System.bat`
- [ ] Verify system access via System-Check.bat if needed

## 🆘 Getting Help

1. **Run System Check**: Use `System-Check.bat` in portable packages
2. **Check Logs**: Look for error messages in the console windows
3. **Manual Start**: Try running `npx serve . -s -p 3000` in the application folder
4. **Browser Test**: Manually navigate to `http://localhost:3000`

## 🔐 Security Notes

- All deployment methods run locally on your computer
- No data is sent to external servers
- The application runs on `localhost` only
- No internet connection required after initial Node.js setup
- All scripts include safety checks and error handling

---

**POS System v1.0.0 by AOG Tech**  
*Offline deployment made simple!* 