param(
    [string]$OutputDir = "pos-system-portable",
    [string]$Version = "1.0.0"
)

Write-Host "Creating Portable POS System Package..." -ForegroundColor Green

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

# Copy dist files - simplified approach
Write-Host "Copying application files..." -ForegroundColor Yellow

# Ensure we copy only from dist folder
Copy-Item "dist\index.html" -Destination "$OutputDir\index.html" -Force
if (Test-Path "dist\assets") {
    Copy-Item "dist\assets" -Destination "$OutputDir\assets" -Recurse -Force
}

# Copy any other files that might be in dist
Get-ChildItem "dist" -File | Where-Object { $_.Name -ne "index.html" -and $_.Name -ne "assets" } | Copy-Item -Destination $OutputDir -Force

# Verify copy worked
if (Test-Path "$OutputDir\index.html") {
    Write-Host "Application files copied successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to copy files" -ForegroundColor Red
    exit 1
}

# Create custom Node.js server for proper MIME types
Write-Host "Creating custom server..." -ForegroundColor Yellow
$serverScript = @'
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let filePath = '.' + req.url;
    
    // If requesting root, serve index.html
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // If no extension and not a file, serve index.html (SPA routing)
    if (!path.extname(filePath) && !fs.existsSync(filePath)) {
        filePath = './index.html';
    }

    // Get file extension for MIME type
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    // Check if file exists
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found, serve index.html for SPA routing
                fs.readFile('./index.html', (err, content) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Server Error');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code);
            }
        } else {
            // Success - serve the file with correct MIME type
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     POS System Server                        ║
║                                                              ║
║  Server running at: http://localhost:${PORT}                     ║
║                                                              ║
║  Press Ctrl+C to stop the server                            ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    // Try to open browser automatically
    const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
    require('child_process').exec(start + ' http://localhost:' + PORT);
});
'@

$serverScript | Out-File -FilePath "$OutputDir\server.cjs" -Encoding utf8

# Create batch launcher with custom server
$batchScript = '@echo off
title POS System
echo Starting POS System...
echo Server will be at: http://localhost:3000

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Install from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting server with proper ES module support...
timeout /t 2 /nobreak >nul
node server.cjs'

$batchScript | Out-File -FilePath "$OutputDir\Launch-POS-System.bat" -Encoding ascii

# Create PowerShell launcher with custom server
$psScript = 'Write-Host "Starting POS System..." -ForegroundColor Green

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js required! Install from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting server with proper ES module support..." -ForegroundColor Yellow
Write-Host "Server will be at: http://localhost:3000" -ForegroundColor Cyan
Start-Sleep -Seconds 2

node server.cjs'

$psScript | Out-File -FilePath "$OutputDir\Launch-POS-System.ps1" -Encoding utf8

# Create enhanced README
$readmeText = "POS System - Portable Package

Quick Start:
1. Double-click Launch-POS-System.bat
2. Wait for browser to open
3. Start using your POS System

Features:
- Custom Node.js server with proper MIME type handling
- Fixed ES module loading issues
- Automatic browser opening
- No external dependencies beyond Node.js

Requirements:
- Node.js 18+ from https://nodejs.org/
- Modern web browser (Chrome, Firefox, Edge)

Troubleshooting:
- If Node.js is not found, install it from https://nodejs.org/
- If port 3000 is busy, close other applications or modify server.js
- The custom server fixes MIME type issues that occur with other static servers
- Clear browser cache if you see old cached content

Technical Details:
- Uses custom Node.js HTTP server for optimal compatibility
- Serves JavaScript files with application/javascript MIME type
- Includes CORS headers for local development
- Handles SPA routing correctly

Package created: " + (Get-Date)

$readmeText | Out-File -FilePath "$OutputDir\README.txt" -Encoding utf8

# Create ZIP
Write-Host "Creating ZIP package..." -ForegroundColor Yellow
$zipPath = "pos-system-v$Version-portable.zip"
try {
    Compress-Archive -Path "$OutputDir\*" -DestinationPath $zipPath -Force
    Write-Host "ZIP created: $zipPath" -ForegroundColor Green
} catch {
    Write-Host "Could not create ZIP" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Portable package created successfully!" -ForegroundColor Green
Write-Host "📁 Location: $OutputDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Improvements:" -ForegroundColor Yellow
Write-Host "   - Custom Node.js server with proper MIME types"
Write-Host "   - Fixed ES module loading issues"
Write-Host "   - Enhanced error handling"
Write-Host "   - Automatic browser opening"

$choice = Read-Host "Open the package folder? (Y/n)"
if ($choice -ne "n" -and $choice -ne "N") {
    Invoke-Item $OutputDir
} 