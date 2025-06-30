import { 
  db, 
  DatabaseSettings 
} from './schema';
import { 
  User, 
  Product, 
  Category, 
  Transaction, 
  ActivityLog 
} from '../types';

// Helper function to ensure numeric fields are numbers
const normalizeProduct = (product: any): Product => {
  return {
    ...product,
    name: product.name || '',
    description: product.description || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    categoryId: product.categoryId || '',
    imageUrl: product.imageUrl || '',
    price: Number(product.price) || 0,
    cost: Number(product.cost) || 0,
    quantity: Number(product.quantity) || 0,
    minStockLevel: Number(product.minStockLevel) || 0,
    wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined,
    wholesaleMinQuantity: product.wholesaleMinQuantity ? Number(product.wholesaleMinQuantity) : undefined,
    isActive: Boolean(product.isActive),
    createdAt: product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt),
    updatedAt: product.updatedAt instanceof Date ? product.updatedAt : new Date(product.updatedAt),
  };
};

// User Services
export class UserService {
  static async getAll(): Promise<User[]> {
    return await db.users.orderBy('createdAt').reverse().toArray();
  }

  static async getById(id: string): Promise<User | undefined> {
    return await db.users.get(id);
  }

  static async getByUsername(username: string): Promise<User | undefined> {
    return await db.users.where('username').equals(username).first();
  }

  static async create(user: User): Promise<string> {
    return await db.users.add(user);
  }

  static async update(id: string, updates: Partial<User>): Promise<number> {
    return await db.users.update(id, updates);
  }

  static async delete(id: string): Promise<void> {
    await db.users.delete(id);
  }

  static async getActiveUsers(): Promise<User[]> {
    return await db.users.where('isActive').equals(1).toArray();
  }
}

// Product Services
export class ProductService {
  static async getAll(): Promise<Product[]> {
    const products = await db.products.orderBy('name').toArray();
    return products.map(normalizeProduct);
  }

  static async getById(id: string): Promise<Product | undefined> {
    const product = await db.products.get(id);
    return product ? normalizeProduct(product) : undefined;
  }

  static async getBySKU(sku: string): Promise<Product | undefined> {
    const products = await db.products.toArray();
    const product = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
    return product ? normalizeProduct(product) : undefined;
  }

  static async create(product: Product): Promise<string> {
    return await db.products.add(product);
  }

  static async update(id: string, updates: Partial<Product>): Promise<number> {
    return await db.products.update(id, updates);
  }

  static async delete(id: string): Promise<void> {
    await db.products.delete(id);
  }

  static async getByCategory(categoryId: string): Promise<Product[]> {
    const products = await db.products.where('categoryId').equals(categoryId).toArray();
    return products.map(normalizeProduct);
  }

  static async getActiveProducts(): Promise<Product[]> {
    const products = await db.products.where('isActive').equals(1).toArray();
    return products.map(normalizeProduct);
  }

  static async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const products = await db.products.toArray();
    return products
      .map(normalizeProduct)
      .filter(p => p.quantity <= (threshold || p.minStockLevel));
  }

  static async getOutOfStockProducts(): Promise<Product[]> {
    const products = await db.products.where('quantity').equals(0).toArray();
    return products.map(normalizeProduct);
  }

  static async updateStock(id: string, quantityChange: number): Promise<number> {
    const product = await db.products.get(id);
    if (!product) throw new Error('Product not found');
    
    const normalizedProduct = normalizeProduct(product);
    const newQuantity = Math.max(0, normalizedProduct.quantity + quantityChange);
    return await db.products.update(id, { quantity: newQuantity });
  }

  static async searchProducts(searchTerm: string): Promise<Product[]> {
    const term = searchTerm.toLowerCase();
    const products = await db.products
      .filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.description ? p.description.toLowerCase().includes(term) : false)
      )
      .toArray();
    return products.map(normalizeProduct);
  }
}

// Category Services
export class CategoryService {
  static async getAll(): Promise<Category[]> {
    return await db.categories.orderBy('name').toArray();
  }

  static async getById(id: string): Promise<Category | undefined> {
    return await db.categories.get(id);
  }

  static async create(category: Category): Promise<string> {
    return await db.categories.add(category);
  }

  static async update(id: string, updates: Partial<Category>): Promise<number> {
    return await db.categories.update(id, updates);
  }

  static async delete(id: string): Promise<void> {
    // Check if any products use this category
    const productsCount = await db.products.where('categoryId').equals(id).count();
    if (productsCount > 0) {
      throw new Error(`Cannot delete category. ${productsCount} products are using this category.`);
    }
    await db.categories.delete(id);
  }

