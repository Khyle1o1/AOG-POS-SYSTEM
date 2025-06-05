import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Info, 
  CheckCircle,
  AlertCircle,
  BarChart3,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { 
  DatabaseService, 
  MigrationService 
} from '../database';

const DatabaseManagement: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadStats = async () => {
    try {
      const dbStats = await DatabaseService.getStats();
      setStats(dbStats);
      
      const migStatus = MigrationService.getMigrationStatus();
      setMigrationStatus(migStatus);
    } catch (error) {
      console.error('Failed to load database stats:', error);
      showNotification('error', 'Failed to load database statistics');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleBackup = async () => {
    try {
      setLoading(true);
      const backup = await DatabaseService.backup();
      
      // Create download link
      const url = URL.createObjectURL(backup);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('success', 'Database backup created successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      showNotification('error', 'Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      if (!window.confirm('This will replace all current data. Are you sure you want to restore from backup?')) {
        return;
      }

      const text = await file.text();
      await DatabaseService.restore(text);
      
      // Reload stats after restore
      await loadStats();
      
      showNotification('success', 'Database restored successfully');
    } catch (error) {
      console.error('Restore failed:', error);
      showNotification('error', 'Failed to restore database. Please check the backup file.');
    } finally {
      setLoading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('This will delete ALL data permanently. This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!window.confirm('Last chance! This will permanently delete all products, transactions, users, and settings. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      await DatabaseService.clearAll();
      await loadStats();
      showNotification('info', 'Database cleared successfully');
    } catch (error) {
      console.error('Clear failed:', error);
      showNotification('error', 'Failed to clear database');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('This will completely reset the database and clear all data. This fixes most database errors but cannot be undone. Continue?')) {
      return;
    }

    if (!window.confirm('Final warning: This will delete everything and reset the database to factory state. Proceed?')) {
      return;
    }

    try {
      setLoading(true);
      await MigrationService.clearDatabase();
      await loadStats();
      showNotification('success', 'Database reset successfully. Please refresh the page.');
      
      // Suggest page refresh
      setTimeout(() => {
        if (window.confirm('Database has been reset. Refresh the page to reinitialize the system?')) {
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error('Reset failed:', error);
      showNotification('error', 'Failed to reset database');
    } finally {
      setLoading(false);
    }
  };

  const handleResetMigrationFlag = () => {
    try {
      MigrationService.resetMigrationFlag();
      loadStats();
      showNotification('info', 'Migration flag reset. Refresh the page to trigger migration check.');
    } catch (error) {
      console.error('Failed to reset migration flag:', error);
      showNotification('error', 'Failed to reset migration flag');
    }
  };

  const handleForceMigration = async () => {
    if (!window.confirm('This will clear the database and re-run migration. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      await MigrationService.forceMigration();
      await loadStats();
      showNotification('success', 'Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      showNotification('error', 'Migration failed. Try resetting the database instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSampleData = async () => {
    if (!window.confirm('This will add sample data (users, products, categories) to your database. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      
      // Clear the intentional clearing flag to allow sample data
      DatabaseService.clearIntentionalClearingFlag();
      
      // Reinitialize the database which will add sample data
      const { initializeDatabase } = await import('../database');
      await initializeDatabase();
      
      await loadStats();
      showNotification('success', 'Sample data restored successfully');
    } catch (error) {
      console.error('Failed to restore sample data:', error);
      showNotification('error', 'Failed to restore sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg shadow-sm ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5 mr-2" />
            ) : (
              <Info className="h-5 w-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Error Troubleshooting Banner */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-yellow-800 font-medium mb-2">Database Troubleshooting</h3>
            <p className="text-yellow-700 text-sm mb-3">
              If you're experiencing issues like "Key already exists" errors, database corruption, or initialization failures, try these solutions:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetMigrationFlag}
                className="btn btn-sm btn-outline text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                disabled={loading}
              >
                Reset Migration Flag
              </button>
              <button
                onClick={handleResetDatabase}
                className="btn btn-sm btn-warning"
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Database
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
          <p className="text-gray-500">Manage your local database, backups, and migrations</p>
        </div>
        
        <button
          onClick={loadStats}
          className="btn btn-outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Database Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats && Object.entries(stats).map(([key, value]) => (
          <div key={key} className="card text-center">
            <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{value as number}</div>
            <div className="text-sm text-gray-500 capitalize">{key}</div>
          </div>
        ))}
      </div>

      {/* Migration Status */}
      {migrationStatus && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Migration Status
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              {migrationStatus.migrationCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
              )}
              <div>
                <div className="font-medium">Migration Status</div>
                <div className="text-sm text-gray-500">
                  {migrationStatus.migrationCompleted ? 'Completed' : 'Pending'}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <div className="font-medium">Legacy Data</div>
                <div className="text-sm text-gray-500">
                  {migrationStatus.hasLegacyData ? 'Found' : 'None'}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
              <div>
                <div className="font-medium">Legacy Records</div>
                <div className="text-sm text-gray-500">
                  {migrationStatus.legacyDataSize} items
                </div>
              </div>
            </div>
          </div>

          {!migrationStatus.migrationCompleted && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 text-sm">
                Migration is not complete. You can force a re-migration if needed.
              </p>
              <button
                onClick={handleForceMigration}
                className="mt-2 btn btn-sm btn-warning"
                disabled={loading}
              >
                Force Migration
              </button>
            </div>
          )}
        </div>
      )}

      {/* Database Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup & Restore */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Backup & Restore
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Create a backup of all your data including products, transactions, users, and settings.
              </p>
              <button
                onClick={handleBackup}
                className="btn btn-primary w-full"
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Create Backup
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-3">
                Restore your data from a backup file. This will replace all current data.
              </p>
              <label className="btn btn-outline w-full cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Restore from Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Database Maintenance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Maintenance
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Clear all data from the database. This action cannot be undone.
              </p>
              <button
                onClick={handleClearAll}
                className="btn btn-danger w-full"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-3">
                Restore sample data (demo users, products, and categories) to get started.
              </p>
              <button
                onClick={handleRestoreSampleData}
                className="btn btn-secondary w-full"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Restore Sample Data
              </button>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Database Info</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Type: IndexedDB (Dexie.js)</div>
                <div>Browser: Local Storage</div>
                <div>Persistence: Offline Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement; 