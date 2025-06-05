import React from 'react';
import { Settings as SettingsIcon, Save, Download, Upload, Database } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useForm } from 'react-hook-form';

interface SettingsFormData {
  storeName: string;
  currency: string;
}

const Settings: React.FC = () => {
  const { settings, updateSettings, auth, transactions, products, users } = useStore();
  
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

  const onSubmit = (data: SettingsFormData) => {
    // Force currency to be PHP
    updateSettings({ ...data, currency: 'PHP' });
    alert('Settings saved successfully!');
  };

  const exportData = () => {
    const data = {
      settings,
      transactions,
      products,
      users: users.map(u => ({ ...u, password: undefined })), // Remove passwords
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (window.confirm('This will overwrite all current data. Are you sure?')) {
          // In a real implementation, you would validate the data structure
          // and update each store section accordingly
          console.log('Import data:', data);
          alert('Data import feature would be implemented here');
        }
      } catch (error) {
        alert('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('This will delete ALL data including transactions, products, and users. This action cannot be undone. Are you sure?')) {
      if (window.confirm('Final confirmation: This will permanently delete everything. Type "DELETE" to confirm.')) {
        // In a real implementation, you would clear all store data
        alert('Data clearing would be implemented here');
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
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Upload className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium text-gray-900">Import Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Restore data from a backup file
              </p>
              <label className="btn btn-outline w-full cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
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