  static async getCategoryWithProductCount(): Promise<(Category & { productCount: number })[]> {
    const categories = await db.categories.toArray();
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await db.products.where('categoryId').equals(category.id).count();
        return { ...category, productCount };
      })
    );
    return categoriesWithCount;
  }
}

// Transaction Services
export class TransactionService {
  static async getAll(): Promise<Transaction[]> {
    return await db.transactions.orderBy('createdAt').reverse().toArray();
  }

  static async getById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  }

  static async create(transaction: Transaction): Promise<string> {
    return await db.transactions.add(transaction);
  }

  static async update(id: string, updates: Partial<Transaction>): Promise<number> {
    return await db.transactions.update(id, updates);
  }

  static async delete(id: string): Promise<void> {
    await db.transactions.delete(id);
  }

  static async getByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db.transactions
      .where('createdAt')
      .between(startDate, endDate)
      .reverse()
      .toArray();
  }

  static async getByCashier(cashierId: string): Promise<Transaction[]> {
    return await db.transactions
      .where('cashierId')
      .equals(cashierId)
      .reverse()
      .toArray();
  }

  static async getByType(type: 'sale' | 'refund' | 'void'): Promise<Transaction[]> {
    return await db.transactions
      .where('type')
      .equals(type)
      .reverse()
      .toArray();
  }

  static async getTodayTransactions(): Promise<Transaction[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return await this.getByDateRange(startOfDay, endOfDay);
  }

  static async getSalesStats(startDate: Date, endDate: Date) {
    const transactions = await this.getByDateRange(startDate, endDate);
    const sales = transactions.filter(t => t.type === 'sale' && t.status === 'completed');
    
    return {
      totalSales: sales.reduce((sum, t) => sum + t.total, 0),
      totalTransactions: sales.length,
      averageTransaction: sales.length > 0 ? sales.reduce((sum, t) => sum + t.total, 0) / sales.length : 0,
      totalRefunds: transactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.total, 0),
    };
  }
}

// Activity Log Services
export class ActivityLogService {
  static async getAll(): Promise<ActivityLog[]> {
    return await db.activityLogs.orderBy('createdAt').reverse().toArray();
  }

  static async create(log: ActivityLog): Promise<string> {
    return await db.activityLogs.add(log);
  }

  static async getByUser(userId: string): Promise<ActivityLog[]> {
    return await db.activityLogs
      .where('userId')
      .equals(userId)
      .reverse()
      .toArray();
  }

  static async getByEntity(entity: string, entityId?: string): Promise<ActivityLog[]> {
    let query = db.activityLogs.where('entity').equals(entity);
    if (entityId) {
      query = query.and(log => log.entityId === entityId);
    }
    return await query.reverse().toArray();
  }

  static async getRecent(limit: number = 100): Promise<ActivityLog[]> {
    return await db.activityLogs
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  static async cleanup(keepDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    
    return await db.activityLogs
      .where('createdAt')
      .below(cutoffDate)
      .delete();
  }
}

// Settings Services
export class SettingsService {
  static async get(): Promise<DatabaseSettings | undefined> {
    return await db.settings.orderBy('id').first();
  }

  static async create(settings: DatabaseSettings): Promise<string> {
    return await db.settings.add(settings);
  }

  static async update(updates: Partial<DatabaseSettings>): Promise<number> {
    const existing = await this.get();
    if (!existing) {
      throw new Error('Settings not found');
    }
    return await db.settings.update(existing.id, updates);
  }

