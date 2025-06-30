import React from 'react';
import { 
  Printer, 
  Bluetooth, 
  Search, 
  TestTube2,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { BluetoothPrinter } from '../../types';

const PrinterSettings: React.FC = () => {
  const {
    printerStatus,
    availablePrinters,
    connectedPrinter,
    settings,
    scanForPrinters,
    connectToPrinter,
    disconnectPrinter,
    testPrint,
    updatePrinterSettings
  } = useStore();

  const [isScanning, setIsScanning] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [bluetoothSupported, setBluetoothSupported] = React.useState(true);

  // Check Bluetooth support on mount
  React.useEffect(() => {
    setBluetoothSupported('bluetooth' in navigator);
  }, []);

  const handleScanForPrinters = async () => {
    setIsScanning(true);
    setScanError(null);
    
    try {
      await scanForPrinters();
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Failed to scan for printers');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectToPrinter = async (printer: BluetoothPrinter) => {
    setIsConnecting(true);
    
    try {
      await connectToPrinter(printer);
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to connect to printer. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPrinter();
    } catch (error) {
      console.error('Disconnect failed:', error);
      alert('Failed to disconnect printer.');
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    
    try {
      await testPrint();
      alert('Test print sent successfully!');
    } catch (error) {
      console.error('Test print failed:', error);
      alert('Test print failed. Please check your printer connection.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSettingChange = async (setting: string, value: any) => {
    try {
      await updatePrinterSettings({ [setting]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Failed to update printer setting.');
    }
  };

  if (!bluetoothSupported) {
    return (
      <div className="card">
        <div className="flex items-center mb-4">
          <Printer className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Printer Settings</h2>
        </div>
        
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Bluetooth Not Supported</h3>
          <p className="text-gray-600 mb-4">
            Your browser doesn't support Web Bluetooth API. Please use a modern browser like Chrome or Edge.
          </p>
          <p className="text-sm text-gray-500">
            Note: Bluetooth printing may require HTTPS for security reasons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center mb-4">
        <Printer className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Printer Settings</h2>
      </div>

      {/* Printer Status */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Printer Status</h3>
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          {printerStatus.connected ? (
            <div className="flex items-center text-green-600">
              <Wifi className="h-5 w-5 mr-2" />
              <span className="font-medium">Connected</span>
              {connectedPrinter && (
                <span className="ml-2 text-gray-600">({connectedPrinter.name})</span>
              )}
            </div>
          ) : (
            <div className="flex items-center text-gray-600">
              <WifiOff className="h-5 w-5 mr-2" />
              <span>Disconnected</span>
            </div>
          )}
          
          {printerStatus.printing && (
            <div className="ml-auto flex items-center text-blue-600">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              <span className="text-sm">Printing...</span>
            </div>
          )}
        </div>
        
        {printerStatus.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {printerStatus.error}
          </div>
        )}
      </div>

      {/* Scan for Printers */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Available Printers</h3>
          <button
            onClick={handleScanForPrinters}
            disabled={isScanning}
            className="btn btn-outline text-sm"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Scan for Printers
              </>
            )}
          </button>
        </div>

        {scanError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{scanError}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {availablePrinters.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Bluetooth className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No printers found</p>
              <p className="text-xs text-gray-400">Make sure your printer is on and in pairing mode</p>
            </div>
          ) : (
            availablePrinters.map((printer) => (
              <div
                key={printer.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <Printer className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{printer.name}</p>
                    <p className="text-sm text-gray-500">{printer.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {connectedPrinter?.id === printer.id ? (
                    <>
                      <span className="text-sm text-green-600 font-medium">Connected</span>
                      <button
                        onClick={handleDisconnect}
                        className="btn btn-outline text-sm"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnectToPrinter(printer)}
                      disabled={isConnecting}
                      className="btn btn-primary text-sm"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Printer Configuration */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Printer Configuration</h3>
        
        <div className="space-y-4">
          {/* Auto-print */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Auto-print receipts</label>
              <p className="text-sm text-gray-500">Automatically print receipt immediately after sale completion</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.printerSettings.autoPrintEnabled}
                onChange={(e) => handleSettingChange('autoPrintEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Paper width */}
          <div>
            <label className="block font-medium text-gray-900 mb-1">Paper Width</label>
            <select
              value={settings.printerSettings.paperWidth}
              onChange={(e) => handleSettingChange('paperWidth', parseInt(e.target.value))}
              className="input w-32"
            >
              <option value={58}>58mm</option>
              <option value={80}>80mm</option>
            </select>
          </div>

          {/* Cut type */}
          <div>
            <label className="block font-medium text-gray-900 mb-1">Paper Cut Type</label>
            <select
              value={settings.printerSettings.cutType}
              onChange={(e) => handleSettingChange('cutType', e.target.value)}
              className="input w-40"
            >
              <option value="partial">Partial Cut</option>
              <option value="full">Full Cut</option>
              <option value="none">No Cut</option>
            </select>
          </div>

          {/* Cash drawer */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Cash drawer control</label>
              <p className="text-sm text-gray-500">Open cash drawer when printing receipts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.printerSettings.cashdrawerEnabled}
                onChange={(e) => handleSettingChange('cashdrawerEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Test Print */}
      {printerStatus.connected && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={handleTestPrint}
            disabled={isTesting || printerStatus.printing}
            className="btn btn-outline w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Printing Test Receipt...
              </>
            ) : (
              <>
                <TestTube2 className="h-4 w-4 mr-2" />
                Print Test Receipt
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PrinterSettings; 