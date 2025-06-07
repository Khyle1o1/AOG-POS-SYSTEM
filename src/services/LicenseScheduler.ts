/**
 * License Scheduler Service
 * 
 * Handles monthly license status checks with internet connectivity awareness
 * Runs silently in the background and only checks when actually due (monthly)
 */

import { LicenseService } from './LicenseService';

interface SchedulerState {
  lastMonthlyCheck: string | null;
  nextScheduledCheck: string | null;
  missedChecks: number;
}

interface CheckResult {
  success: boolean;
  timestamp: string;
  licenseValid: boolean;
  error?: string;
  wasOffline?: boolean;
}

export class LicenseScheduler {
  private static readonly STORAGE_KEY = 'pos-license-scheduler';
  private static readonly MONTHLY_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  private static readonly MAX_MISSED_CHECKS = 3; // Allow 3 missed monthly checks
  
  private static checkTimeoutId: NodeJS.Timeout | null = null;
  private static state: SchedulerState = {
    lastMonthlyCheck: null,
    nextScheduledCheck: null,
    missedChecks: 0
  };

  /**
   * Initialize the license scheduler
   */
  static initialize(): void {
    this.loadState();
    this.setupNetworkListeners();
    this.scheduleNextCheck();
    
    console.log('License Scheduler initialized (silent mode)');
  }

  /**
   * Setup network status listeners
   */
  private static setupNetworkListeners(): void {
    const handleOnline = () => {
      console.log('Network connection restored - checking if license validation is due');
      // When coming online, check if we have a pending monthly check
      this.checkIfMonthlyCheckNeeded();
    };

    window.addEventListener('online', handleOnline);
  }

  /**
   * Schedule the next license check only when it's actually due
   */
  private static scheduleNextCheck(): void {
    // Clear existing timeout
    if (this.checkTimeoutId) {
      clearTimeout(this.checkTimeoutId);
    }

    const nextCheckTime = this.calculateNextCheckTime();
    if (!nextCheckTime) {
      // If no next check time, check immediately (first time)
      this.checkIfMonthlyCheckNeeded();
      return;
    }

    const now = new Date();
    const timeUntilCheck = nextCheckTime.getTime() - now.getTime();

    if (timeUntilCheck <= 0) {
      // Check is overdue, do it now
      this.checkIfMonthlyCheckNeeded();
    } else {
      // Schedule the check for the exact time it's due
      this.checkTimeoutId = setTimeout(() => {
        this.checkIfMonthlyCheckNeeded();
      }, timeUntilCheck);
      
      console.log(`Next license check scheduled for: ${nextCheckTime.toLocaleString()}`);
    }
  }

  /**
   * Check if a monthly license check is needed and perform it
   */
  private static async checkIfMonthlyCheckNeeded(): Promise<void> {
    const now = new Date();
    const needsCheck = this.isMonthlyCheckDue(now);

    if (needsCheck) {
      console.log('Monthly license check is due, performing validation...');
      const result = await this.performMonthlyCheck();
      
      if (result.success) {
        // Schedule the next check in 30 days
        this.scheduleNextCheck();
      } else {
        // If failed, try again in 24 hours
        this.checkTimeoutId = setTimeout(() => {
          this.checkIfMonthlyCheckNeeded();
        }, 24 * 60 * 60 * 1000);
      }
    }
  }

  /**
   * Check if monthly license check is due
   */
  private static isMonthlyCheckDue(now: Date): boolean {
    if (!this.state.lastMonthlyCheck) {
      // No previous check - check is due
      return true;
    }

    const lastCheck = new Date(this.state.lastMonthlyCheck);
    const timeSinceLastCheck = now.getTime() - lastCheck.getTime();
    
    // Check if it's been more than 30 days since last check
    return timeSinceLastCheck >= this.MONTHLY_INTERVAL;
  }

  /**
   * Calculate next check time
   */
  private static calculateNextCheckTime(): Date | null {
    if (!this.state.lastMonthlyCheck) {
      // If no previous check, check soon (1 minute from now for first run)
      const soon = new Date();
      soon.setMinutes(soon.getMinutes() + 1);
      return soon;
    }

    const lastCheck = new Date(this.state.lastMonthlyCheck);
    const nextCheck = new Date(lastCheck.getTime() + this.MONTHLY_INTERVAL);
    return nextCheck;
  }

