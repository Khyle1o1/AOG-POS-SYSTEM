const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Conditional import of auto-updater to prevent startup failures
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (error) {
  console.log('Auto-updater not available:', error.message);
  autoUpdater = null;
}

// Keep a global reference of the window object
let mainWindow;

const isDev = process.env.NODE_ENV === 'development';
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

function createWindow() {
  console.log('Creating window...');
  console.log('isDev:', isDev);
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('app.getAppPath():', app.getAppPath());

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: !isDev,
    },
    show: false, // Don't show until ready
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
  });

  // Load the app
  if (isDev) {
    console.log('Loading development URL...');
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading production files...');
    
    // Try multiple possible paths for the index.html file
    const possiblePaths = [
      path.join(__dirname, '..', 'dist', 'index.html'),
      path.join(app.getAppPath(), 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'dist', 'index.html'),
      path.join(__dirname, 'dist', 'index.html')
    ];

    let indexPath = null;
    for (const testPath of possiblePaths) {
      console.log('Testing path:', testPath);
      console.log('Exists:', fs.existsSync(testPath));
      if (fs.existsSync(testPath)) {
        indexPath = testPath;
        console.log('Found index.html at:', indexPath);
        break;
      }
    }

    if (indexPath) {
      console.log('Loading file:', indexPath);
      mainWindow.loadFile(indexPath).catch(err => {
        console.error('Failed to load file:', err);
        // Load a basic HTML page as fallback
        mainWindow.loadURL('data:text/html,<h1>POS System</h1><p>Error loading application. Check console for details.</p>');
      });
    } else {
      console.error('No index.html found in any of the expected locations');
      // Load a basic HTML page as fallback
      mainWindow.loadURL('data:text/html,<h1>POS System</h1><p>Application files not found. Please reinstall the application.</p>');
    }

    // DevTools are not opened in production for a clean user experience
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external websites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    console.log('Navigation attempt to:', navigationUrl);
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5173' && !isDev) {
      event.preventDefault();
    }
  });

  // Add error handling for page load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Page failed to load:', errorCode, errorDescription, validatedURL);
  });

  // Add console message logging
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer console:', level, message);
  });

  // Add more debugging events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
    // Show the window once the page is fully loaded
    mainWindow.show();
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready');
  });
}

// App event listeners
app.whenReady().then(() => {
  createWindow();
  createMenu();
  
  // Auto updater (production only)
  if (!isDev && autoUpdater) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS keep app running even when all windows are closed
  if (!isMac) {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Transaction',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-transaction');
          }
        },
        { type: 'separator' },
        {
          label: 'Print Receipt',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu-print-receipt');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: isMac ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About POS System',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About POS System',
              message: 'Point of Sale Management System v1.0.0',
              detail: 'Point of Sale Management System v1.0.0 by AOG Tech is a retail-focused solution designed to simplify and automate sales, inventory, and customer transactions. Built for small to medium-sized retail businesses, it offers key features such as product catalog management, stock monitoring, sales tracking, and receipt generation. Version 1.0.0 delivers a stable and easy-to-use platform to help streamline retail operations and improve efficiency at the checkout counter.'
            });
          }
        }
      ]
    }
  ];

  // macOS menu adjustments
  if (isMac) {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Auto updater events (only if available)
if (autoUpdater) {
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available.');
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.');
  });

  autoUpdater.on('error', (err) => {
    console.log('Error in auto-updater. ' + err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    autoUpdater.quitAndInstall();
  });
} 