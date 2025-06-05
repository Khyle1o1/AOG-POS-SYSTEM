import React from 'react';
import { Scan, X } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [scannedCode, setScannedCode] = React.useState('');
  const [isScanning, setIsScanning] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setScannedCode('');
      setIsScanning(false);
    }
  }, [isOpen]);

  // Handle keyboard input for barcode scanner
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen || !isScanning) return;
      
      // Clear existing timeout
      if (timeout) clearTimeout(timeout);
      
      if (event.key === 'Enter') {
        // Submit the scanned code
        if (scannedCode.length >= 3) { // Minimum SKU length
          onScan(scannedCode);
          setScannedCode('');
          setIsScanning(false);
        }
      } else if (event.key.length === 1 && /[A-Za-z0-9\-_]/.test(event.key)) {
        // Add alphanumeric character to scanned code
        setScannedCode(prev => prev + event.key);
        
        // Auto-submit after 500ms of no input (typical for barcode scanners)
        timeout = setTimeout(() => {
          if (scannedCode.length >= 2) { // Will be +1 after this keypress
            onScan(scannedCode + event.key);
            setScannedCode('');
            setIsScanning(false);
          }
        }, 500);
      }
    };

    if (isScanning) {
      document.addEventListener('keydown', handleKeyPress);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      if (timeout) clearTimeout(timeout);
    };
  }, [isOpen, isScanning, scannedCode, onScan]);

  const handleManualSubmit = () => {
    if (scannedCode.length >= 3) {
      onScan(scannedCode);
      setScannedCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scan Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Scan className="h-16 w-16 text-blue-600" />
          </div>
          
          <div>
            <p className="text-gray-600 mb-2">
              {isScanning ? 'Scanning... Point scanner at barcode' : 'Ready to scan'}
            </p>
            
            <div className="bg-gray-100 border rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-500 mb-1">Scanned Code:</p>
              <p className="font-mono text-lg font-semibold">
                {scannedCode || 'No code scanned yet'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {!isScanning ? (
              <button
                onClick={() => setIsScanning(true)}
                className="btn btn-primary w-full"
              >
                <Scan className="h-4 w-4 mr-2" />
                Start Scanning
              </button>
            ) : (
              <button
                onClick={() => setIsScanning(false)}
                className="btn btn-outline w-full"
              >
                Stop Scanning
              </button>
            )}

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

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Point barcode scanner at any SKU/barcode</p>
            <p>• Code will be automatically detected</p>
            <p>• Manual entry: type alphanumeric characters and press Enter</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 