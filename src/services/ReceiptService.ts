import { ReceiptData, ESCPOSCommand, PrinterSettings, Transaction } from '../types';
import { formatCurrency } from '../utils/currency';

export class ReceiptService {
  /**
   * Generate ESC/POS commands for a receipt
   */
  static generateReceiptCommands(
    receiptData: ReceiptData, 
    printerSettings: PrinterSettings
  ): ESCPOSCommand[] {
    const commands: ESCPOSCommand[] = [];
    const { transaction, storeName, storeAddress, storePhone, cashierName, printTime } = receiptData;
    const paperWidth = printerSettings.paperWidth;
    const lineLength = paperWidth === 58 ? 32 : 48; // Characters per line

    // Reset printer
    commands.push({ type: 'align', align: 'left' });
    commands.push({ type: 'size', size: 'normal' });

    // Store Header
    commands.push({ type: 'align', align: 'center' });
    commands.push({ type: 'size', size: 'wide' });
    commands.push({ type: 'bold' });
    commands.push({ type: 'text', data: `${storeName}\n` });
    commands.push({ type: 'size', size: 'normal' });

    if (storeAddress) {
      commands.push({ type: 'text', data: `${storeAddress}\n` });
    }
    if (storePhone) {
      commands.push({ type: 'text', data: `Tel: ${storePhone}\n` });
    }

    // Separator
    commands.push({ type: 'text', data: this.createLine('-', lineLength) });

    // Receipt Info
    commands.push({ type: 'align', align: 'left' });
    commands.push({ type: 'text', data: `Receipt #: ${transaction.transactionNumber}\n` });
    commands.push({ type: 'text', data: `Date: ${printTime.toLocaleDateString()}\n` });
    commands.push({ type: 'text', data: `Time: ${printTime.toLocaleTimeString()}\n` });
    commands.push({ type: 'text', data: `Cashier: ${cashierName}\n` });

    // Separator
    commands.push({ type: 'text', data: this.createLine('-', lineLength) });

    // Items Header
    commands.push({ type: 'text', data: 'ITEMS:\n' });
    commands.push({ type: 'text', data: this.createLine('-', lineLength) });

    // Items
    transaction.items.forEach(item => {
      const product = item.product;
      if (!product) return;

      // Product name
      commands.push({ type: 'text', data: `${product.name}\n` });
      
      // Quantity x Price = Total
      const qtyPriceTotal = `${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalPrice)}`;
      commands.push({ type: 'text', data: `  ${qtyPriceTotal}\n` });

      // Discount if applicable
      if (item.discount && item.discount > 0) {
        commands.push({ type: 'text', data: `  Discount: -${formatCurrency(item.discount)}\n` });
      }
    });

    // Separator
    commands.push({ type: 'text', data: this.createLine('-', lineLength) });

    // Totals
    commands.push({ type: 'text', data: this.formatLineWithTotal('Subtotal:', transaction.subtotal, lineLength) });
    
    if (transaction.discount > 0) {
      commands.push({ type: 'text', data: this.formatLineWithTotal('Discount:', -transaction.discount, lineLength) });
    }
    
    if (transaction.tax > 0) {
      commands.push({ type: 'text', data: this.formatLineWithTotal('Tax:', transaction.tax, lineLength) });
    }

    // Total (Bold)
    commands.push({ type: 'text', data: this.createLine('=', lineLength) });
    commands.push({ type: 'bold' });
    commands.push({ type: 'size', size: 'wide' });
    commands.push({ type: 'text', data: this.formatLineWithTotal('TOTAL:', transaction.total, lineLength) });
    commands.push({ type: 'size', size: 'normal' });

    // Payment Info
    commands.push({ type: 'text', data: this.createLine('-', lineLength) });
    commands.push({ type: 'text', data: this.formatLineWithTotal('Payment:', transaction.paymentAmount, lineLength) });
    commands.push({ type: 'text', data: this.formatLineWithTotal('Change:', transaction.changeAmount, lineLength) });

    // Footer
    commands.push({ type: 'text', data: this.createLine('-', lineLength) });
    commands.push({ type: 'align', align: 'center' });
    commands.push({ type: 'text', data: '\nThank you for your purchase!\n' });
    commands.push({ type: 'text', data: 'Please come again!\n\n' });

    // QR Code or additional info could go here
    commands.push({ type: 'text', data: `Transaction ID: ${transaction.id}\n` });
    commands.push({ type: 'text', data: `${new Date().toISOString()}\n` });

    // Extra feeds before cut
    commands.push({ type: 'feed' });
    commands.push({ type: 'feed' });

    return commands;
  }

