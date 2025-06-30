#!/usr/bin/env pwsh

# POS System - Enhanced Offline Deployment Script
# Version: 2.0
# This script provides a complete offline deployment solution

param(
    [switch]$AutoStart,
    [switch]$NoInteraction,
    [string]$Port = "3000"
)

# Set console colors and title
$Host.UI.RawUI.WindowTitle = "POS System - Offline Deployment"

function Write-ColorText($Text, $Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

function Write-Step($Step, $Total, $Message) {
    Write-ColorText "[Step $Step/$Total] $Message" "Cyan"
}

function Write-Success($Message) {
    Write-ColorText "✓ $Message" "Green"
}

function Write-Error($Message) {
    Write-ColorText "✗ $Message" "Red"
}

function Write-Warning($Message) {
    Write-ColorText "⚠ $Message" "Yellow"
}

# Main deployment function
function Start-Deployment {
    Clear-Host
    Write-ColorText @"
╔══════════════════════════════════════════════════════════════╗
║                POS System - Offline Deployment               ║
║                        Version 2.0                          ║
╚══════════════════════════════════════════════════════════════╝
"@ "Green"

    Write-Host ""
    
    # Step 1: Check system requirements
    Write-Step 1 6 "Checking system requirements..."
    
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed!"
        Write-Warning "Please install Node.js from: https://nodejs.org/"
        if (!$NoInteraction) { Read-Host "Press Enter to exit" }
        exit 1
    }
    
    if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed!"
        Write-Warning "npm should come with Node.js installation"
        if (!$NoInteraction) { Read-Host "Press Enter to exit" }
        exit 1
    }
    
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Success "Node.js $nodeVersion and npm $npmVersion detected"
    
    # Step 2: Check if already built
    Write-Step 2 6 "Checking for existing build..."
    
    $distExists = Test-Path "dist"
    if ($distExists) {
        Write-Warning "Previous build found in 'dist' folder"
        if (!$NoInteraction) {
            $rebuild = Read-Host "Do you want to rebuild? (y/N)"
            if ($rebuild -eq "y" -or $rebuild -eq "Y") {
                $distExists = $false
            }
        }
    }
    
    if (!$distExists) {
        # Step 3: Install dependencies
        Write-Step 3 6 "Installing dependencies..."
        
        try {
            npm install --silent
            Write-Success "Dependencies installed successfully"
        }
        catch {
            Write-Error "Failed to install dependencies: $_"
            if (!$NoInteraction) { Read-Host "Press Enter to exit" }
            exit 1
        }
        
        # Step 4: Clean previous build
        Write-Step 4 6 "Cleaning previous build..."
        
        if (Test-Path "dist") {
            Remove-Item "dist" -Recurse -Force
        }
        Write-Success "Build directory cleaned"
        
        # Step 5: Build production version
        Write-Step 5 6 "Building production version..."
        
        try {
            npm run build:prod --silent
            Write-Success "Production build completed successfully"
        }
        catch {
            Write-Error "Build failed: $_"
            if (!$NoInteraction) { Read-Host "Press Enter to exit" }
            exit 1
        }
    } else {
        Write-Success "Using existing build"
    }
    
    # Step 6: Create portable package
    Write-Step 6 6 "Creating portable deployment package..."
    
    # Create a simple startup script in the dist folder
    $startupScript = @"
@echo off
title POS System - Local Server
echo Starting POS System...
echo.
echo Your POS System is running at: http://localhost:$Port
echo.
echo To stop the server, close this window
echo.
start http://localhost:$Port
npx serve . -s -p $Port
"@
    
    $startupScript | Out-File -FilePath "dist\start-pos-system.bat" -Encoding ascii
    
    # Create a README for the portable package
    $readme = @"
# POS System - Portable Package

## Quick Start
1. Double-click 'start-pos-system.bat' to start the server
2. Your browser will automatically open to http://localhost:$Port
3. Close the command window to stop the server

## Requirements
- This package requires Node.js to be installed on the target computer
- No internet connection required after initial setup

## Files
- start-pos-system.bat: Startup script
- All other files: POS System application files

## Support
If you need help, refer to the main project documentation.
"@
    
    $readme | Out-File -FilePath "dist\README.txt" -Encoding utf8
    
    Write-Success "Portable package created in 'dist' folder"
    
    Write-Host ""
    Write-ColorText "🎉 Deployment completed successfully!" "Green"
    Write-Host ""
    
    if (!$NoInteraction) {
        Write-ColorText "What would you like to do now?" "Yellow"
        Write-Host "1. Start the POS System locally (recommended)"
        Write-Host "2. Open the dist folder"
        Write-Host "3. Create a ZIP package for distribution"
        Write-Host "4. Exit"
        Write-Host ""
        
        $choice = Read-Host "Enter your choice (1-4)"
        
        switch ($choice) {
            "1" {
                Start-LocalServer
            }
            "2" {
                Invoke-Item ".\dist"
                Write-Success "Opened dist folder"
            }
            "3" {
                Create-ZipPackage
            }
            "4" {
                Write-ColorText "Thank you for using POS System!" "Green"
                exit 0
            }
            default {
                Write-Warning "Invalid choice. Starting local server..."
                Start-LocalServer
            }
        }
    } elseif ($AutoStart) {
        Start-LocalServer
    }
}

function Start-LocalServer {
    Write-Host ""
    Write-ColorText "🚀 Starting POS System..." "Green"
    Write-ColorText "➤ Server URL: http://localhost:$Port" "Cyan"
    Write-ColorText "➤ Press Ctrl+C to stop the server" "Yellow"
    Write-Host ""
    
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$Port"
    
    Set-Location "dist"
    npx serve . -s -p $Port --cors
}

function Create-ZipPackage {
    Write-Host ""
    Write-ColorText "📦 Creating distribution package..." "Green"
    
    try {
        npm run package:zip
        Write-Success "ZIP package created: pos-system-v1.0.0.zip"
        
        $zipPath = Resolve-Path "pos-system-v1.0.0.zip"
        Write-ColorText "Package location: $zipPath" "Cyan"
        
        $openFolder = Read-Host "Open folder containing the ZIP file? (Y/n)"
        if ($openFolder -ne "n" -and $openFolder -ne "N") {
            Invoke-Item (Split-Path $zipPath)
        }
    }
    catch {
        Write-Error "Failed to create ZIP package: $_"
    }
}

# Error handling
$ErrorActionPreference = "Stop"
trap {
    Write-Error "An unexpected error occurred: $_"
    if (!$NoInteraction) { Read-Host "Press Enter to exit" }
    exit 1
}

# Start the deployment process
Start-Deployment 