  static async getOrCreate(): Promise<DatabaseSettings> {
    let settings = await this.get();
    if (!settings) {
      const defaultSettings: DatabaseSettings = {
        id: 'default',
        currency: 'PHP',
        storeName: 'My Store',
        autoBackup: false,
        backupFrequency: 'daily',
        lowStockAlert: true,
        lowStockThreshold: 5,
        // Printer settings defaults
        printerAutoPrintEnabled: false,
        printerPaperWidth: 58,
        printerEncoding: 'utf8',
        printerCutType: 'partial',
        printerCashdrawerEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.create(defaultSettings);
      settings = defaultSettings;
    }
    return settings;
  }

  // Convert database settings to application format
  static dbToAppFormat(dbSettings: DatabaseSettings) {
    return {
      currency: dbSettings.currency,
      storeName: dbSettings.storeName,
      printerSettings: {
        selectedPrinterId: dbSettings.printerSelectedId,
        selectedPrinterName: dbSettings.printerSelectedName,
        autoPrintEnabled: dbSettings.printerAutoPrintEnabled,
        paperWidth: dbSettings.printerPaperWidth,
        encoding: dbSettings.printerEncoding,
        cutType: dbSettings.printerCutType,
        cashdrawerEnabled: dbSettings.printerCashdrawerEnabled
      }
    };
  }

  // Convert application settings to database format
  static appToDbFormat(appSettings: any): Partial<DatabaseSettings> {
    const dbUpdate: Partial<DatabaseSettings> = {};
    
    if (appSettings.currency !== undefined) {
      dbUpdate.currency = appSettings.currency;
    }
    
    if (appSettings.storeName !== undefined) {
      dbUpdate.storeName = appSettings.storeName;
    }
    
    if (appSettings.printerSettings) {
      const ps = appSettings.printerSettings;
      if (ps.selectedPrinterId !== undefined) dbUpdate.printerSelectedId = ps.selectedPrinterId;
      if (ps.selectedPrinterName !== undefined) dbUpdate.printerSelectedName = ps.selectedPrinterName;
      if (ps.autoPrintEnabled !== undefined) dbUpdate.printerAutoPrintEnabled = ps.autoPrintEnabled;
      if (ps.paperWidth !== undefined) dbUpdate.printerPaperWidth = ps.paperWidth;
      if (ps.encoding !== undefined) dbUpdate.printerEncoding = ps.encoding;
      if (ps.cutType !== undefined) dbUpdate.printerCutType = ps.cutType;
      if (ps.cashdrawerEnabled !== undefined) dbUpdate.printerCashdrawerEnabled = ps.cashdrawerEnabled;
    }
    
    dbUpdate.updatedAt = new Date();
    return dbUpdate;
  }
}

// Database Management Services
export class DatabaseService {
  static async initialize(): Promise<void> {
    try {
      await db.open();
      console.log('Database initialized successfully');
      
      // Ensure default settings exist
      await SettingsService.getOrCreate();
      
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  static async backup(): Promise<Blob> {
    const data = {
      users: await UserService.getAll(),
      products: await ProductService.getAll(),
      categories: await CategoryService.getAll(),
      transactions: await TransactionService.getAll(),
      activityLogs: await ActivityLogService.getAll(),
      settings: await SettingsService.get(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  static async restore(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      // Clear existing data
      await db.transaction('rw', [db.users, db.products, db.categories, db.transactions, db.activityLogs, db.settings], async () => {
        await db.users.clear();
        await db.products.clear();
        await db.categories.clear();
        await db.transactions.clear();
        await db.activityLogs.clear();
        await db.settings.clear();

        // Restore data
        if (data.users) await db.users.bulkAdd(data.users);
        if (data.products) await db.products.bulkAdd(data.products);
        if (data.categories) await db.categories.bulkAdd(data.categories);
        if (data.transactions) await db.transactions.bulkAdd(data.transactions);
        if (data.activityLogs) await db.activityLogs.bulkAdd(data.activityLogs);
        if (data.settings) await db.settings.add(data.settings);
      });

      console.log('Database restored successfully');
    } catch (error) {
      console.error('Failed to restore database:', error);
      throw new Error('Invalid backup file or restore failed');
    }
  }

  static async clearAll(): Promise<void> {
    await db.transaction('rw', [db.users, db.products, db.categories, db.transactions, db.activityLogs], async () => {
      await db.users.clear();
      await db.products.clear();
      await db.categories.clear();
      await db.transactions.clear();
      await db.activityLogs.clear();
    });
    
    // Keep settings but reset to defaults
    await SettingsService.getOrCreate();
    
    // Set a flag to prevent sample data from being re-initialized
    localStorage.setItem('pos-data-cleared-intentionally', 'true');
    console.log('All data cleared successfully. Sample data will not be re-initialized on reload.');
  }

  // Check if data was cleared intentionally
  static wasDataClearedIntentionally(): boolean {
    return localStorage.getItem('pos-data-cleared-intentionally') === 'true';
  }

  // Clear the intentional clearing flag (called when user wants sample data back)
  static clearIntentionalClearingFlag(): void {
    localStorage.removeItem('pos-data-cleared-intentionally');
  }

  static async getStats() {
    return {
      users: await db.users.count(),
      products: await db.products.count(),
      categories: await db.categories.count(),
      transactions: await db.transactions.count(),
      activityLogs: await db.activityLogs.count(),
    };
  }
} 