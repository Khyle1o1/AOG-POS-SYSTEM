import { useEffect, useState } from 'react';

/**
 * Hook to detect if the app is running in Electron
 */
export const useIsElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
};

/**
 * Hook to get the app version from Electron
 */
export const useAppVersion = () => {
  const [version, setVersion] = useState<string>('1.0.0');
  const isElectron = useIsElectron();

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.getVersion().then(setVersion).catch(console.error);
    }
  }, [isElectron]);

  return version;
};

/**
 * Hook to handle Electron menu actions
 */
export const useElectronMenu = (
  onNewTransaction?: () => void,
  onPrintReceipt?: () => void
) => {
  const isElectron = useIsElectron();

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    const handleNewTransaction = () => {
      onNewTransaction?.();
    };

    const handlePrintReceipt = () => {
      onPrintReceipt?.();
    };

    // Set up listeners for menu actions
    const cleanup: (() => void)[] = [];

    if (onNewTransaction) {
      window.electronAPI.onMenuAction(handleNewTransaction);
      cleanup.push(() => window.electronAPI.removeAllListeners('menu-new-transaction'));
    }

    if (onPrintReceipt) {
      window.electronAPI.onMenuAction(handlePrintReceipt);
      cleanup.push(() => window.electronAPI.removeAllListeners('menu-print-receipt'));
    }

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [isElectron, onNewTransaction, onPrintReceipt]);
};

/**
 * Hook to provide Electron-specific file operations
 */
export const useElectronFileOps = () => {
  const isElectron = useIsElectron();

  const showSaveDialog = async (options: any) => {
    if (!isElectron || !window.electronAPI) {
      throw new Error('File operations not available in web mode');
    }
    return window.electronAPI.showSaveDialog(options);
  };

  const showOpenDialog = async (options: any) => {
    if (!isElectron || !window.electronAPI) {
      throw new Error('File operations not available in web mode');
    }
    return window.electronAPI.showOpenDialog(options);
  };

  const print = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.print();
    } else {
      window.print();
    }
  };

  const showNotification = (title: string, body: string) => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.showNotification(title, body);
    } else {
      // Fallback to web notifications
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, { body });
            }
          });
        }
      }
    }
  };

  return {
    isElectron,
    showSaveDialog: isElectron ? showSaveDialog : undefined,
    showOpenDialog: isElectron ? showOpenDialog : undefined,
    print,
    showNotification,
  };
};

/**
 * Hook to get platform information
 */
export const usePlatform = () => {
  const isElectron = useIsElectron();
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      setPlatform(window.electronAPI.platform);
    } else {
      setPlatform(navigator.platform);
    }
  }, [isElectron]);

  return {
    platform,
    isElectron,
    isWindows: platform.toLowerCase().includes('win'),
    isMac: platform.toLowerCase().includes('mac'),
    isLinux: platform.toLowerCase().includes('linux'),
  };
}; 