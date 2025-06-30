import crypto from 'crypto';
import { LICENSE_CONFIG, LICENSE_ENDPOINTS } from '../config/license';

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
  status?: string;
  suspendedAt?: Date;
  suspendedReason?: string;
  lastChecked?: string;
}

export interface LicenseValidation {
  valid: boolean;
  info?: LicenseInfo;
  error?: string;
  reason?: string;
  details?: string;
}

export class LicenseService {
  private static readonly SECRET_KEY = 'AOG-TECH-POS-SYSTEM-2024-SECRET-KEY-CHANGE-IN-PRODUCTION';
  private static readonly PRODUCT_ID = 'AOG-TECH-POS-SYSTEM-V1';
  private static readonly STORAGE_KEY = 'pos_license_data';
  
  // Cache for last license check to avoid excessive API calls
  private static lastLicenseCheck: { timestamp: number; result: boolean } | null = null;

  /**
   * Make a request to the license server with timeout and retry logic
   */
  private static async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LICENSE_CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check license status against the license server
   */
  private static async checkLicenseWithServer(licenseKey: string): Promise<LicenseValidation> {
    try {
      const url = `${LICENSE_CONFIG.SERVER_URL}${LICENSE_ENDPOINTS.CHECK_STATUS.replace(':licenseKey', encodeURIComponent(licenseKey))}`;
      
      if (LICENSE_CONFIG.ENABLE_DEBUG_LOGS) {
        console.log('Checking license with server:', url);
      }

      const response = await this.makeRequest(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (LICENSE_CONFIG.ENABLE_DEBUG_LOGS) {
          console.warn('License server returned error:', errorData);
        }
        
        return { 
          valid: false, 
          error: errorData.error || `Server error: ${response.status}`,
          reason: errorData.error || 'Server validation failed'
        };
      }

      const data = await response.json();
      
      if (LICENSE_CONFIG.ENABLE_DEBUG_LOGS) {
        console.log('License server response:', data);
      }
      
      return {
        valid: data.valid,
        reason: data.reason,
        details: data.details,
        info: data.license ? {
          licenseKey: data.licenseKey,
          productId: this.PRODUCT_ID,
          customerEmail: data.license.customer.email,
          customerName: data.license.customer.name,
          expiryDate: new Date(data.license.expiresAt),
          maxActivations: data.license.maxActivations,
          features: data.license.features || ['basic'],
          status: data.status,
          suspendedAt: data.license.suspendedAt ? new Date(data.license.suspendedAt) : undefined,
          suspendedReason: data.license.suspendedReason
        } : undefined
      };
    } catch (error) {
      console.error('License server validation failed:', error);
      
      if (LICENSE_CONFIG.ALLOW_OFFLINE_MODE) {
        // Check if we have valid cached license data and are within grace period
        const licenseInfo = this.getLicenseInfo();
        if (licenseInfo && licenseInfo.activatedAt) {
          const timeSinceActivation = Date.now() - licenseInfo.activatedAt.getTime();
          const timeSinceLastCheck = licenseInfo.lastChecked ? Date.now() - new Date(licenseInfo.lastChecked).getTime() : 0;
          
          // Check if license is not expired based on its expiry date
          const isNotExpired = licenseInfo.expiryDate && licenseInfo.expiryDate.getTime() > Date.now();
          
          // Allow offline operation if:
          // 1. License has not expired
          // 2. We're within the offline grace period since activation
          // 3. The last successful check was recent enough
          if (isNotExpired && 
              (timeSinceActivation < LICENSE_CONFIG.OFFLINE_GRACE_PERIOD || 
               timeSinceLastCheck < LICENSE_CONFIG.OFFLINE_GRACE_PERIOD)) {
            console.warn('Using offline mode due to server unreachability - license remains valid');
            return {
              valid: true,
              info: licenseInfo,
              reason: 'Offline mode - server unreachable but license cached and valid'
            };
          } else {
            console.warn('Offline grace period exceeded or license expired locally');
          }
        } else {
          console.warn('No valid cached license data found for offline mode');
        }
      }
      
      return { 
        valid: false, 
        error: 'Cannot reach license server for validation',
        reason: 'Server unreachable and no valid offline license'
      };
    }
  }

