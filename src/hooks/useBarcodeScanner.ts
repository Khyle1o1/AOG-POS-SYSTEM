import React from 'react';

export interface BarcodeScannerConfig {
  enabled: boolean;
  rapidInputTimeout: number;
  fallbackTimeout: number;
  minCodeLength: number;
  allowedCharacters: RegExp;
  continuousMode: boolean;
  autoSubmit: boolean;
}

export interface BarcodeScannerHookResult {
  scannedCode: string;
  isScanning: boolean;
  scanHistory: string[];
  startScanning: () => void;
  stopScanning: () => void;
  clearCode: () => void;
  clearHistory: () => void;
  submitCode: () => void;
}

const defaultConfig: BarcodeScannerConfig = {
  enabled: true,
  rapidInputTimeout: 100,
  fallbackTimeout: 1000,
  minCodeLength: 3,
  allowedCharacters: /[A-Za-z0-9\-_\.]/,
  continuousMode: false,
  autoSubmit: true,
};

export const useBarcodeScanner = (
  onScan: (code: string) => void,
  config: Partial<BarcodeScannerConfig> = {}
): BarcodeScannerHookResult => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const [scannedCode, setScannedCode] = React.useState('');
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanHistory, setScanHistory] = React.useState<string[]>([]);
  
  const rapidInputBufferRef = React.useRef('');
  const rapidInputTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const processScannedCode = React.useCallback((code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length >= finalConfig.minCodeLength) {
      // Add to scan history
      setScanHistory(prev => {
        const newHistory = [cleanCode, ...prev.filter(c => c !== cleanCode)];
        return newHistory.slice(0, 10); // Keep last 10 scans
      });
      
      onScan(cleanCode);
      setScannedCode('');
      
      if (!finalConfig.continuousMode) {
        setIsScanning(false);
      }
    }
  }, [onScan, finalConfig.minCodeLength, finalConfig.continuousMode]);

  const clearTimeouts = React.useCallback(() => {
    if (rapidInputTimeoutRef.current) {
      clearTimeout(rapidInputTimeoutRef.current);
      rapidInputTimeoutRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []);

  // Enhanced keyboard event handler
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!finalConfig.enabled || !isScanning) return;
      
      // Prevent default behavior for barcode scanner input when focused on document body
      if (event.target === document.body) {
        event.preventDefault();
      }
      
      clearTimeouts();
      
      if (event.key === 'Enter') {
        // Check rapid input buffer first, then fallback to visible code
        if (rapidInputBufferRef.current.length >= finalConfig.minCodeLength) {
          processScannedCode(rapidInputBufferRef.current);
          rapidInputBufferRef.current = '';
        } else if (scannedCode.length >= finalConfig.minCodeLength) {
          processScannedCode(scannedCode);
        }
      } else if (event.key === 'Escape') {
        // Cancel scanning
        setIsScanning(false);
        setScannedCode('');
        rapidInputBufferRef.current = '';
      } else if (event.key.length === 1 && finalConfig.allowedCharacters.test(event.key)) {
        // Add character to rapid input buffer
        rapidInputBufferRef.current += event.key;
        
        // Update visible code
        setScannedCode(prev => prev + event.key);
        
        if (finalConfig.autoSubmit) {
          // Auto-submit for rapid input (typical of hardware barcode scanners)
          rapidInputTimeoutRef.current = setTimeout(() => {
            if (rapidInputBufferRef.current.length >= finalConfig.minCodeLength) {
              processScannedCode(rapidInputBufferRef.current);
              rapidInputBufferRef.current = '';
            }
          }, finalConfig.rapidInputTimeout);
          
          // Fallback timeout for manual input
          fallbackTimeoutRef.current = setTimeout(() => {
            if (scannedCode.length >= finalConfig.minCodeLength - 1) { // -1 because we're adding one more character
              processScannedCode(scannedCode + event.key);
            }
          }, finalConfig.fallbackTimeout);
        }
      }
    };

    if (isScanning) {
      document.addEventListener('keydown', handleKeyPress);
      // Focus on document body to capture all input
      document.body.focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeouts();
    };
  }, [isScanning, scannedCode, finalConfig, processScannedCode, clearTimeouts]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  const startScanning = React.useCallback(() => {
    setIsScanning(true);
    setScannedCode('');
    rapidInputBufferRef.current = '';
  }, []);

  const stopScanning = React.useCallback(() => {
    setIsScanning(false);
    setScannedCode('');
    rapidInputBufferRef.current = '';
    clearTimeouts();
  }, [clearTimeouts]);

  const clearCode = React.useCallback(() => {
    setScannedCode('');
    rapidInputBufferRef.current = '';
    clearTimeouts();
  }, [clearTimeouts]);

  const clearHistory = React.useCallback(() => {
    setScanHistory([]);
  }, []);

  const submitCode = React.useCallback(() => {
    if (scannedCode.length >= finalConfig.minCodeLength) {
      processScannedCode(scannedCode);
    }
  }, [scannedCode, finalConfig.minCodeLength, processScannedCode]);

  return {
    scannedCode,
    isScanning,
    scanHistory,
    startScanning,
    stopScanning,
    clearCode,
    clearHistory,
    submitCode,
  };
};

export default useBarcodeScanner; 