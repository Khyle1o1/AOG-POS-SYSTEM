import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import LicenseActivation from './components/LicenseActivation';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import { useStore } from './store/useStore';
import { initializeDatabase, MigrationService } from './database';
import { createAdmin123User } from './utils/createAdminUser';
import { LicenseService } from './services/LicenseService';
import { RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';

// Component for role-based route protection
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: string[];
  fallbackPath?: string;
}> = ({ children, allowedRoles, fallbackPath = '/sales' }) => {
  const { auth } = useStore();
  
  if (!auth.user?.role || !allowedRoles.includes(auth.user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return <>{children}</>;
};

// Component to handle default route based on user role
const DefaultRoute: React.FC = () => {
  const { auth } = useStore();
  
  // Redirect based on user role
  if (auth.user?.role === 'cashier') {
    return <Navigate to="/sales" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLicensed, setIsLicensed] = useState(false);
  const [checkingLicense, setCheckingLicense] = useState(true);
  const { auth, initializeFromDatabase } = useStore();

  // Wait for Zustand persist hydration
  useEffect(() => {
    const unsubscribe = useStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    
    // Check if already hydrated
    if (useStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    
    return unsubscribe;
  }, []);

  // Check license on app start
  useEffect(() => {
    const checkLicense = async () => {
      try {
        setCheckingLicense(true);
        const licensed = await LicenseService.isLicensed();
        setIsLicensed(licensed);
        
        if (licensed) {
          console.log('License validated successfully');
          // Show license expiry warning if needed
          if (LicenseService.isExpiringSoon()) {
            const daysLeft = LicenseService.getDaysUntilExpiry();
            console.warn(`License expires in ${daysLeft} days`);
          }
        } else {
          console.log('No valid license found');
        }
      } catch (error) {
        console.error('License check failed:', error);
        setIsLicensed(false);
      } finally {
        setCheckingLicense(false);
      }
    };

    if (isHydrated) {
      checkLicense();
    }
  }, [isHydrated]);

  const handleLicenseActivated = () => {
    setIsLicensed(true);
  };

  const initializeApp = async () => {
    try {
      setIsInitializing(true);
      setInitError(null);
      setErrorDetails(null);
      
      console.log('Starting application initialization...');
      
      // Initialize database and run migrations
      await initializeDatabase();
      
      // Then load data into store
      await initializeFromDatabase();
      
      // Create admin123 user
      await createAdmin123User();
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setInitError(`Failed to initialize application: ${errorMessage}`);
      
      if (error instanceof Error) {
        setErrorDetails(error.stack || 'No stack trace available');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, [initializeFromDatabase]);

  const handleResetDatabase = async () => {
    if (!window.confirm('This will reset the database and may fix the error, but all data will be lost. Continue?')) {
      return;
    }

    try {
      setIsInitializing(true);
      setInitError(null);
      setErrorDetails(null);
      
      // Clear the database completely
      await MigrationService.clearDatabase();
      
      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to reinitialize
      await initializeApp();
      
      // If successful, suggest refresh for clean state
      if (!initError) {
        if (window.confirm('Database reset successfully! Refresh the page for a clean start?')) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Failed to reset database:', error);
      setInitError('Failed to reset database. Please try refreshing the page manually.');
      setErrorDetails('If the problem persists, try using a different browser or clearing your browser storage.');
    }
  };

  const handleResetMigration = async () => {
    try {
      setIsInitializing(true);
      setInitError(null);
      MigrationService.resetMigrationFlag();
      await initializeApp();
    } catch (error) {
      console.error('Failed to reset migration:', error);
      setInitError('Failed to reset migration. Please try the database reset option.');
    }
  };

  // Show loading screen during initialization, hydration, or license checking
  if (isInitializing || !isHydrated || checkingLicense) {
    const loadingMessage = !isHydrated 
      ? 'Loading session...' 
      : checkingLicense 
        ? 'Validating license...'
        : 'Setting up database and loading data...';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Initializing POS System
          </h2>
          <p className="text-gray-500">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Initialization Failed
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium mb-2">Error:</p>
            <p className="text-red-700 text-sm mb-3">{initError}</p>
            {errorDetails && (
              <>
                <p className="text-red-800 font-medium mb-2">Details:</p>
                <p className="text-red-700 text-sm">{errorDetails}</p>
              </>
            )}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => initializeApp()}
              className="btn btn-primary w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Initialization
            </button>
            
            {initError.includes('Key already exists') || initError.includes('ConstraintError') ? (
              <div className="space-y-2">
                <button
                  onClick={handleResetMigration}
                  className="btn btn-outline w-full"
                >
                  Reset Migration
                </button>
                <button
                  onClick={handleResetDatabase}
                  className="btn btn-warning w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Database
                </button>
              </div>
            ) : (
              <button
                onClick={handleResetDatabase}
                className="btn btn-danger w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Database
              </button>
            )}
            
            <div className="text-xs text-gray-500 mt-4">
              <p>If the problem persists:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Try using a different browser</li>
                <li>Clear your browser's storage/cache</li>
                <li>Check if you have enough disk space</li>
                <li>Disable browser extensions temporarily</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show license activation screen if not licensed
  if (!isLicensed) {
    return <LicenseActivation onActivated={handleLicenseActivated} />;
  }

  return (
    <Router>
      {!auth.isAuthenticated ? (
        <Login />
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<DefaultRoute />} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Dashboard /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><Sales /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Inventory /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><Reports /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Settings /></ProtectedRoute>} />
            <Route path="*" element={<DefaultRoute />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
};

export default App; 