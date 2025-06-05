import { 
  UserService, 
  ProductService, 
  CategoryService, 
  TransactionService, 
  ActivityLogService,
  SettingsService,
  DatabaseService 
} from './services';
import { DatabaseSettings } from './schema';
import { db } from './schema';

interface LegacyStoreData {
  auth?: any;
  products?: any[];
  categories?: any[];
  transactions?: any[];
  users?: any[];
  settings?: any;
  activityLogs?: any[];
}

export class MigrationService {
  private static readonly LEGACY_STORAGE_KEY = 'pos-store';
  private static readonly MIGRATION_FLAG_KEY = 'pos-migrated-to-db';

  static async checkAndMigrate(): Promise<void> {
    // Check if migration has already been completed
    const migrationCompleted = localStorage.getItem(this.MIGRATION_FLAG_KEY);
    if (migrationCompleted === 'true') {
      console.log('Migration already completed, skipping...');
      return;
    }

    // Check if there's legacy data to migrate
    const legacyData = this.getLegacyData();
    if (!legacyData || this.isLegacyDataEmpty(legacyData)) {
      console.log('No legacy data found, marking migration as complete');
      this.markMigrationComplete();
      return;
    }

    console.log('Starting migration from localStorage to IndexedDB...');
    
    try {
      await this.migrateLegacyData(legacyData);
      this.markMigrationComplete();
      this.backupLegacyData();
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private static getLegacyData(): LegacyStoreData | null {
    try {
      const data = localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return parsed.state || parsed; // Handle different storage formats
    } catch (error) {
      console.error('Failed to parse legacy data:', error);
      return null;
    }
  }

  private static isLegacyDataEmpty(data: LegacyStoreData): boolean {
    return (
      (!data.users || data.users.length === 0) &&
      (!data.products || data.products.length === 0) &&
      (!data.categories || data.categories.length === 0) &&
      (!data.transactions || data.transactions.length === 0)
    );
  }

  private static async migrateLegacyData(legacyData: LegacyStoreData): Promise<void> {
    console.log('Migrating legacy data:', {
      users: legacyData.users?.length || 0,
      products: legacyData.products?.length || 0,
      categories: legacyData.categories?.length || 0,
      transactions: legacyData.transactions?.length || 0,
      activityLogs: legacyData.activityLogs?.length || 0
    });

    // Use database transaction for consistency
    await db.transaction('rw', [db.users, db.products, db.categories, db.transactions, db.activityLogs, db.settings], async () => {
      
      // Migrate categories first (dependencies)
      if (legacyData.categories && legacyData.categories.length > 0) {
        for (const category of legacyData.categories) {
          try {
            const existingCategory = await db.categories.get(category.id);
            if (!existingCategory) {
              await db.categories.add({
                ...category,
                createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
                updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
              });
            } else {
              console.log(`Category ${category.id} already exists, skipping...`);
            }
          } catch (error) {
            console.error('Failed to migrate category:', category.id, error);
            // Continue with other categories
          }
        }
        console.log(`Processed ${legacyData.categories.length} categories`);
      }

      // Migrate users
      if (legacyData.users && legacyData.users.length > 0) {
        for (const user of legacyData.users) {
          try {
            const existingUser = await db.users.get(user.id);
            if (!existingUser) {
              await db.users.add({
                ...user,
                createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
                updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
                lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
              });
            } else {
              console.log(`User ${user.id} already exists, skipping...`);
            }
          } catch (error) {
            console.error('Failed to migrate user:', user.id, error);
            // Continue with other users
          }
        }
        console.log(`Processed ${legacyData.users.length} users`);
      }

      // Migrate products
      if (legacyData.products && legacyData.products.length > 0) {
        for (const product of legacyData.products) {
          try {
            const existingProduct = await db.products.get(product.id);
            if (!existingProduct) {
              await db.products.add({
                ...product,
                createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
                updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
              });
            } else {
              console.log(`Product ${product.id} already exists, skipping...`);
            }
          } catch (error) {
            console.error('Failed to migrate product:', product.id, error);
            // Continue with other products
          }
        }
        console.log(`Processed ${legacyData.products.length} products`);
      }

      // Migrate transactions
      if (legacyData.transactions && legacyData.transactions.length > 0) {
        for (const transaction of legacyData.transactions) {
          try {
            const existingTransaction = await db.transactions.get(transaction.id);
            if (!existingTransaction) {
              await db.transactions.add({
                ...transaction,
                createdAt: transaction.createdAt ? new Date(transaction.createdAt) : new Date(),
                updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt) : new Date(),
              });
            } else {
              console.log(`Transaction ${transaction.id} already exists, skipping...`);
            }
          } catch (error) {
            console.error('Failed to migrate transaction:', transaction.id, error);
            // Continue with other transactions
          }
        }
        console.log(`Processed ${legacyData.transactions.length} transactions`);
      }

      // Migrate activity logs
      if (legacyData.activityLogs && legacyData.activityLogs.length > 0) {
        for (const log of legacyData.activityLogs) {
          try {
            const existingLog = await db.activityLogs.get(log.id);
            if (!existingLog) {
              await db.activityLogs.add({
                ...log,
                createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
              });
            } else {
              console.log(`Activity log ${log.id} already exists, skipping...`);
            }
          } catch (error) {
            console.error('Failed to migrate activity log:', log.id, error);
            // Continue with other logs
          }
        }
        console.log(`Processed ${legacyData.activityLogs.length} activity logs`);
      }

      // Migrate settings
      if (legacyData.settings) {
        try {
          const existingSettings = await db.settings.get('migrated');
          if (!existingSettings) {
            const dbSettings: DatabaseSettings = {
              id: 'migrated',
              currency: 'PHP',
              storeName: legacyData.settings.storeName || 'My Store',
              storeAddress: legacyData.settings.storeAddress,
              storePhone: legacyData.settings.storePhone,
              storeEmail: legacyData.settings.storeEmail,
              autoBackup: legacyData.settings.autoBackup || false,
              backupFrequency: legacyData.settings.backupFrequency || 'daily',
              lowStockAlert: legacyData.settings.lowStockAlert !== undefined ? legacyData.settings.lowStockAlert : true,
              lowStockThreshold: legacyData.settings.lowStockThreshold || 5,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            await db.settings.add(dbSettings);
            console.log('Migrated settings');
          } else {
            console.log('Settings already exist, skipping...');
          }
        } catch (error) {
          console.error('Failed to migrate settings:', error);
        }
      }
    });
  }

  private static markMigrationComplete(): void {
    localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true');
  }

  private static backupLegacyData(): void {
    try {
      const legacyData = localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (legacyData) {
        const backupKey = `${this.LEGACY_STORAGE_KEY}-backup-${Date.now()}`;
        localStorage.setItem(backupKey, legacyData);
        
        // Optionally remove the original legacy data
        // localStorage.removeItem(this.LEGACY_STORAGE_KEY);
        
        console.log(`Legacy data backed up to ${backupKey}`);
      }
    } catch (error) {
      console.error('Failed to backup legacy data:', error);
    }
  }

  // Utility method to force re-migration (for development/testing)
  static async forceMigration(): Promise<void> {
    try {
      console.log('Forcing migration: clearing database and migration flag');
      localStorage.removeItem(this.MIGRATION_FLAG_KEY);
      await DatabaseService.clearAll();
      await this.checkAndMigrate();
    } catch (error) {
      console.error('Force migration failed:', error);
      throw error;
    }
  }

  // Utility method to reset migration status (for debugging)
  static resetMigrationFlag(): void {
    localStorage.removeItem(this.MIGRATION_FLAG_KEY);
    console.log('Migration flag reset. Next app load will trigger migration check.');
  }

  // Utility method to export current database to legacy format
  static async exportToLegacyFormat(): Promise<string> {
    const data = {
      users: await UserService.getAll(),
      products: await ProductService.getAll(),
      categories: await CategoryService.getAll(),
      transactions: await TransactionService.getAll(),
      activityLogs: await ActivityLogService.getAll(),
      settings: await SettingsService.get(),
    };

    return JSON.stringify({ state: data }, null, 2);
  }

  // Get migration status
  static getMigrationStatus(): {
    migrationCompleted: boolean;
    hasLegacyData: boolean;
    legacyDataSize: number;
  } {
    const migrationCompleted = localStorage.getItem(this.MIGRATION_FLAG_KEY) === 'true';
    const legacyData = this.getLegacyData();
    const hasLegacyData = legacyData && !this.isLegacyDataEmpty(legacyData);
    
    let legacyDataSize = 0;
    if (legacyData) {
      legacyDataSize = (
        (legacyData.users?.length || 0) +
        (legacyData.products?.length || 0) +
        (legacyData.categories?.length || 0) +
        (legacyData.transactions?.length || 0) +
        (legacyData.activityLogs?.length || 0)
      );
    }

    return {
      migrationCompleted,
      hasLegacyData: !!hasLegacyData,
      legacyDataSize,
    };
  }

  // Clear existing database completely (for troubleshooting)
  static async clearDatabase(): Promise<void> {
    try {
      console.log('🧹 Starting complete database and localStorage cleanup...');
      
      // Step 1: Close the database connection if open
      if (db.isOpen()) {
        console.log('📱 Closing database connection...');
        db.close();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for close
      }
      
      // Step 2: Delete the entire IndexedDB database
      console.log('🗑️ Deleting IndexedDB database...');
      await db.delete();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for deletion
      
      // Step 3: Clear ALL localStorage items (more aggressive)
      console.log('🧹 Clearing ALL localStorage...');
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allKeys.push(key);
        }
      }
      
      // Remove all keys that could be related to our app
      allKeys.forEach(key => {
        if (key.includes('pos') || key.includes('store') || key.includes('auth') || 
            key.includes('migration') || key.includes('database')) {
          console.log(`🗑️ Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Step 4: Clear specific known keys (belt and suspenders approach)
      const specificKeys = [
        this.MIGRATION_FLAG_KEY,
        this.LEGACY_STORAGE_KEY,
        'pos-auth-storage',
        'pos-store',
        'pos-migrated-to-db',
        'pos-data-cleared-intentionally', // Clear the intentional clearing flag
        'react-pos-store', // Potential old key
        'zustand-store', // Potential old key
        'posSystemStore' // Potential old key
      ];
      
      specificKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared specific key: ${key}`);
      });
      
      // Step 5: Clear any potential cache or session storage
      try {
        sessionStorage.clear();
        console.log('🧹 Cleared sessionStorage');
      } catch (e) {
        console.warn('Could not clear sessionStorage:', e);
      }
      
      // Step 6: Wait a moment for cleanup to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 7: Re-open database with fresh schema
      console.log('🔄 Re-opening database with fresh schema...');
      await db.open();
      
      // Step 8: Verify the database is completely empty
      const userCount = await db.users.count();
      const productCount = await db.products.count();
      const categoryCount = await db.categories.count();
      const transactionCount = await db.transactions.count();
      const activityLogCount = await db.activityLogs.count();
      
      console.log('✅ Database cleared successfully');
      console.log(`📊 Verification - Users: ${userCount}, Products: ${productCount}, Categories: ${categoryCount}, Transactions: ${transactionCount}, Logs: ${activityLogCount}`);
      
      if (userCount > 0 || productCount > 0 || categoryCount > 0) {
        console.warn('⚠️ Warning: Some data still exists after clearing. Attempting force clear...');
        
        // Force clear tables individually with explicit deletes
        await db.transaction('rw', [db.users, db.products, db.categories, db.transactions, db.activityLogs, db.settings], async () => {
          // Clear all records one by one to handle any constraint issues
          const allUsers = await db.users.toArray();
          for (const user of allUsers) {
            await db.users.delete(user.id);
          }
          
          const allProducts = await db.products.toArray();
          for (const product of allProducts) {
            await db.products.delete(product.id);
          }
          
          const allCategories = await db.categories.toArray();
          for (const category of allCategories) {
            await db.categories.delete(category.id);
          }
          
          const allTransactions = await db.transactions.toArray();
          for (const transaction of allTransactions) {
            await db.transactions.delete(transaction.id);
          }
          
          const allLogs = await db.activityLogs.toArray();
          for (const log of allLogs) {
            await db.activityLogs.delete(log.id);
          }
          
          await db.settings.clear();
        });
        
        console.log('🔧 Force clear completed');
        
        // Final verification
        const finalUserCount = await db.users.count();
        const finalProductCount = await db.products.count();
        const finalCategoryCount = await db.categories.count();
        console.log(`🔍 Final verification - Users: ${finalUserCount}, Products: ${finalProductCount}, Categories: ${finalCategoryCount}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to clear database:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Database clear failed: ${errorMessage}`);
    }
  }
} 