import React from 'react';
import { Scan, X, Package, ShoppingCart, Edit, Plus, Minus } from 'lucide-react';

export type ScannerMode = 'sale' | 'inventory' | 'stock-adjustment' | 'quick-sale';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string, mode?: ScannerMode) => void;
  mode?: ScannerMode;
  title?: string;
  placeholder?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  isOpen, 
  onClose, 
  onScan,
  mode = 'sale',
  title,
  placeholder
}) => {
  const [scannedCode, setScannedCode] = React.useState('');
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanHistory, setScanHistory] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!isOpen) {
      setScannedCode('');
      setIsScanning(false);
      setScanHistory([]);
    }
  }, [isOpen]);

  // Enhanced keyboard input handler for barcode scanner
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    let rapidInputBuffer = '';
    let rapidInputTimeout: NodeJS.Timeout;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen || !isScanning) return;
      
      // Prevent default behavior for barcode scanner input
      if (event.target === document.body) {
        event.preventDefault();
      }
      
      // Clear existing timeout
      if (timeout) clearTimeout(timeout);
      
      // Handle rapid input (typical of barcode scanners)
      if (rapidInputTimeout) clearTimeout(rapidInputTimeout);
      
      if (event.key === 'Enter') {
        // Check if we have rapid input buffer first
        if (rapidInputBuffer.length >= 3) {
          processScannedCode(rapidInputBuffer);
          rapidInputBuffer = '';
        } else if (scannedCode.length >= 3) {
          processScannedCode(scannedCode);
        }
      } else if (event.key === 'Escape') {
        // Cancel scanning
        setIsScanning(false);
        setScannedCode('');
        rapidInputBuffer = '';
      } else if (event.key.length === 1 && /[A-Za-z0-9\-_\.]/.test(event.key)) {
        // Add character to rapid input buffer
        rapidInputBuffer += event.key;
        
        // Also update visible code
        setScannedCode(prev => prev + event.key);
        
        // Auto-submit for rapid input (barcode scanners type very fast)
        rapidInputTimeout = setTimeout(() => {
          if (rapidInputBuffer.length >= 3) {
            processScannedCode(rapidInputBuffer);
            rapidInputBuffer = '';
          }
        }, 100); // Very short timeout for rapid input
        
        // Fallback timeout for manual input
        timeout = setTimeout(() => {
          if (scannedCode.length >= 2) {
            processScannedCode(scannedCode + event.key);
          }
        }, 1000);
      }
    };

    if (isScanning) {
      document.addEventListener('keydown', handleKeyPress);
      // Focus on document body to capture all input
      document.body.focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      if (timeout) clearTimeout(timeout);
      if (rapidInputTimeout) clearTimeout(rapidInputTimeout);
    };
  }, [isOpen, isScanning, scannedCode]);

  const processScannedCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length >= 3) {
      // Add to scan history
      setScanHistory(prev => [cleanCode, ...prev.slice(0, 4)]); // Keep last 5 scans
      
      onScan(cleanCode, mode);
      setScannedCode('');
      setIsScanning(false);
    }
  };

  const handleManualSubmit = () => {
    processScannedCode(scannedCode);
  };

  const handleQuickRescan = (code: string) => {
    onScan(code, mode);
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'sale':
        return {
          icon: ShoppingCart,
          title: title || 'Scan Product for Sale',
          description: 'Scan barcode to add product to cart',
          color: 'blue'
        };
      case 'inventory':
        return {
          icon: Package,
          title: title || 'Scan Product for Inventory',
          description: 'Scan barcode to find and edit product',
          color: 'green'
        };
      case 'stock-adjustment':
        return {
          icon: Edit,
          title: title || 'Scan for Stock Adjustment',
          description: 'Scan barcode to adjust stock levels',
          color: 'orange'
        };
      case 'quick-sale':
        return {
          icon: Plus,
          title: title || 'Quick Sale Scanner',
          description: 'Rapid scanning for multiple items',
          color: 'purple'
        };
      default:
        return {
          icon: Scan,
          title: title || 'Scan Barcode',
          description: 'Point scanner at barcode',
          color: 'blue'
        };
    }
  };

  if (!isOpen) return null;

  const config = getModeConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`p-4 rounded-full bg-${config.color}-100`}>
              <IconComponent className={`h-12 w-12 text-${config.color}-600`} />
            </div>
          </div>
          
          <div>
            <p className="text-gray-600 mb-2">
              {isScanning ? 'Scanning... Point scanner at barcode' : 'Ready to scan'}
            </p>
            <p className="text-sm text-gray-500 mb-4">{config.description}</p>
            
            <div className="bg-gray-100 border rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-500 mb-1">Scanned Code:</p>
              <p className="font-mono text-lg font-semibold min-h-[28px]">
                {scannedCode || placeholder || 'No code scanned yet'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {!isScanning ? (
              <button
                onClick={() => setIsScanning(true)}
                className="btn btn-primary w-full flex items-center justify-center"
              >
                <Scan className="h-4 w-4 mr-2" />
                Start Scanning
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setIsScanning(false)}
                  className="btn btn-outline w-full"
                >
                  Stop Scanning
                </button>
                {scannedCode && (
                  <button
                    onClick={handleManualSubmit}
                    className="btn btn-success w-full"
                    disabled={scannedCode.length < 3}
                  >
                    Use This Code
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Recent Scans:</p>
              <div className="space-y-1">
                {scanHistory.map((code, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickRescan(code)}
                    className="w-full text-xs bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 font-mono text-left transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
            <p>• Point barcode scanner at any SKU/barcode</p>
            <p>• Code will be automatically detected</p>
            <p>• Manual entry: type and press Enter</p>
            <p>• Press Escape to cancel</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 