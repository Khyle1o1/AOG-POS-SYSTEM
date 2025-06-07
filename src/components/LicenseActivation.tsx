import React, { useState } from 'react';
import { LicenseService } from '../services/LicenseService';
import { Key, AlertCircle, CheckCircle, Loader, Shield, Copy, ExternalLink } from 'lucide-react';

interface LicenseActivationProps {
  onActivated: () => void;
}

const LicenseActivation: React.FC<LicenseActivationProps> = ({ onActivated }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationInfo, setValidationInfo] = useState<any>(null);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setLoading(true);
    setError(null);
    setValidationInfo(null);

    try {
      // First validate the license key
      const validation = await LicenseService.validateLicenseKey(licenseKey.trim());
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid license key');
        return;
      }

      setValidationInfo(validation.info);

      // Then activate it
      const result = await LicenseService.activateLicense(licenseKey.trim());
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onActivated();
        }, 2000);
      } else {
        setError(result.error || 'Failed to activate license');
      }
    } catch (err) {
      console.error('License activation error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatLicenseKey = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const formatted = clean.replace(/(.{5})/g, '$1-').slice(0, -1);
    setLicenseKey(formatted);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && licenseKey.trim()) {
      handleActivate();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">License Activated Successfully!</h2>
          <p className="text-gray-600 mb-6">Your POS system is now licensed and ready to use.</p>
          
          {validationInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">License Details:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Customer:</span> {validationInfo.customerName}</p>
                <p><span className="font-medium">Email:</span> {validationInfo.customerEmail}</p>
                <p><span className="font-medium">Expires:</span> {validationInfo.expiryDate.toLocaleDateString()}</p>
                <p><span className="font-medium">Features:</span> {validationInfo.features.join(', ')}</p>
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            Loading your POS system...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Activate POS System</h1>
          <p className="text-gray-600">Enter your license key to unlock the software</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 text-sm font-medium">Activation Failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {validationInfo && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-700 text-sm font-medium">License Validated</p>
                <p className="text-green-600 text-sm mt-1">
                  Valid license for {validationInfo.customerName} ({validationInfo.customerEmail})
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="license" className="block text-sm font-medium text-gray-700 mb-2">
              License Key *
            </label>
            <input
              id="license"
              type="text"
              value={licenseKey}
              onChange={(e) => formatLicenseKey(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg tracking-wider"
              disabled={loading}
              maxLength={29} // 5 groups of 5 characters + 4 dashes
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the license key provided to you
            </p>
          </div>

          <button
            onClick={handleActivate}
            disabled={loading || !licenseKey.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Activating License...
              </>
            ) : (
              <>
                <Key className="h-5 w-5 mr-2" />
                Activate License
              </>
            )}
          </button>
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 mb-4">Need help with activation?</p>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <button
                onClick={() => copyToClipboard('support@aogtech.com')}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Email
              </button>
              <button
                onClick={() => window.open('mailto:support@aogtech.com?subject=POS License Support')}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            <p className="mb-2">POS System v1.0.0 by AOG Tech</p>
            <p>© 2024 AOG Tech. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseActivation; 