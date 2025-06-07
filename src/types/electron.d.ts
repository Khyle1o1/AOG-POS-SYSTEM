// Electron API types
export interface ElectronAPI {
  // App info
  getVersion: () => Promise<string>;

  // File system operations
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;

  // Menu events
  onMenuAction: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;

  // Platform info
  platform: string;
  isElectron: boolean;

  // Print functionality
  print: () => void;

  // Notification support
  showNotification: (title: string, body: string) => void;

  // License management
  getMachineId: () => Promise<string>;

  // IPC communication for license scheduler
  sendToMain: (channel: string, data: any) => void;
}

export interface NodeAPI {
  // Path utilities
  path: {
    join: (...args: string[]) => string;
    dirname: (path: string) => string;
    basename: (path: string) => string;
    extname: (path: string) => string;
  };

  // Operating system info
  os: {
    platform: () => string;
    release: () => string;
    type: () => string;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    nodeAPI: NodeAPI;
  }
}

export {}; 