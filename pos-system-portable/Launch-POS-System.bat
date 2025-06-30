@echo off
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
node server.cjs
