#!/usr/bin/env pwsh

# POS System Deployment Script for Windows
# This script builds and deploys your React POS system

Write-Host "Starting POS System Deployment..." -ForegroundColor Green

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies." -ForegroundColor Red
    exit 1
}

Write-Host "Cleaning previous build..." -ForegroundColor Yellow
npm run clean

Write-Host "Building production version..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "Files are ready in the 'dist' folder" -ForegroundColor Cyan

# Ask user what they want to do next
Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "1. Serve locally (test the production build)"
Write-Host "2. Package for distribution (creates a ZIP file)"
Write-Host "3. Open dist folder"
Write-Host "4. Exit"

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "Starting local server..." -ForegroundColor Green
        Write-Host "Your app will be available at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        npm run serve:dist
    }
    "2" {
        Write-Host "Creating distribution package..." -ForegroundColor Green
        npm run package:zip
        Write-Host "Package created: pos-system-v1.0.0.zip" -ForegroundColor Green
    }
    "3" {
        Write-Host "Opening dist folder..." -ForegroundColor Green
        Invoke-Item ".\dist"
    }
    "4" {
        Write-Host "Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Deployment completed!" -ForegroundColor Green 