  /**
   * Perform the monthly license check
   */
  private static async performMonthlyCheck(): Promise<CheckResult> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log('License Scheduler: Starting monthly license validation...');
      
      // Check internet connectivity first
      if (!await this.testInternetConnectivity()) {
        console.log('License Scheduler: No internet connectivity - will retry later');
        this.state.missedChecks++;
        this.saveState();
        
        return {
          success: false,
          timestamp,
          licenseValid: false,
          wasOffline: true,
          error: 'No internet connectivity'
        };
      }

      // Perform license validation
      const isLicensed = await LicenseService.refreshLicense();
      
      if (isLicensed) {
        console.log('License Scheduler: Monthly validation successful');
        this.state.lastMonthlyCheck = timestamp;
        this.state.nextScheduledCheck = this.calculateNextCheckTime()?.toISOString() || null;
        this.state.missedChecks = 0; // Reset missed checks on successful validation
        this.saveState();
        
        // Notify main process if running in Electron
        this.notifyElectronProcess('monthly-license-check-success', {
          timestamp,
          licenseValid: true
        });

        return {
          success: true,
          timestamp,
          licenseValid: true
        };
      } else {
        console.warn('License Scheduler: Monthly validation failed - license invalid');
        this.state.missedChecks++;
        this.saveState();
        
        // Notify main process if running in Electron
        this.notifyElectronProcess('monthly-license-check-failed', {
          timestamp,
          licenseValid: false,
          reason: 'License validation failed'
        });

        return {
          success: false,
          timestamp,
          licenseValid: false,
          error: 'License validation failed'
        };
      }
    } catch (error) {
      console.error('License Scheduler: Monthly check error:', error);
      this.state.missedChecks++;
      this.saveState();
      
      return {
        success: false,
        timestamp,
        licenseValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test internet connectivity
   */
  private static async testInternetConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Try to fetch from the license server first
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${import.meta.env.REACT_APP_LICENSE_SERVER_URL || 'http://localhost:5000'}/api/health`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // If license server is unreachable, try a fallback connectivity test
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache',
          mode: 'no-cors'
        });
        
        clearTimeout(timeoutId);
        return true; // If we can reach Google, we have internet
      } catch (fallbackError) {
        return false;
      }
    }
  }

  /**
   * Notify Electron main process of license events
   */
  private static notifyElectronProcess(event: string, data: any): void {
    if (window.electronAPI?.sendToMain) {
      window.electronAPI.sendToMain(event, data);
    }
  }

  /**
   * Load scheduler state from storage
   */
  private static loadState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        this.state = {
          ...this.state,
          ...parsedState
        };
      }
    } catch (error) {
      console.error('License Scheduler: Failed to load state:', error);
    }
  }

  /**
   * Save scheduler state to storage
   */
  private static saveState(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('License Scheduler: Failed to save state:', error);
    }
  }

  /**
   * Get current scheduler status (for debugging/admin purposes only)
   */
  static getStatus(): {
    lastMonthlyCheck: string | null;
    nextScheduledCheck: string | null;
    missedChecks: number;
    isDue: boolean;
    maxMissedChecksReached: boolean;
  } {
    const now = new Date();
    const isDue = this.isMonthlyCheckDue(now);
    const maxMissedChecksReached = this.state.missedChecks >= this.MAX_MISSED_CHECKS;

    return {
      lastMonthlyCheck: this.state.lastMonthlyCheck,
      nextScheduledCheck: this.state.nextScheduledCheck,
      missedChecks: this.state.missedChecks,
      isDue,
      maxMissedChecksReached
    };
  }

  /**
   * Reset the scheduler (clear all state)
   */
  static reset(): void {
    this.state = {
      lastMonthlyCheck: null,
      nextScheduledCheck: null,
      missedChecks: 0
    };
    this.saveState();
    console.log('License Scheduler: State reset');
  }

  /**
   * Cleanup scheduler
   */
  static cleanup(): void {
    if (this.checkTimeoutId) {
      clearTimeout(this.checkTimeoutId);
      this.checkTimeoutId = null;
    }
    
    console.log('License Scheduler: Cleaned up');
  }
} 