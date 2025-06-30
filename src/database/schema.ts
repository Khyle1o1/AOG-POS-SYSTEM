import Dexie, { Table } from 'dexie';
import { 
  User, 
  Product, 
  Category, 
  Transaction, 
  ActivityLog
} from '../types';

export interface DatabaseUser extends User {
  // Add any database-specific fields if needed
}

export interface DatabaseProduct extends Product {
  // Add any database-specific fields if needed
}

export interface DatabaseCategory extends Category {
  // Add any database-specific fields if needed
}

export interface DatabaseTransaction extends Transaction {
  // Add any database-specific fields if needed
}

export interface DatabaseActivityLog extends ActivityLog {
  // Add any database-specific fields if needed
}

export interface DatabaseSettings {
  id: string;
  currency: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lowStockAlert: boolean;
  lowStockThreshold: number;
  // Printer settings
  printerSelectedId?: string;
  printerSelectedName?: string;
  printerAutoPrintEnabled: boolean;
  printerPaperWidth: 58 | 80;
  printerEncoding: 'cp437' | 'utf8';
  printerCutType: 'full' | 'partial' | 'none';
  printerCashdrawerEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class POSDatabase extends Dexie {
  // Define tables
  users!: Table<DatabaseUser>;
  products!: Table<DatabaseProduct>;
  categories!: Table<DatabaseCategory>;
  transactions!: Table<DatabaseTransaction>;
  activityLogs!: Table<DatabaseActivityLog>;
  settings!: Table<DatabaseSettings>;

  constructor() {
    super('POSDatabase');
    
    this.version(1).stores({
      users: '&id, username, email, role, isActive, createdAt',
      products: '&id, name, sku, categoryId, isActive, quantity, price, wholesalePrice, wholesaleMinQuantity, createdAt',
      categories: '&id, name, createdAt',
      transactions: '&id, transactionNumber, type, status, cashierId, createdAt, total',
      activityLogs: '&id, userId, action, entity, entityId, createdAt',
      settings: '&id'
    });

    // Add hooks for automatic timestamps
    this.products.hook('creating', function (_primKey, obj: DatabaseProduct, _trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.products.hook('updating', function (modifications: Partial<DatabaseProduct>, _primKey, _obj, _trans) {
      modifications.updatedAt = new Date();
    });

    this.categories.hook('creating', function (_primKey, obj: DatabaseCategory, _trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.categories.hook('updating', function (modifications: Partial<DatabaseCategory>, _primKey, _obj, _trans) {
      modifications.updatedAt = new Date();
    });

    this.users.hook('creating', function (_primKey, obj: DatabaseUser, _trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.users.hook('updating', function (modifications: Partial<DatabaseUser>, _primKey, _obj, _trans) {
      modifications.updatedAt = new Date();
    });

    this.transactions.hook('creating', function (_primKey, obj: DatabaseTransaction, _trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.activityLogs.hook('creating', function (_primKey, obj: DatabaseActivityLog, _trans) {
      obj.createdAt = new Date();
    });
  }
}

export const db = new POSDatabase(); 