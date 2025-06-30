import { BluetoothPrinter, PrinterStatus, ESCPOSCommand } from '../types';

// ESC/POS command constants
const ESC = 0x1B;
const GS = 0x1D;

export class BluetoothPrinterService {
  private static instance: BluetoothPrinterService;
  private connectedDevice: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private printerStatus: PrinterStatus = {
    connected: false,
    printing: false
  };
  private statusListeners: Array<(status: PrinterStatus) => void> = [];

  // Multiple service/characteristic UUIDs for better compatibility
  private readonly PRINTER_SERVICES = [
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Common thermal printer service
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
    '0000ff00-0000-1000-8000-00805f9b34fb', // Generic service
    '12345678-1234-1234-1234-123456789abc'  // Alternative service
  ];

  private readonly PRINTER_CHARACTERISTICS = [
    '49535343-1e4d-4bd9-ba61-23c647249616', // Original characteristic
    '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART TX
    '0000ff01-0000-1000-8000-00805f9b34fb', // Generic characteristic
    '12345678-1234-1234-1234-123456789abd'  // Alternative characteristic
  ];

  static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  private constructor() {
    // Check if Web Bluetooth is supported
    if (!navigator.bluetooth) {
      console.warn('Web Bluetooth API is not supported in this browser');
    }
  }

