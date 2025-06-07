import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield, ShieldX, WifiOff } from 'lucide-react';
import { LicenseService } from '../services/LicenseService';

interface LicenseStatusNotificationProps {
  className?: string;
}

const LicenseStatusNotification: React.FC<LicenseStatusNotificationProps> = ({ className = '' }) => {
  const [licenseStatus, setLicenseStatus] = useState<{
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
  } | null>(null);

  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const status = LicenseService.getLicenseStatus();
      setLicenseStatus(status);

      // Show notification for various conditions
      const shouldShow = !status.isValid || 
                        status.status === 'suspended' || 
                        status.isOfflineMode ||
                        (status.expiryDays !== undefined && status.expiryDays <= 7);
      
      setShowNotification(shouldShow);
    };

    // Check immediately
    checkStatus();

    // Check every minute for status changes
    const interval = setInterval(checkStatus, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!showNotification || !licenseStatus) {
    return null;
  }

  // Format time remaining for offline mode
  const formatTimeRemaining = (milliseconds: number): string => {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return 'less than 1 hour';
    }
  };

  const getNotificationContent = () => {
    if (!licenseStatus.isValid) {
      return {
        icon: <ShieldX className="h-5 w-5 text-red-500" />,
        title: 'License Invalid',
        message: 'Your license is not valid. System functionality may be restricted.',
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-800'
      };
    }

    if (licenseStatus.status === 'suspended') {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
        title: 'License Suspended',
        message: `Your license has been suspended. ${licenseStatus.suspendedReason || 'Please contact support.'}`,
        bgColor: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-800'
      };
    }

    if (licenseStatus.isOfflineMode && licenseStatus.offlineInfo) {
      const timeRemaining = formatTimeRemaining(licenseStatus.offlineInfo.gracePeriodRemaining);
      return {
        icon: <WifiOff className="h-5 w-5 text-blue-500" />,
        title: 'Operating in Offline Mode',
        message: `License validated offline. Valid for ${timeRemaining} more. Connect to internet to refresh.`,
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800'
      };
    }

    if (licenseStatus.expiryDays !== undefined && licenseStatus.expiryDays <= 7) {
      const daysText = licenseStatus.expiryDays === 1 ? 'day' : 'days';
      return {
        icon: <Shield className="h-5 w-5 text-yellow-500" />,
        title: 'License Expiring Soon',
        message: `Your license expires in ${licenseStatus.expiryDays} ${daysText}. Please renew to avoid service interruption.`,
        bgColor: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800'
      };
    }

    return null;
  };

  const content = getNotificationContent();
  
  if (!content) {
    return null;
  }

  return (
    <div className={`${content.bgColor} border rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {content.icon}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${content.textColor}`}>
            {content.title}
          </h3>
          <p className={`text-sm mt-1 ${content.textColor}`}>
            {content.message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className={`inline-flex rounded-md p-1.5 ${content.textColor} hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              onClick={() => setShowNotification(false)}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseStatusNotification; 