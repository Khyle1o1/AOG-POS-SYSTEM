import React from 'react';
import { Settings as SettingsIcon, Save, Download, Upload, Database, Shield, Key, AlertCircle, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useForm } from 'react-hook-form';
import { DatabaseService } from '../database/services';
import { LicenseService, LicenseInfo } from '../services/LicenseService';

interface SettingsFormData {
  storeName: string;
  currency: string;
}

const Settings: React.FC = () => {
  const { settings, updateSettings, auth, transactions, products, users, initializeFromDatabase } = useStore();
  
  const [licenseInfo, setLicenseInfo] = React.useState<LicenseInfo | null>(null);
  const [licenseExpiry, setLicenseExpiry] = React.useState<number | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SettingsFormData>({
    defaultValues: {
      storeName: settings.storeName,
      currency: 'PHP',
    }
  });

  // Load license info on component mount
  React.useEffect(() => {
    const loadLicenseInfo = () => {
      const info = LicenseService.getLicenseInfo();
      setLicenseInfo(info);
      
      const days = LicenseService.getDaysUntilExpiry();
      setLicenseExpiry(days);
    };

    loadLicenseInfo();
  }, []);

  const handleDeactivateLicense = () => {
    if (window.confirm('Are you sure you want to deactivate this license? The application will require reactivation to continue working.')) {
      LicenseService.deactivateLicense();
      alert('License deactivated successfully. The application will now restart.');
      window.location.reload();
    }
  };

  const onSubmit = (data: SettingsFormData) => {
    // Force currency to be PHP
    updateSettings({ ...data, currency: 'PHP' });
    alert('Settings saved successfully!');
  };

  const exportData = async () => {
    try {
      const blob = await DatabaseService.backup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON backup file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        
        // Validate that it's valid JSON
        const data = JSON.parse(jsonData);
        
        // Basic validation of backup file structure
        if (!data.version || (!data.users && !data.products && !data.transactions)) {
          alert('Invalid backup file format. This does not appear to be a valid POS backup file.');
          return;
        }
        
        if (window.confirm('This will overwrite all current data including transactions, products, and users. This action cannot be undone. Are you sure?')) {
          try {
            // Show loading state (you might want to add a loading indicator here)
            await DatabaseService.restore(jsonData);
            
            // Refresh all store data from the database
            await initializeFromDatabase();
            
            alert('Data imported successfully! All data has been restored from the backup.');
          } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import data. The backup file may be corrupted or incompatible.');
          }
        }
      } catch (error) {
        console.error('Failed to parse backup file:', error);
        alert('Invalid backup file format. Please select a valid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = async () => {
    if (window.confirm('This will delete ALL data including transactions, products, and users. This action cannot be undone. Are you sure?')) {
      if (window.confirm('Final confirmation: This will permanently delete everything. Are you sure you want to proceed?')) {
        try {
          await DatabaseService.clearAll();
          
          // Refresh all store data from the database
          await initializeFromDatabase();
          
          alert('All data has been successfully cleared.');
        } catch (error) {
          console.error('Clear data failed:', error);
          alert('Failed to clear data. Please try again.');
        }
      }
    }
  };

  const canManageSettings = auth.user?.role === 'admin' || auth.user?.role === 'manager';

  if (!canManageSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <SettingsIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to manage settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your POS system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name *
              </label>
              <input
                {...register('storeName', { required: 'Store name is required' })}
                className="input"
                placeholder="Enter store name"
              />
              {errors.storeName && (
                <p className="mt-1 text-sm text-red-600">{errors.storeName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency *
              </label>
              <select
                {...register('currency', { required: 'Currency is required' })}
                className="input"
                disabled
              >
                <option value="PHP">PHP - Philippine Peso</option>
              </select>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </form>
        </div>

        {/* System Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Products:</span>
              <span className="font-medium">{products.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-medium">{transactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Users:</span>
              <span className="font-medium">{users.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current User:</span>
              <span className="font-medium">{auth.user?.firstName} {auth.user?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">User Role:</span>
              <span className="font-medium capitalize">{auth.user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* License Information */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">License Information</h2>
        </div>
        
        {licenseInfo ? (
          <div className="space-y-4">
            {/* License Status */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">License Active</span>
              </div>
              <span className="text-green-600 text-sm">Valid & Activated</span>
            </div>

            {/* Expiry Warning */}
            {licenseExpiry !== null && licenseExpiry <= 30 && licenseExpiry > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 text-sm">
                  License expires in {licenseExpiry} day{licenseExpiry !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* License Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                <p className="text-sm text-gray-900">{licenseInfo.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-sm text-gray-900">{licenseInfo.customerEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Expires</label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-sm text-gray-900">
                    {licenseInfo.expiryDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Features</label>
                <p className="text-sm text-gray-900">{licenseInfo.features.join(', ')}</p>
              </div>
            </div>

            {/* License Key */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">License Key</label>
              <div className="flex items-center">
                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex-1 mr-2">
                  <p className="text-sm text-gray-900 font-mono break-all">
                    {licenseInfo.licenseKey}
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(licenseInfo.licenseKey)}
                  className="btn btn-outline text-xs px-3 py-2"
                  title="Copy license key"
                >
                  <Key className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Actions */}
            {auth.user?.role === 'admin' && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleDeactivateLicense}
                  className="btn btn-danger text-sm"
                >
                  Deactivate License
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Deactivating the license will require reactivation to use the system.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No license information available</p>
            <p className="text-sm text-gray-400">This should not happen if the app is running.</p>
          </div>
        )}
      </div>

      {/* Data Management */}
      {auth.user?.role === 'admin' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Data */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Download className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-gray-900">Export Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Download a backup of all your data
              </p>
              <button
                onClick={exportData}
                className="btn btn-outline w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Backup
              </button>
            </div>

            {/* Import Data */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors duration-200">
              <div className="flex items-center mb-2">
                <Upload className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium text-gray-900">Import Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Restore data from a backup file
              </p>
              
              {/* Custom File Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="backup-file-input"
                />
                <label 
                  htmlFor="backup-file-input"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-green-300 rounded-lg cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-200"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="h-6 w-6 text-green-600 mb-2" />
                    <p className="text-sm font-medium text-green-800">Click to upload</p>
                    <p className="text-xs text-green-600">JSON files only</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Clear Data */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center mb-2">
                <Database className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="font-medium text-red-900">Clear All Data</h3>
              </div>
              <p className="text-sm text-red-700 mb-3">
                Permanently delete all system data
              </p>
              <button
                onClick={clearAllData}
                className="btn btn-danger w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                Clear Data
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Always create regular backups of your data. The clear data operation is irreversible 
                    and will permanently delete all transactions, products, and user data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 