  /**
   * Generate test receipt commands
   */
  static generateTestReceiptCommands(
    storeName: string,
    printerSettings: PrinterSettings
  ): ESCPOSCommand[] {
    const commands: ESCPOSCommand[] = [];
    const paperWidth = printerSettings.paperWidth;
    const lineLength = paperWidth === 58 ? 32 : 48;

    // Header
    commands.push({ type: 'align', align: 'center' });
    commands.push({ type: 'size', size: 'double' });
    commands.push({ type: 'bold' });
    commands.push({ type: 'text', data: 'TEST RECEIPT\n' });
    
    commands.push({ type: 'size', size: 'normal' });
    commands.push({ type: 'text', data: `${storeName}\n` });
    
    commands.push({ type: 'text', data: this.createLine('=', lineLength) });

    // Test content
    commands.push({ type: 'align', align: 'left' });
    commands.push({ type: 'text', data: `Date: ${new Date().toLocaleDateString()}\n` });
    commands.push({ type: 'text', data: `Time: ${new Date().toLocaleTimeString()}\n` });
    commands.push({ type: 'text', data: `Paper Width: ${paperWidth}mm\n` });
    commands.push({ type: 'text', data: `Line Length: ${lineLength} chars\n` });
    
    commands.push({ type: 'text', data: this.createLine('-', lineLength) });
    
    // Test patterns
    commands.push({ type: 'text', data: 'PRINTING TEST:\n' });
    commands.push({ type: 'text', data: '123456789012345678901234567890123456789012345678\n' });
    commands.push({ type: 'text', data: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\n' });
    commands.push({ type: 'text', data: 'abcdefghijklmnopqrstuvwxyz\n' });
    commands.push({ type: 'text', data: '!@#$%^&*()_+-=[]{}|;:,.<>?\n' });
    
    commands.push({ type: 'text', data: this.createLine('-', lineLength) });

    // Test formatting
    commands.push({ type: 'bold' });
    commands.push({ type: 'text', data: 'BOLD TEXT\n' });
    commands.push({ type: 'size', size: 'normal' });
    
    commands.push({ type: 'size', size: 'wide' });
    commands.push({ type: 'text', data: 'WIDE TEXT\n' });
    commands.push({ type: 'size', size: 'normal' });
    
    commands.push({ type: 'size', size: 'tall' });
    commands.push({ type: 'text', data: 'TALL TEXT\n' });
    commands.push({ type: 'size', size: 'normal' });

    // Center alignment test
    commands.push({ type: 'align', align: 'center' });
    commands.push({ type: 'text', data: 'CENTER ALIGNED\n' });
    
    // Right alignment test
    commands.push({ type: 'align', align: 'right' });
    commands.push({ type: 'text', data: 'RIGHT ALIGNED\n' });
    
    commands.push({ type: 'align', align: 'left' });
    commands.push({ type: 'text', data: this.createLine('=', lineLength) });
    
    commands.push({ type: 'align', align: 'center' });
    commands.push({ type: 'text', data: 'Test completed successfully!\n' });
    commands.push({ type: 'text', data: `${new Date().toISOString()}\n` });

    // Extra feeds
    commands.push({ type: 'feed' });
    commands.push({ type: 'feed' });

    return commands;
  }

  /**
   * Create a line of repeated characters
   */
  private static createLine(char: string, length: number): string {
    return char.repeat(length) + '\n';
  }

  /**
   * Format a line with label and total amount, right-aligned
   */
  private static formatLineWithTotal(label: string, amount: number, lineLength: number): string {
    const amountStr = formatCurrency(amount);
    const availableSpace = lineLength - label.length - amountStr.length;
    const padding = Math.max(1, availableSpace);
    return label + ' '.repeat(padding) + amountStr + '\n';
  }

  /**
   * Auto-print receipt for a transaction
   */
  static async autoPrintReceipt(
    transaction: Transaction,
    storeName: string,
    storeAddress?: string,
    storePhone?: string,
    cashierName?: string
  ): Promise<void> {
    try {
      // Get printer service instance
      const { BluetoothPrinterService } = await import('./BluetoothPrinterService');
      const printerService = BluetoothPrinterService.getInstance();

      // Check if printer is connected
      if (!printerService.getStatus().connected) {
        console.warn('No printer connected for auto-print');
        return;
      }

      // Create receipt data
      const receiptData: ReceiptData = {
        transaction,
        storeName,
        storeAddress,
        storePhone,
        cashierName: cashierName || 'Unknown',
        printTime: new Date()
      };

      // Default printer settings for auto-print
      const printerSettings: PrinterSettings = {
        autoPrintEnabled: true,
        paperWidth: 58,
        encoding: 'utf8',
        cutType: 'partial',
        cashdrawerEnabled: false
      };

      // Generate and print commands
      const commands = this.generateReceiptCommands(receiptData, printerSettings);
      await printerService.print(commands);

      console.log('Receipt auto-printed successfully');
    } catch (error) {
      console.error('Auto-print failed:', error);
      // Don't throw error for auto-print failures to avoid disrupting the sale
    }
  }
} 