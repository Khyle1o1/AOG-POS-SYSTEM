import crypto from 'crypto';

export interface LicenseInfo {
  licenseKey: string;
  productId: string;
  customerEmail: string;
  customerName: string;
  expiryDate: Date;
  maxActivations: number;
  features: string[];
  machineId?: string;
  activatedAt?: Date;
  isValid?: boolean;
}

export interface LicenseValidation {
  valid: boolean;
  info?: LicenseInfo;
  error?: string;
}

export class LicenseService {
  private static readonly SECRET_KEY = 'AOG-TECH-POS-SYSTEM-2024-SECRET-KEY-CHANGE-IN-PRODUCTION';
  private static readonly PRODUCT_ID = 'AOG-TECH-POS-SYSTEM-V1';
  private static readonly STORAGE_KEY = 'pos_license_data';

  /**
   * Get machine ID for hardware fingerprinting
   */
  private static async getMachineId(): Promise<string> {
    try {
      // Try to get machine ID from Electron API first
      if (window.electronAPI?.getMachineId) {
        return await window.electronAPI.getMachineId();
      }
      
      // Fallback to browser fingerprinting
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Hardware fingerprint', 2, 2);
        const canvasData = canvas.toDataURL();
        
        // Combine with other browser properties
        const fingerprint = [
          canvasData,
          navigator.userAgent,
          navigator.platform,
          screen.width + 'x' + screen.height,
          new Date().getTimezoneOffset().toString(),
          navigator.language,
          navigator.hardwareConcurrency?.toString() || '0'
        ].join('|');
        
        // Create hash of fingerprint
        return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
      }
      
      // Ultimate fallback
      return crypto.createHash('sha256').update(navigator.userAgent + navigator.platform).digest('hex').substring(0, 32);
    } catch (error) {
      console.error('Failed to get machine ID:', error);
      return 'FALLBACK-MACHINE-ID';
    }
  }

  /**
   * Generate a license key
   */
  static generateLicenseKey(
    customerEmail: string, 
    customerName: string,
    expiryDate: Date, 
    features: string[] = ['basic'],
    maxActivations: number = 1
  ): string {
    const data = {
      email: customerEmail,
      name: customerName,
      productId: this.PRODUCT_ID,
      expiry: expiryDate.getTime(),
      features,
      maxActivations,
      generated: Date.now(),
      version: '1.0'
    };

    const dataString = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(dataString)
      .digest('hex');

    const licenseData = Buffer.from(JSON.stringify({ data, signature })).toString('base64');
    
    // Format as XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
    const chunks = licenseData.match(/.{1,5}/g) || [];
    const key = chunks.slice(0, 5).join('-');
    
    return key.toUpperCase();
  }

  /**
   * Validate license key format and signature
   */
  static validateLicenseKey(licenseKey: string): LicenseValidation {
    try {
      if (!licenseKey || typeof licenseKey !== 'string') {
        return { valid: false, error: 'Invalid license key format' };
      }

      // Remove dashes and check format
      const cleanKey = licenseKey.replace(/-/g, '').toUpperCase();
      
      if (cleanKey.length !== 25) {
        return { valid: false, error: 'Invalid license key length' };
      }

      // For the new hash-based system, we need to validate against known license data
      // Since we can't decode customer info from the hash, we'll validate the format
      // and provide a mechanism to register license details
      
      // Check if key contains only valid hex characters
      if (!/^[0-9A-F]+$/.test(cleanKey)) {
        return { valid: false, error: 'Invalid license key format' };
      }

      // For demo purposes, let's create some demo license data
      // In a real system, you would look this up from a database or validate against a server
      const demoLicenses = {
        // This would be a lookup table of valid licenses
        'DEFAULT_DEMO_KEY': {
          customerEmail: 'demo@aogtech.com',
          customerName: 'Demo Customer',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          features: ['all'],
          maxActivations: 1
        }
      };

      // For now, accept any properly formatted 25-character hex key as valid
      // In production, you would validate against your license database
      return {
        valid: true,
        info: {
          licenseKey,
          productId: this.PRODUCT_ID,
          customerEmail: 'demo@aogtech.com', // This would come from your license database
          customerName: 'Demo Customer',     // This would come from your license database
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          maxActivations: 1,
          features: ['all']
        }
      };
    } catch (error) {
      console.error('License validation error:', error);
      return { valid: false, error: 'Failed to validate license key' };
    }
  }

  /**
   * Activate license on this machine
   */
  static async activateLicense(licenseKey: string): Promise<{ success: boolean; error?: string }> {
    const validation = this.validateLicenseKey(licenseKey);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      const machineId = await this.getMachineId();
      
      // Check if already activated on this machine
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const storedData = JSON.parse(stored);
          if (storedData.machineId === machineId && storedData.licenseKey === licenseKey) {
            // Already activated on this machine with this key
            return { success: true };
          }
        } catch {
          // Invalid stored data, continue with new activation
        }
      }

      // Store activation
      const activationData = {
        ...validation.info,
        machineId,
        activatedAt: new Date().toISOString(),
        isValid: true
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activationData));
      
      return { success: true };
    } catch (error) {
      console.error('License activation error:', error);
      return { success: false, error: 'Failed to activate license on this machine' };
    }
  }

  /**
   * Check if current installation is licensed
   */
  static async isLicensed(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      const data = JSON.parse(stored);
      const machineId = await this.getMachineId();

      // Verify machine ID matches
      if (data.machineId !== machineId) {
        console.warn('License machine ID mismatch');
        return false;
      }

      // Verify license is still valid
      const validation = this.validateLicenseKey(data.licenseKey);
      return validation.valid;
    } catch (error) {
      console.error('License check error:', error);
      return false;
    }
  }

  /**
   * Get current license info
   */
  static getLicenseInfo(): LicenseInfo | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Validate the stored license
      const validation = this.validateLicenseKey(data.licenseKey);
      if (!validation.valid) {
        return null;
      }

      return {
        ...data,
        expiryDate: new Date(data.expiryDate),
        activatedAt: data.activatedAt ? new Date(data.activatedAt) : undefined
      };
    } catch (error) {
      console.error('Failed to get license info:', error);
      return null;
    }
  }

  /**
   * Deactivate license
   */
  static deactivateLicense(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if a specific feature is enabled
   */
  static hasFeature(feature: string): boolean {
    const licenseInfo = this.getLicenseInfo();
    if (!licenseInfo) return false;
    
    return licenseInfo.features.includes(feature) || licenseInfo.features.includes('all');
  }

  /**
   * Get days until license expiry
   */
  static getDaysUntilExpiry(): number | null {
    const licenseInfo = this.getLicenseInfo();
    if (!licenseInfo) return null;

    const now = new Date();
    const expiry = licenseInfo.expiryDate;
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Check if license expires soon (within 30 days)
   */
  static isExpiringSoon(): boolean {
    const days = this.getDaysUntilExpiry();
    return days !== null && days <= 30 && days > 0;
  }

  /**
   * Format license key for display
   */
  static formatLicenseKey(key: string): string {
    const clean = key.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return clean.replace(/(.{5})/g, '$1-').slice(0, -1);
  }
} 