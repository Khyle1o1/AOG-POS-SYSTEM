# Bluetooth Thermal Printer Setup Guide

This POS system now supports Bluetooth thermal receipt printers with auto-printing capabilities. This guide will help you set up and use the printer functionality.

## Supported Browsers

The Bluetooth printer feature uses the Web Bluetooth API, which is supported in:
- ✅ Chrome (desktop and mobile)
- ✅ Edge (desktop)
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

**Important**: Web Bluetooth requires HTTPS for security. Make sure your POS system is running on HTTPS in production.

## Supported Printers

This system supports ESC/POS compatible thermal printers, including:
- XP-58 series thermal printers
- Most 58mm and 80mm thermal receipt printers
- Bluetooth-enabled ESC/POS printers

## Setup Instructions

### 1. Prepare Your Printer

1. **Turn on your thermal printer**
2. **Enable Bluetooth pairing mode** (usually by holding the power button or a dedicated Bluetooth button)
3. **Ensure the printer is loaded with paper** (58mm or 80mm thermal paper)

### 2. Access Printer Settings

1. Go to **Settings** in your POS system
2. Scroll down to the **Printer Settings** section
3. You'll see the current printer status and configuration options

### 3. Scan and Connect

1. Click **"Scan for Printers"** - this will open your browser's Bluetooth pairing dialog
2. Select your thermal printer from the list of available devices
3. Grant permission when prompted
4. Click **"Connect"** next to your printer in the list
5. Wait for the connection to be established (status will show "Connected")

### 4. Test the Connection

1. Once connected, click **"Print Test Receipt"**
2. Your printer should print a test receipt with various formatting examples
3. If the test print works, your printer is ready to use

### 5. Configure Auto-Print Settings

- **Auto-print receipts**: Enable this to automatically print receipts after each sale
- **Paper Width**: Select 58mm or 80mm based on your printer
- **Paper Cut Type**: Choose partial cut, full cut, or no cut
- **Cash drawer control**: Enable if you have a cash drawer connected to the printer

## Using the Printer

### Manual Printing

Even with auto-print disabled, you can manually print receipts:
1. Complete a sale normally
2. The receipt modal will appear
3. Click the print button (this will use the browser's print function as fallback)

### Auto-Printing

When auto-print is enabled:
1. Complete a sale as usual
2. The receipt will automatically be sent to the connected thermal printer
3. You'll see a success notification if printing succeeds
4. The receipt modal will still appear for record-keeping

## Troubleshooting

### Connection Issues

**"Failed to scan for printers"**
- Make sure Bluetooth is enabled on your device
- Ensure your printer is in pairing mode
- Try refreshing the page and scanning again
- Check that you're using a supported browser (Chrome/Edge)

**"Failed to connect to printer"**
- Make sure the printer is still in pairing mode
- Try turning the printer off and on again
- Clear your browser's Bluetooth cache (in Chrome: chrome://bluetooth-internals/)

### Printing Issues

**"Test print failed"**
- Check that the printer has paper loaded correctly
- Ensure the printer is still connected (check the status indicator)
- Try disconnecting and reconnecting the printer

**"Auto-print failed"**
- The sale will still be recorded, but the receipt wasn't printed
- Check the printer connection and try printing manually
- Ensure the printer has sufficient paper

### Paper and Format Issues

**Receipt prints but looks wrong**
- Check the paper width setting (58mm vs 80mm)
- Ensure you're using the correct thermal paper for your printer
- Some special characters may not print correctly depending on the printer model

**Paper doesn't cut**
- Check the "Paper Cut Type" setting
- Some printers require specific cut commands - try different cut types
- Manual cutting may be required for some printer models

## Receipt Format

The auto-printed receipts include:
- Store name and information
- Receipt number and timestamp
- Cashier name
- Itemized list with quantities and prices
- Subtotal, discounts, tax, and total
- Payment amount and change
- Thank you message

## Technical Notes

### ESC/POS Commands

The system uses standard ESC/POS commands for:
- Text formatting (bold, sizing, alignment)
- Paper cutting
- Cash drawer control (if connected)
- Line feeds and spacing

### Security

- All Bluetooth communication is encrypted
- Printer connections are local to your device
- No receipt data is transmitted over the internet

### Performance

- Receipts are printed in chunks to avoid overwhelming the printer
- There's a small delay between commands to ensure reliable printing
- Large receipts may take a few seconds to print completely

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Ensure your printer model is ESC/POS compatible
3. Test with a different browser (Chrome is recommended)
4. Contact support with your printer model and error messages

## Compatible Printer Models

### Tested Printers
- XP-58 series
- Most generic 58mm/80mm thermal printers with Bluetooth

### ESC/POS Command Set
The system uses standard ESC/POS commands, so most thermal printers should work. If your printer supports:
- Bluetooth connectivity
- ESC/POS command set
- 58mm or 80mm paper width

It should be compatible with this system. 