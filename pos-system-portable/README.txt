POS System - Portable Package

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

Package created: 06/30/2025 16:42:11
