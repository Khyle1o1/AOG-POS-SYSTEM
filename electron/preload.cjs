const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),

  // File system operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // Menu events
  onMenuAction: (callback) => {
    // Listen for menu actions
    ipcRenderer.on('menu-new-transaction', callback);
    ipcRenderer.on('menu-print-receipt', callback);
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Platform info
  platform: process.platform,
  isElectron: true,

  // Print functionality
  print: () => {
    window.print();
  },

  // Notification support
  showNotification: (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  },

  // License management
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),

  // IPC communication for license scheduler
  sendToMain: (channel, data) => {
    // Only allow specific channels for security
    const allowedChannels = [
      'monthly-license-check-success',
      'monthly-license-check-failed',
      'license-scheduler-status'
    ];
    
    if (allowedChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn('Attempted to send on disallowed channel:', channel);
    }
  }
});

// Expose a limited set of node.js functionality
contextBridge.exposeInMainWorld('nodeAPI', {
  // Path utilities
  path: {
    join: (...args) => require('path').join(...args),
    dirname: (path) => require('path').dirname(path),
    basename: (path) => require('path').basename(path),
    extname: (path) => require('path').extname(path)
  },

  // Operating system info
  os: {
    platform: () => require('os').platform(),
    release: () => require('os').release(),
    type: () => require('os').type()
  }
}); 