// Main database module
export { db } from './schema';
export type { 
  DatabaseUser, 
  DatabaseProduct, 
  DatabaseCategory, 
  DatabaseTransaction, 
  DatabaseActivityLog,
  DatabaseSettings 
} from './schema';

export {
  UserService,
  ProductService,
  CategoryService,
  TransactionService,
  ActivityLogService,
  SettingsService,
  DatabaseService
} from './services';

export { MigrationService } from './migration';

// Initialize database
import { DatabaseService } from './services';
import { MigrationService } from './migration';
import { Product, Category } from '../types';
import { db } from './schema';
import { hashPassword } from '../utils/auth';

// Sample data
const initializeSampleData = async () => {
  console.log('Checking if sample data should be initialized...');
  
  try {
    const { ProductService, CategoryService, UserService, DatabaseService } = await import('./services');
    
    // Check if data was cleared intentionally - if so, don't re-add sample data
    if (DatabaseService.wasDataClearedIntentionally()) {
      console.log('⚠️ Data was cleared intentionally. Skipping sample data initialization.');
      console.log('💡 To restore sample data, use the "Reset Database" option instead of "Clear All Data".');
      return;
    }
    
    // Check if data already exists
    const existingProducts = await ProductService.getAll();
    const existingCategories = await CategoryService.getAll();
    const existingUsers = await UserService.getAll();
    
    if (existingProducts.length > 0 && existingCategories.length > 0 && existingUsers.length > 0) {
      console.log('Sample data already exists, skipping initialization');
      return;
    }

    console.log('Initializing fresh sample data...');

    // Create sample users first
    const users = [
      {
        id: 'user-1',
        username: 'admin',
        email: 'admin@pos.com',
        password: hashPassword('password'), // Hash the default password
        role: 'admin' as const,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        username: 'manager',
        email: 'manager@pos.com',
        password: hashPassword('password'), // Hash the default password
        role: 'manager' as const,
        firstName: 'Manager',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-3',
        username: 'cashier',
        email: 'cashier@pos.com',
        password: hashPassword('password'), // Hash the default password
        role: 'cashier' as const,
        firstName: 'Cashier',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-4',
        username: 'admin123',
        email: 'admin123@pos.com',
        password: hashPassword('adminpassword'), // Custom admin password
        role: 'admin' as const,
        firstName: 'Administrator',
        lastName: 'Account',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create sample categories
    const categories: Category[] = [
      {
        id: 'cat-1',
        name: 'Beverages',
        description: 'Drinks and beverages',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-2',
        name: 'Snacks',
        description: 'Snacks and confectionery',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-3',
        name: 'Dairy',
        description: 'Milk and dairy products',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-4',
        name: 'Bakery',
        description: 'Bread and baked goods',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat-5',
        name: 'Household',
        description: 'Household items and cleaning supplies',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create sample products
    const products: Product[] = [
      {
        id: 'prod-1',
        name: 'Coca-Cola 330ml',
        description: 'Refreshing cola drink',
        sku: 'COKE-330',
        barcode: '123456789012',
        price: 1.50,
        cost: 0.75,
        quantity: 100,
        minStockLevel: 20,
        categoryId: 'cat-1',
        isActive: true,
        imageUrl: '',
        wholesalePrice: 1.20,
        wholesaleMinQuantity: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-2',
        name: 'Pepsi 330ml',
        description: 'Cola soft drink',
        sku: 'PEPSI-330',
        barcode: '123456789013',
        price: 1.45,
        cost: 0.70,
        quantity: 85,
        minStockLevel: 15,
        categoryId: 'cat-1',
        isActive: true,
        imageUrl: '',
        wholesalePrice: 1.15,
        wholesaleMinQuantity: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-3',
        name: 'Lay\'s Potato Chips',
        description: 'Crispy salted potato chips',
        sku: 'LAYS-REG',
        barcode: '123456789014',
        price: 2.25,
        cost: 1.20,
        quantity: 60,
        minStockLevel: 12,
        categoryId: 'cat-2',
        isActive: true,
        imageUrl: '',
        wholesalePrice: 1.80,
        wholesaleMinQuantity: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-4',
        name: 'Banana (per kg)',
        description: 'Fresh yellow bananas',
        sku: 'BANANA-KG',
        barcode: '123456789015',
        price: 2.50,
        cost: 1.50,
        quantity: 45,
        minStockLevel: 10,
        categoryId: 'cat-3',
        isActive: true,
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-5',
        name: 'Whole Milk 1L',
        description: 'Fresh whole milk',
        sku: 'MILK-1L',
        barcode: '123456789016',
        price: 3.50,
        cost: 2.00,
        quantity: 30,
        minStockLevel: 8,
        categoryId: 'cat-3',
        isActive: true,
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-6',
        name: 'White Bread',
        description: 'Fresh white bread loaf',
        sku: 'BREAD-WHT',
        barcode: '123456789017',
        price: 2.75,
        cost: 1.40,
        quantity: 25,
        minStockLevel: 5,
        categoryId: 'cat-4',
        isActive: true,
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-7',
        name: 'Paper Towels',
        description: 'Absorbent paper towels',
        sku: 'PPR-TOWEL',
        barcode: '123456789018',
        price: 4.50,
        cost: 2.25,
        quantity: 40,
        minStockLevel: 10,
        categoryId: 'cat-5',
        isActive: true,
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-8',
        name: 'Orange Juice 1L',
        description: '100% pure orange juice',
        sku: 'OJ-1L',
        barcode: '123456789019',
        price: 4.25,
        cost: 2.50,
        quantity: 35,
        minStockLevel: 8,
        categoryId: 'cat-1',
        isActive: true,
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-9',
        name: 'Cheese Slices',
        description: 'Processed cheese slices',
        sku: 'CHEESE-SLC',
        barcode: '123456789020',
        price: 5.50,
        cost: 3.00,
        quantity: 20,
        minStockLevel: 5,
        categoryId: 'cat-3',
        isActive: true,
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'prod-10',
        name: 'Dish Soap',
        description: 'Liquid dish soap',
        sku: 'SOAP-DISH',
        barcode: '123456789021',
        price: 3.75,
        cost: 1.80,
        quantity: 30,
        minStockLevel: 7,
        categoryId: 'cat-5',
        isActive: true,
        imageUrl: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Use individual operations with error handling instead of bulkAdd
    // This prevents the entire operation from failing if some records already exist
    
    console.log('Adding users...');
    for (const user of users) {
      try {
        await db.users.put(user); // put() will add or update
        console.log(`✓ Added user: ${user.username}`);
      } catch (error) {
        console.log(`⚠ User ${user.username} might already exist, skipping...`);
      }
    }

    console.log('Adding categories...');
    for (const category of categories) {
      try {
        await db.categories.put(category); // put() will add or update
        console.log(`✓ Added category: ${category.name}`);
      } catch (error) {
        console.log(`⚠ Category ${category.name} might already exist, skipping...`);
      }
    }

    console.log('Adding products...');
    for (const product of products) {
      try {
        await db.products.put(product); // put() will add or update
        console.log(`✓ Added product: ${product.name}`);
      } catch (error) {
        console.log(`⚠ Product ${product.name} might already exist, skipping...`);
      }
    }

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
    throw error;
  }
};

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing POS Database...');
    
    // Initialize the database
    await DatabaseService.initialize();
    
    // Check and run migration if needed
    await MigrationService.checkAndMigrate();
    
    // Initialize sample data
    await initializeSampleData();
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
} 