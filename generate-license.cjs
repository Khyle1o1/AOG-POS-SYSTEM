#!/usr/bin/env node

const crypto = require('crypto');

// Configuration - CHANGE THESE IN PRODUCTION
const SECRET_KEY = 'AOG-TECH-POS-SYSTEM-2024-SECRET-KEY-CHANGE-IN-PRODUCTION';
const PRODUCT_ID = 'AOG-TECH-POS-SYSTEM-V1';

/**
 * Generate a license key
 */
function generateLicenseKey(customerEmail, customerName, expiryDate, features = ['basic'], maxActivations = 1) {
  const data = {
    email: customerEmail,
    name: customerName,
    productId: PRODUCT_ID,
    expiry: expiryDate.getTime(),
    features,
    maxActivations,
    generated: Date.now(),
    version: '1.0'
  };

  const dataString = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataString)
    .digest('hex');

  // Create a hash-based license key that encodes the essential information
  const licenseInput = `${customerEmail}|${expiryDate.getTime()}|${features.join(',')}|${Date.now()}`;
  const licenseHash = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(licenseInput)
    .digest('hex');

  // Take first 20 characters and add a 5-character checksum
  const keyPart = licenseHash.substring(0, 20);
  const checksum = crypto.createHash('md5').update(licenseHash).digest('hex').substring(0, 5);
  const fullKey = (keyPart + checksum).toUpperCase();

  // Format as XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
  const formatted = fullKey.replace(/(.{5})/g, '$1-').slice(0, -1);
  
  // Store the full data for validation (we'll need to create a lookup mechanism)
  // For now, we'll embed essential data in a way that can be validated
  
  return formatted;
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    email: null,
    name: null,
    days: 365,
    features: ['basic'],
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--email':
      case '-e':
        options.email = args[++i];
        break;
      case '--name':
      case '-n':
        options.name = args[++i];
        break;
      case '--days':
      case '-d':
        options.days = parseInt(args[++i]) || 365;
        break;
      case '--features':
      case '-f':
        options.features = args[++i].split(',').map(f => f.trim());
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (!options.email && arg.includes('@')) {
          options.email = arg;
        } else if (!options.name && !arg.startsWith('-')) {
          options.name = arg;
        }
        break;
    }
  }

  return options;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
AOG Tech POS System - License Generator
======================================

Usage: node generate-license.cjs [options]

Options:
  -e, --email <email>     Customer email address (required)
  -n, --name <name>       Customer name (required)
  -d, --days <days>       License validity in days (default: 365)
  -f, --features <list>   Comma-separated feature list (default: basic)
  -h, --help              Show this help message

Features available:
  - basic: Basic POS functionality
  - advanced: Advanced reporting and analytics
  - multi-user: Multiple user management
  - all: All features

Examples:
  node generate-license.cjs -e john@example.com -n "John Doe"
  node generate-license.cjs -e jane@company.com -n "Jane Smith" -d 730 -f "basic,advanced"
  node generate-license.cjs john@example.com "John Doe" --days 90
  `);
}

/**
 * Main function
 */
function main() {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Validate required arguments
  if (!options.email) {
    console.error('❌ Error: Customer email is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  if (!options.name) {
    console.error('❌ Error: Customer name is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.email)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  // Validate days
  if (options.days < 1 || options.days > 3650) {
    console.error('❌ Error: Days must be between 1 and 3650');
    process.exit(1);
  }

  // Calculate expiry date
  const expiryDate = new Date(Date.now() + options.days * 24 * 60 * 60 * 1000);

  try {
    // Generate license key
    const licenseKey = generateLicenseKey(
      options.email,
      options.name,
      expiryDate,
      options.features
    );

    // Display results
    console.log('\n🎉 License Generated Successfully!');
    console.log('====================================');
    console.log(`License Key: ${licenseKey}`);
    console.log(`Customer: ${options.name}`);
    console.log(`Email: ${options.email}`);
    console.log(`Valid Until: ${expiryDate.toLocaleDateString()}`);
    console.log(`Features: ${options.features.join(', ')}`);
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log('====================================');
    
    // Copy to clipboard reminder
    console.log('\n📋 Copy the license key above and provide it to the customer.');
    console.log('The customer will use this key to activate their POS system.');
    
  } catch (error) {
    console.error('❌ Error generating license:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateLicenseKey }; 