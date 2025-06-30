#!/usr/bin/env pwsh

# POS System - Portable Package Creator
# Creates a complete offline deployment package

param(
    [string]$OutputDir = "pos-system-portable",
    [string]$Version = "1.0.0"
)

Write-Host "Creating Portable POS System Package..." -ForegroundColor Green
Write-Host "Output Directory: $OutputDir" -ForegroundColor Cyan

# Check if dist folder exists
if (!(Test-Path "dist")) {
    Write-Host "Building application first..." -ForegroundColor Yellow
    npm run build:prod
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
}

# Create output directory
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Copy dist files
Write-Host "Copying application files..." -ForegroundColor Yellow
Copy-Item "dist\*" -Destination $OutputDir -Recurse

# Create launcher scripts
Write-Host "Creating launcher scripts..." -ForegroundColor Yellow

# Windows Batch Launcher
$batchContent = @"
@echo off
title POS System v$Version
color 0A

echo.
echo ======================================
echo      POS System v$Version
echo ======================================
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is required but not found!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

echo Starting POS System...
echo.
echo Server will be available at: http://localhost:3000
echo.
echo To stop the server, close this window or press Ctrl+C
echo.

timeout /t 2 /nobreak >nul
start http://localhost:3000

npx serve . -s -p 3000
"@

$batchContent | Out-File -FilePath "$OutputDir\Launch-POS-System.bat" -Encoding ascii

# PowerShell Launcher
$psContent = @"
# POS System Launcher
Write-Host "Starting POS System v$Version..." -ForegroundColor Green

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is required but not installed!" -ForegroundColor Red
    Write-Host "Please install from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Server starting at: http://localhost:3000" -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

npx serve . -s -p 3000
"@

$psContent | Out-File -FilePath "$OutputDir\Launch-POS-System.ps1" -Encoding utf8

# Create installation guide
$guideContent = @"
# POS System v$Version - Portable Package

## Quick Start Guide

### Option 1: Double-Click Launch (Recommended)
1. Double-click \`Launch-POS-System.bat\`
2. Wait for your browser to open automatically
3. Start using your POS System!

### Option 2: PowerShell Launch
1. Right-click \`Launch-POS-System.ps1\`
2. Select "Run with PowerShell"
3. Your browser will open automatically

### Option 3: Manual Launch
1. Open Command Prompt or PowerShell in this folder
2. Run: \`npx serve . -s -p 3000\`
3. Open browser to: http://localhost:3000

## System Requirements
- Windows 10/11 (or compatible OS)
- Node.js 18+ (download from https://nodejs.org/)
- Modern web browser (Chrome, Firefox, Edge)
- No internet connection required after setup

## Troubleshooting

### "Node.js not found" Error
- Install Node.js from https://nodejs.org/
- Restart your computer after installation
- Try running the launcher again

### Port Already in Use
- Close any other applications using port 3000
- Or manually start with: \`npx serve . -s -p 3001\`

### Browser Doesn't Open
- Manually open browser to: http://localhost:3000
- Try a different browser if issues persist

## Features
✓ Complete offline operation
✓ No installation required
✓ Portable - runs from any folder
✓ Secure local hosting
✓ Modern web interface

## Support
For technical support, refer to the main project documentation.

---
POS System v$Version by AOG Tech
Package created: $(Get-Date)
"@

$guideContent | Out-File -FilePath "$OutputDir\README.txt" -Encoding utf8

# Create desktop shortcut creator
$shortcutContent = @"
@echo off
echo Creating desktop shortcut...

set "SCRIPT_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\POS System.lnk"

powershell -Command "& { `$WshShell = New-Object -comObject WScript.Shell; `$Shortcut = `$WshShell.CreateShortcut('%SHORTCUT_PATH%'); `$Shortcut.TargetPath = '%SCRIPT_DIR%Launch-POS-System.bat'; `$Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; `$Shortcut.Description = 'POS System v$Version'; `$Shortcut.Save() }"

if exist "%SHORTCUT_PATH%" (
    echo Desktop shortcut created successfully!
    echo You can now double-click "POS System" on your desktop to launch.
) else (
    echo Failed to create desktop shortcut.
)

pause
"@

$shortcutContent | Out-File -FilePath "$OutputDir\Create-Desktop-Shortcut.bat" -Encoding ascii

# Create system check script
$checkContent = @"
@echo off
title POS System - System Check
color 0B

echo.
echo =====================================
echo    POS System - System Check
echo =====================================
echo.

echo Checking system requirements...
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [✓] Node.js: INSTALLED
    for /f "tokens=*" %%i in ('node --version') do echo     Version: %%i
) else (
    echo [✗] Node.js: NOT INSTALLED
    echo     Download from: https://nodejs.org/
)

echo.

REM Check npm
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo [✓] npm: INSTALLED
    for /f "tokens=*" %%i in ('npm --version') do echo     Version: %%i
) else (
    echo [✗] npm: NOT INSTALLED
    echo     Should come with Node.js
)

echo.

REM Check serve package
npx serve --version >nul 2>nul
if %errorlevel% equ 0 (
    echo [✓] serve package: AVAILABLE
) else (
    echo [!] serve package: Will be downloaded when needed
)

echo.
echo =====================================
echo.

if exist "index.html" (
    echo [✓] POS System files: FOUND
    echo     Ready to launch!
) else (
    echo [✗] POS System files: NOT FOUND
    echo     Make sure you're in the correct folder
)

echo.
pause
"@

$checkContent | Out-File -FilePath "$OutputDir\System-Check.bat" -Encoding ascii

Write-Host "Creating ZIP package..." -ForegroundColor Yellow
$zipPath = "pos-system-v$Version-portable.zip"
if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Compress-Archive -Path "$OutputDir\*" -DestinationPath $zipPath -Force
} else {
    Write-Host "Please manually create a ZIP file from the $OutputDir folder" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Portable package created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Package location: $OutputDir" -ForegroundColor Cyan
if (Test-Path $zipPath) {
    Write-Host "📦 ZIP package: $zipPath" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "🚀 To distribute:" -ForegroundColor Yellow
Write-Host "   1. Share the entire '$OutputDir' folder, or"
Write-Host "   2. Share the ZIP file '$zipPath'"
Write-Host ""
Write-Host "👥 Users can run it by:" -ForegroundColor Yellow
Write-Host "   1. Double-clicking 'Launch-POS-System.bat'"
Write-Host "   2. Or running 'Launch-POS-System.ps1'"
Write-Host ""

$openFolder = Read-Host "Open the package folder? (Y/n)"
if ($openFolder -ne "n" -and $openFolder -ne "N") {
    Invoke-Item $OutputDir
} 