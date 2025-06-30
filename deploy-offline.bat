@echo off
title POS System - Offline Deployment
color 0A

echo.
echo ========================================
echo   POS System - Offline Deployment
echo ========================================
echo.

echo [1/4] Checking system requirements...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please install npm (comes with Node.js)
    pause
    exit /b 1
)

echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo [3/4] Building production version...
call npm run build:prod
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo [4/4] Starting local server...
echo.
echo SUCCESS: POS System is ready!
echo.
echo Your POS System will open in your browser at:
echo http://localhost:3000
echo.
echo To stop the server, close this window or press Ctrl+C
echo.

timeout /t 3 /nobreak >nul
start http://localhost:3000

cd dist
call npx serve . -s -p 3000 --cors 