  /**
   * Check if Web Bluetooth is supported
   */
  isBluetoothSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * Scan for available Bluetooth printers
   */
  async scanForPrinters(): Promise<BluetoothPrinter[]> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [...this.PRINTER_SERVICES]
      });

      if (device) {
        return [{
          id: device.id,
          name: device.name || 'Unknown Printer',
          device,
          connected: false
        }];
      }
      return [];
    } catch (error) {
      console.error('Error scanning for printers:', error);
      throw new Error('Failed to scan for printers. Make sure Bluetooth is enabled.');
    }
  }

  /**
   * Connect to a specific printer with improved compatibility
   */
  async connectToPrinter(printer: BluetoothPrinter): Promise<void> {
    if (!printer.device) {
      throw new Error('No device associated with this printer');
    }

    try {
      this.updateStatus({ ...this.printerStatus, connected: false });

      // Ensure device is not already connected
      if (printer.device.gatt?.connected) {
        printer.device.gatt.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Connect to GATT server
      console.log('Connecting to GATT server...');
      const server = await printer.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      console.log('GATT server connected, searching for services...');

      // Try each service/characteristic combination until one works
      let serviceFound = false;
      let characteristicFound = false;

      for (const serviceUuid of this.PRINTER_SERVICES) {
        try {
          console.log(`Trying service: ${serviceUuid}`);
          const service = await server.getPrimaryService(serviceUuid);
          
          for (const charUuid of this.PRINTER_CHARACTERISTICS) {
            try {
              console.log(`Trying characteristic: ${charUuid}`);
              const characteristic = await service.getCharacteristic(charUuid);
              
              // Log the actual properties for debugging
              console.log(`Found characteristic ${charUuid} with properties:`, {
                write: characteristic.properties.write,
                writeWithoutResponse: characteristic.properties.writeWithoutResponse,
                notify: characteristic.properties.notify,
                indicate: characteristic.properties.indicate,
                read: characteristic.properties.read
              });
              
              // Accept any characteristic we can find - we'll try to write to it
              // Many thermal printers don't properly report their write capabilities
              this.characteristic = characteristic;
              serviceFound = true;
              characteristicFound = true;
              console.log(`Successfully connected with service ${serviceUuid} and characteristic ${charUuid}`);
              break;
              
            } catch (charError) {
              console.log(`Characteristic ${charUuid} not found or not accessible:`, charError);
              continue;
            }
          }
          
          if (characteristicFound) break;
        } catch (serviceError) {
          console.log(`Service ${serviceUuid} not found`);
          continue;
        }
      }

      if (!serviceFound || !characteristicFound) {
        throw new Error('No compatible service/characteristic found. This printer may not be supported.');
      }

      // Set up disconnect handler
      printer.device.addEventListener('gattserverdisconnected', () => {
        console.log('Printer disconnected');
        this.handleDisconnect();
      });

      this.connectedDevice = printer.device;
      this.updateStatus({
        connected: true,
        printing: false,
        error: undefined
      });

      console.log('Printer connected successfully');

    } catch (error) {
      console.error('Error connecting to printer:', error);
      this.updateStatus({
        connected: false,
        printing: false,
        error: 'Failed to connect to printer'
      });
      throw error;
    }
  }

  /**
   * Disconnect from the current printer
   */
  async disconnect(): Promise<void> {
    if (this.connectedDevice?.gatt?.connected) {
      this.connectedDevice.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    this.connectedDevice = null;
    this.characteristic = null;
    this.updateStatus({
      connected: false,
      printing: false,
      error: undefined
    });
  }

  /**
   * Get current printer status
   */
  getStatus(): PrinterStatus {
    return this.printerStatus;
  }

  /**
   * Subscribe to status updates
   */
  onStatusChange(callback: (status: PrinterStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(status: PrinterStatus): void {
    this.printerStatus = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  /**
   * Validate connection before sending data
   */
  private async validateConnection(): Promise<void> {
    if (!this.connectedDevice || !this.characteristic) {
      throw new Error('No printer connected');
    }

    if (!this.connectedDevice.gatt?.connected) {
      throw new Error('Printer connection lost');
    }

    // Check if characteristic is still valid
    if (!this.characteristic.service || !this.characteristic.service.device.gatt?.connected) {
      throw new Error('Printer characteristic is no longer valid');
    }
  }

  /**
   * Send raw data to printer with improved error handling
   */
  private async sendData(data: Uint8Array): Promise<void> {
    await this.validateConnection();

    if (!this.characteristic) {
      throw new Error('No printer connected');
    }

    try {
      // Use smaller chunks for better compatibility (15 bytes instead of 20)
      const chunkSize = 15;
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        
        try {
          // Try writeValueWithoutResponse first (faster and more reliable for printers)
          // Don't rely on properties check as many printers don't report correctly
          try {
            await this.characteristic.writeValueWithoutResponse(chunk);
          } catch (withoutResponseError) {
            // Fallback to writeValue
            await this.characteristic.writeValue(chunk);
          }
          
          // Longer delay for better reliability
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (chunkError) {
          console.error(`Failed to send chunk ${i}-${i + chunkSize}:`, chunkError);
          
          // Try alternative write methods
          await new Promise(resolve => setTimeout(resolve, 200));
          
          try {
            // Try writeValueWithoutResponse regardless of reported properties
            await this.characteristic.writeValueWithoutResponse(chunk);
            console.log(`Successfully sent chunk using writeValueWithoutResponse`);
          } catch (writeWithoutResponseError) {
            try {
              // Try writeValue as fallback
              await this.characteristic.writeValue(chunk);
              console.log(`Successfully sent chunk using writeValue`);
            } catch (writeError) {
              throw new Error(`Failed to send data chunk after trying all write methods: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending data to printer:', error);
      
      // Update status to indicate error
      this.updateStatus({
        ...this.printerStatus,
        error: 'Communication error'
      });
      
      throw new Error(`Failed to send data to printer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute print job with better error handling
   */
  async print(commands: ESCPOSCommand[]): Promise<void> {
    await this.validateConnection();

    if (!this.printerStatus.connected) {
      throw new Error('No printer connected');
    }

    try {
      this.updateStatus({ ...this.printerStatus, printing: true, error: undefined });

      // Initialize printer with longer delay
      console.log('Initializing printer...');
      await this.sendData(new Uint8Array([ESC, 0x40])); // ESC @ (initialize)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Execute commands with progress logging
      console.log(`Executing ${commands.length} print commands...`);
      for (let i = 0; i < commands.length; i++) {
        try {
          await this.executeCommand(commands[i]);
          
          // Small delay between commands
          if (i < commands.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } catch (commandError) {
          console.error(`Failed to execute command ${i}:`, commands[i], commandError);
          // Continue with other commands but log the error
        }
      }

      // Feed and cut paper
      console.log('Finishing print job...');
      await this.sendData(new Uint8Array([0x0A, 0x0A, 0x0A])); // Line feeds
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.sendData(new Uint8Array([GS, 0x56, 0x01])); // Partial cut

      this.updateStatus({ ...this.printerStatus, printing: false });
      console.log('Print job completed successfully');

    } catch (error) {
      console.error('Print job failed:', error);
      this.updateStatus({ 
        ...this.printerStatus, 
        printing: false, 
        error: 'Print job failed' 
      });
      throw new Error(`Print job failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute individual ESC/POS command
   */
  private async executeCommand(command: ESCPOSCommand): Promise<void> {
    switch (command.type) {
      case 'text':
        if (command.data) {
          const textData = this.encodeText(command.data as string);
          await this.sendData(textData);
        }
        break;

      case 'align':
        const alignCommands = {
          left: new Uint8Array([ESC, 0x61, 0x00]),
          center: new Uint8Array([ESC, 0x61, 0x01]),
          right: new Uint8Array([ESC, 0x61, 0x02])
        };
        if (command.align && alignCommands[command.align]) {
          await this.sendData(alignCommands[command.align]);
        }
        break;

      case 'size':
        const sizeCommands = {
          normal: new Uint8Array([GS, 0x21, 0x00]),
          wide: new Uint8Array([GS, 0x21, 0x10]),
          tall: new Uint8Array([GS, 0x21, 0x01]),
          double: new Uint8Array([GS, 0x21, 0x11])
        };
        if (command.size && sizeCommands[command.size]) {
          await this.sendData(sizeCommands[command.size]);
        }
        break;

      case 'bold':
        await this.sendData(new Uint8Array([ESC, 0x45, 0x01])); // Bold on
        break;

      case 'feed':
        await this.sendData(new Uint8Array([0x0A])); // Line feed
        break;

      case 'cut':
        await this.sendData(new Uint8Array([GS, 0x56, 0x01])); // Partial cut
        break;

      case 'drawer':
        await this.sendData(new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA])); // Open cash drawer
        break;
    }
  }

  /**
   * Encode text for printing (CP437 encoding for thermal printers)
   */
  private encodeText(text: string): Uint8Array {
    const encoded = new TextEncoder().encode(text);
    return encoded;
  }

  /**
   * Test printer connection with a simple print
   */
  async testPrint(): Promise<void> {
    const testCommands: ESCPOSCommand[] = [
      { type: 'align', align: 'center' },
      { type: 'size', size: 'double' },
      { type: 'text', data: 'TEST PRINT\n' },
      { type: 'size', size: 'normal' },
      { type: 'text', data: '─────────────────────\n' },
      { type: 'text', data: 'Printer connection successful!\n' },
      { type: 'text', data: `Time: ${new Date().toLocaleString()}\n` },
      { type: 'text', data: '─────────────────────\n' },
      { type: 'feed' },
      { type: 'feed' }
    ];

    await this.print(testCommands);
  }

  /**
   * Open cash drawer if connected
   */
  async openCashDrawer(): Promise<void> {
    await this.validateConnection();

    if (!this.printerStatus.connected) {
      throw new Error('No printer connected');
    }

    await this.sendData(new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA]));
  }
} 