  /**
   * Get machine ID for hardware fingerprinting
   */
  private static async getMachineId(): Promise<string> {
    try {
      // Browser fingerprinting approach
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
        
        // Create hash of fingerprint using Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex.substring(0, 32);
      }
      
      // Ultimate fallback
      const fallbackData = navigator.userAgent + navigator.platform;
      const encoder = new TextEncoder();
      const data = encoder.encode(fallbackData);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 32);
    } catch (error) {
      console.error('Failed to get machine ID:', error);
      return 'FALLBACK-MACHINE-ID';
    }
  }

  /**
   * Generate a license key (kept for backward compatibility)
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
   * Validate license key against the server database
   */
  static async validateLicenseKey(licenseKey: string): Promise<LicenseValidation> {
    try {
      if (!licenseKey || typeof licenseKey !== 'string') {
        return { valid: false, error: 'Invalid license key format' };
      }

      // Remove dashes and check basic format
      const cleanKey = licenseKey.replace(/-/g, '').toUpperCase();
      
      if (cleanKey.length !== 25) {
        return { valid: false, error: 'Invalid license key length' };
      }

      // Check if key contains only valid characters
      if (!/^[0-9A-F]+$/i.test(cleanKey)) {
        return { valid: false, error: 'Invalid license key format' };
      }

      // Check against license server
      const serverValidation = await this.checkLicenseWithServer(licenseKey);
      
      if (!serverValidation.valid) {
        // Clear local license data if server says it's invalid
        localStorage.removeItem(this.STORAGE_KEY);
        return serverValidation;
      }

      return serverValidation;
    } catch (error) {
      console.error('License validation error:', error);
      return { valid: false, error: 'Failed to validate license key' };
    }
  }

  /**
   * Activate license on this machine
   */
  static async activateLicense(licenseKey: string): Promise<{ success: boolean; error?: string }> {
    const validation = await this.validateLicenseKey(licenseKey);
    
    if (!validation.valid) {
      return { success: false, error: validation.error || validation.reason };
    }

    try {
      const machineId = await this.getMachineId();
      
      // Check if already activated on this machine
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const storedData = JSON.parse(stored);
          if (storedData.machineId === machineId && storedData.licenseKey === licenseKey) {
            // Revalidate against server to ensure it's still active
            const revalidation = await this.validateLicenseKey(licenseKey);
            if (revalidation.valid) {
              // Update last checked timestamp
              const updatedData = {
                ...storedData,
                lastChecked: new Date().toISOString()
              };
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
              return { success: true };
            } else {
              // License is no longer valid on server, clear local storage
              localStorage.removeItem(this.STORAGE_KEY);
              return { success: false, error: revalidation.reason || 'License is no longer valid' };
            }
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
        isValid: true,
        lastChecked: new Date().toISOString()
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
        localStorage.removeItem(this.STORAGE_KEY);
        return false;
      }

      // Check cache first to avoid excessive API calls
      const now = Date.now();
      if (this.lastLicenseCheck && 
          (now - this.lastLicenseCheck.timestamp) < LICENSE_CONFIG.CACHE_DURATION) {
        return this.lastLicenseCheck.result;
      }

      // Try to validate against server
      try {
        const validation = await this.validateLicenseKey(data.licenseKey);
        const isValid = validation.valid;

        // Update cache
        this.lastLicenseCheck = {
          timestamp: now,
          result: isValid
        };

        if (isValid) {
          // Update stored data with latest info from server
          if (validation.info) {
            const updatedData = {
              ...data,
              ...validation.info,
              lastChecked: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
          }
          return true;
        } else {
          // Server says license is invalid - clear local storage only if not in offline mode
          if (!LICENSE_CONFIG.ALLOW_OFFLINE_MODE) {
            localStorage.removeItem(this.STORAGE_KEY);
          }
          console.warn('License validation failed:', validation.reason || validation.error);
          return false;
        }
      } catch (networkError) {
        // Network error occurred - check if we can operate in offline mode
        console.warn('Network error during license validation:', networkError);
        
        if (LICENSE_CONFIG.ALLOW_OFFLINE_MODE) {
          // Validate cached license data for offline operation
          const licenseInfo = this.getLicenseInfo();
          if (licenseInfo && licenseInfo.activatedAt && licenseInfo.expiryDate) {
            const timeSinceActivation = Date.now() - licenseInfo.activatedAt.getTime();
            const timeSinceLastCheck = licenseInfo.lastChecked ? Date.now() - new Date(licenseInfo.lastChecked).getTime() : 0;
            const isNotExpired = licenseInfo.expiryDate.getTime() > Date.now();
            
            // Allow offline operation if license meets offline criteria
            if (isNotExpired && 
                (timeSinceActivation < LICENSE_CONFIG.OFFLINE_GRACE_PERIOD || 
                 timeSinceLastCheck < LICENSE_CONFIG.OFFLINE_GRACE_PERIOD)) {
              console.log('Operating in offline mode - cached license is valid');
              
              // Update cache to indicate offline validation
              this.lastLicenseCheck = {
                timestamp: now,
                result: true
              };
              
              return true;
            } else {
              console.warn('Cached license does not meet offline criteria (expired or grace period exceeded)');
            }
          }
        }
        
        // Network error and no valid offline license
        return false;
      }
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
      
      return {
        ...data,
        expiryDate: new Date(data.expiryDate),
        activatedAt: data.activatedAt ? new Date(data.activatedAt) : undefined,
        suspendedAt: data.suspendedAt ? new Date(data.suspendedAt) : undefined
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
    this.lastLicenseCheck = null;
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

  /**
   * Force refresh license from server (clears cache)
   */
  static async refreshLicense(): Promise<boolean> {
    this.lastLicenseCheck = null;
    return await this.isLicensed();
  }

  /**
   * Get license status information
   */
  static getLicenseStatus(): { 
    isValid: boolean; 
    status?: string; 
    suspendedReason?: string; 
    expiryDays?: number;
    isOfflineMode?: boolean;
    offlineInfo?: {
      timeSinceActivation: number;
      timeSinceLastCheck: number;
      gracePeriodRemaining: number;
    };
  } {
    const licenseInfo = this.getLicenseInfo();
    if (!licenseInfo) {
      return { isValid: false };
    }

    const expiryDays = this.getDaysUntilExpiry();
    const now = Date.now();
    
    // Calculate offline information
    let isOfflineMode = false;
    let offlineInfo = undefined;
    
    if (LICENSE_CONFIG.ALLOW_OFFLINE_MODE && licenseInfo.activatedAt) {
      const timeSinceActivation = now - licenseInfo.activatedAt.getTime();
      const timeSinceLastCheck = licenseInfo.lastChecked ? now - new Date(licenseInfo.lastChecked).getTime() : timeSinceActivation;
      const gracePeriodRemaining = LICENSE_CONFIG.OFFLINE_GRACE_PERIOD - Math.min(timeSinceActivation, timeSinceLastCheck);
      
      // Consider it offline mode if we haven't checked recently and grace period is still valid
      isOfflineMode = timeSinceLastCheck > LICENSE_CONFIG.CACHE_DURATION && gracePeriodRemaining > 0;
      
      offlineInfo = {
        timeSinceActivation,
        timeSinceLastCheck,
        gracePeriodRemaining: Math.max(0, gracePeriodRemaining)
      };
    }

    return {
      isValid: licenseInfo.isValid !== false,
      status: licenseInfo.status,
      suspendedReason: licenseInfo.suspendedReason,
      expiryDays: expiryDays !== null ? expiryDays : undefined,
      isOfflineMode,
      offlineInfo
    };
  }

  /**
   * Check if the application is currently operating in offline mode
   */
  static isInOfflineMode(): boolean {
    const status = this.getLicenseStatus();
    return status.isOfflineMode || false;
  }
} 