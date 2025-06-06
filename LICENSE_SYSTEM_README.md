# POS System - Custom Licensing Implementation

This document explains how to use the custom licensing system implemented for the AOG Tech POS System.

## Overview

The licensing system provides:
- **Hardware fingerprinting** - Licenses are tied to specific machines
- **Cryptographic security** - License keys are digitally signed and tamper-proof
- **Feature control** - Different license tiers with specific features
- **Expiry management** - Time-based license validation
- **Easy activation** - Simple activation process for end users

## 🔑 Features

### Security Features
- HMAC-SHA256 digital signatures
- Hardware-based machine fingerprinting
- Tamper-proof license validation
- Local storage with validation checks

### Business Features
- Multiple feature tiers (basic, advanced, multi-user, all)
- Customizable expiry dates
- License deactivation/reactivation
- Expiry warnings (30 days before expiration)

## 📝 How to Generate License Keys

### Using the Command Line Tool

The `generate-license.cjs` script allows you to generate license keys for customers:

```bash
# Basic license for 1 year
node generate-license.cjs -e customer@example.com -n "Customer Name"

# Advanced license with specific features for 2 years
node generate-license.cjs -e business@company.com -n "Business Customer" -d 730 -f "basic,advanced"

# Full featured license
node generate-license.cjs -e enterprise@corp.com -n "Enterprise Client" -d 365 -f "all"
```

### Available Options

| Option | Description | Example |
|--------|-------------|---------|
| `-e, --email` | Customer email (required) | `-e customer@example.com` |
| `-n, --name` | Customer name (required) | `-n "John Doe"` |
| `-d, --days` | License validity in days (default: 365) | `-d 730` |
| `-f, --features` | Comma-separated feature list | `-f "basic,advanced"` |
| `-h, --help` | Show help information | `--help` |

### Available Features

- **basic**: Basic POS functionality (sales, inventory basics)
- **advanced**: Advanced reporting and analytics
- **multi-user**: Multiple user management
- **all**: All features unlocked

## 💻 Customer License Activation

### For Customers

1. **Launch the POS System** - The application will show the license activation screen
2. **Enter License Key** - Type or paste the license key provided
3. **Activate** - Click "Activate License" button
4. **Success** - The system will validate and activate the license

### License Key Format

License keys follow the format: `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`

Example: `EYJKY-XRHIJ-P7IMV-TYWLS-IJOIZ`

## 🔧 Implementation Details

### File Structure

```
src/
├── services/
│   └── LicenseService.ts          # Core licensing logic
├── components/
│   └── LicenseActivation.tsx      # Activation UI component
├── types/
│   └── electron.d.ts              # Electron API types
└── pages/
    └── Settings.tsx               # License management in settings

electron/
├── main.cjs                       # Electron main process (includes machine ID)
└── preload.cjs                    # Electron preload script

generate-license.cjs               # License generation script
```

### Core Components

#### LicenseService.ts
- `generateLicenseKey()` - Creates cryptographically signed license keys
- `validateLicenseKey()` - Validates license signature and expiry
- `activateLicense()` - Activates license on current machine
- `isLicensed()` - Checks if current installation is licensed
- `getLicenseInfo()` - Retrieves current license information
- `deactivateLicense()` - Removes license from current machine

#### LicenseActivation.tsx
- Beautiful activation UI with real-time validation
- Auto-formatting of license keys
- Error handling and user feedback
- Support contact integration

## 🔐 Security Considerations

### Production Deployment

**⚠️ IMPORTANT: Change the SECRET_KEY before production deployment!**

1. **Update Secret Key** in both files:
   ```typescript
   // In src/services/LicenseService.ts
   private static readonly SECRET_KEY = 'YOUR-UNIQUE-PRODUCTION-SECRET-KEY';
   
   // In generate-license.cjs
   const SECRET_KEY = 'YOUR-UNIQUE-PRODUCTION-SECRET-KEY';
   ```

2. **Keep the secret key secure** - Store it in environment variables or secure configuration

3. **Obfuscate the frontend code** (optional) - Use tools like `javascript-obfuscator` for additional protection

### Hardware Fingerprinting

The system uses multiple methods for machine identification:
1. **Electron API** - `machineIdSync()` from `node-machine-id` package
2. **Browser fingerprinting** - Canvas fingerprinting + system properties
3. **Fallback** - Static identifier for edge cases

## 📊 License Management

### In the Application

Users can manage their license through **Settings > License Information**:
- View license details (customer, expiry, features)
- See expiry warnings
- Copy license key
- Deactivate license (admin only)

### For Administrators

Generate licenses for customers:
```bash
# Generate a 1-year license with all features
node generate-license.cjs -e customer@email.com -n "Customer Name" -f "all"

# Generate a 30-day trial license
node generate-license.cjs -e trial@email.com -n "Trial User" -d 30 -f "basic"

# Generate enterprise license for 2 years
node generate-license.cjs -e enterprise@company.com -n "Enterprise Corp" -d 730 -f "all"
```

## 🎯 Usage Examples

### Basic Business Workflow

1. **Customer Purchase**
   ```bash
   node generate-license.cjs -e customer@business.com -n "Business Name" -d 365 -f "basic,advanced"
   ```

2. **Send License Key** - Email the generated key to customer

3. **Customer Activation** - Customer enters key in POS system

4. **License Management** - Customer can view license details in Settings

### Trial License

```bash
# 30-day trial with basic features
node generate-license.cjs -e trial@company.com -n "Trial Customer" -d 30 -f "basic"
```

### Enterprise License

```bash
# 2-year enterprise license with all features
node generate-license.cjs -e enterprise@corp.com -n "Enterprise Client" -d 730 -f "all"
```

## 🚀 Testing

### Test License Key

For testing purposes, use this demo license key:
```
E0C7C-B9B93-AA33A-5185E-F7F62
```

This key is valid for:
- Customer: Demo Customer
- Email: demo@aogtech.com
- Features: all
- Expires: 1 year from generation

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid license key format"**
   - Check that the key follows XXXXX-XXXXX-XXXXX-XXXXX-XXXXX format
   - Ensure no extra spaces or characters

2. **"License machine ID mismatch"**
   - License is activated on a different machine
   - Contact support for license transfer

3. **"License has expired"**
   - Generate a new license with extended expiry
   - Contact customer about renewal

4. **License won't activate**
   - Check internet connection (if using online validation)
   - Verify system date/time is correct
   - Contact support with error details

### Debug Mode

For development, you can check license status in browser console:
```javascript
// Check if licensed
const isLicensed = await LicenseService.isLicensed();
console.log('Licensed:', isLicensed);

// Get license info
const info = LicenseService.getLicenseInfo();
console.log('License Info:', info);

// Check days until expiry
const days = LicenseService.getDaysUntilExpiry();
console.log('Days until expiry:', days);
```

## 📞 Support

For licensing support:
- Email: support@aogtech.com
- Include: License key, error message, system information

---

**© 2024 AOG Tech. All rights reserved.** 