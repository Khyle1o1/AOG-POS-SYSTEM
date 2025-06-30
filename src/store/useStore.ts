import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  User, 
  Product, 
  Category, 
  Transaction, 
  Cart, 
  CartItem, 
  AuthState,
  ActivityLog,
  PrinterSettings,
  BluetoothPrinter,
  PrinterStatus 
} from '@/types';
import {
  UserService,
  ProductService,
  CategoryService,
  TransactionService,
  ActivityLogService,
  SettingsService
} from '../database/services';

interface StoreState {
  // Authentication (still in memory for security)
  auth: AuthState;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;

  // Cart Management (in memory)
  cart: Cart;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (amount: number) => void;

  // Products and Inventory (database-backed)
  products: Product[];
  categories: Category[];
  loadProducts: () => Promise<void>;
  loadCategories: () => Promise<void>;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateStock: (productId: string, quantity: number) => Promise<void>;

  // Category Management
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (categoryId: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Transactions (database-backed)
  transactions: Transaction[];
  loadTransactions: () => Promise<void>;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => Promise<void>;

  // Users (database-backed)
  users: User[];
  loadUsers: () => Promise<void>;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => Promise<void>;
  updateUserData: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Activity Logs (database-backed)
  activityLogs: ActivityLog[];
  loadActivityLogs: () => Promise<void>;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => Promise<void>;

  // UI State
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Settings (database-backed)
  settings: {
    currency: string;
    storeName: string;
    printerSettings: PrinterSettings;
  };
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<StoreState['settings']>) => Promise<void>;

  // Bluetooth Printer Management
  printerStatus: PrinterStatus;
  availablePrinters: BluetoothPrinter[];
  connectedPrinter: BluetoothPrinter | null;
  setPrinterStatus: (status: PrinterStatus) => void;
  setAvailablePrinters: (printers: BluetoothPrinter[]) => void;
  setConnectedPrinter: (printer: BluetoothPrinter | null) => void;
  scanForPrinters: () => Promise<BluetoothPrinter[]>;
  connectToPrinter: (printer: BluetoothPrinter) => Promise<void>;
  disconnectPrinter: () => Promise<void>;
  testPrint: () => Promise<void>;
  updatePrinterSettings: (settings: Partial<PrinterSettings>) => Promise<void>;

  // Initialize all data from database
  initializeFromDatabase: () => Promise<void>;
}

// Helper function to calculate wholesale pricing
const getEffectivePrice = (product: Product, quantity: number): number => {
  if (
    product.wholesalePrice && 
    product.wholesaleMinQuantity && 
    quantity >= product.wholesaleMinQuantity
  ) {
    return product.wholesalePrice;
  }
  return product.price;
};

const calculateCartTotals = (items: CartItem[], discount: number = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  
  return {
    subtotal,
    tax: 0, // Tax is now always 0
    discount: discountAmount,
    total
  };
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Authentication
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
      },
      
      login: (user, token) => {
        set({
          auth: {
            user,
            token,
            isAuthenticated: true,
          }
        });
        
        // Log the login activity
        get().addActivityLog({
          userId: user.id,
          action: 'LOGIN',
          entity: 'USER',
          entityId: user.id,
          details: { username: user.username }
        });
      },

      logout: () => {
        const currentUser = get().auth.user;
        if (currentUser) {
          get().addActivityLog({
            userId: currentUser.id,
            action: 'LOGOUT',
            entity: 'USER',
            entityId: currentUser.id,
            details: { username: currentUser.username }
          });
        }
        
        set({
          auth: {
            user: null,
            token: null,
            isAuthenticated: false,
          }
        });
        
        // Clear cart on logout for security
        set({
          cart: {
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0,
          }
        });
      },

      updateUser: (user) => {
        set((state) => ({
          auth: {
            ...state.auth,
            user,
          }
        }));
      },

      // Cart Management
      cart: {
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
      },

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.cart.items.find(item => item.product.id === product.id);
          let newItems: CartItem[];

          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            const effectivePrice = getEffectivePrice(product, newQuantity);
            
            newItems = state.cart.items.map(item =>
              item.product.id === product.id
                ? {
                    ...item,
                    quantity: newQuantity,
                    unitPrice: effectivePrice,
                    totalPrice: newQuantity * effectivePrice
                  }
                : item
            );
          } else {
            const effectivePrice = getEffectivePrice(product, quantity);
            const newItem: CartItem = {
              product,
              quantity,
              unitPrice: effectivePrice,
              totalPrice: quantity * effectivePrice,
            };
            newItems = [...state.cart.items, newItem];
          }

          const totals = calculateCartTotals(newItems, state.cart.discount);

          return {
            cart: {
              items: newItems,
              ...totals,
            }
          };
        });
      },

      removeFromCart: (productId) => {
        set((state) => {
          const newItems = state.cart.items.filter(item => item.product.id !== productId);
          const totals = calculateCartTotals(newItems, state.cart.discount);

          return {
            cart: {
              items: newItems,
              ...totals,
            }
          };
        });
      },

      updateCartItem: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            get().removeFromCart(productId);
            return state;
          }

          const newItems = state.cart.items.map(item => {
            if (item.product.id === productId) {
              const effectivePrice = getEffectivePrice(item.product, quantity);
              return {
                ...item,
                quantity,
                unitPrice: effectivePrice,
                totalPrice: quantity * effectivePrice
              };
            }
            return item;
          });

          const totals = calculateCartTotals(newItems, state.cart.discount);

          return {
            cart: {
              items: newItems,
              ...totals,
            }
          };
        });
      },

      clearCart: () => {
        set({
          cart: {
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0,
          }
        });
      },

      applyDiscount: (discountPercent) => {
        set((state) => {
          const totals = calculateCartTotals(state.cart.items, discountPercent);
          return {
            cart: {
              ...state.cart,
              ...totals,
            }
          };
        });
      },

      // Products and Inventory
      products: [],
      categories: [],

      loadProducts: async () => {
        try {
          const products = await ProductService.getAll();
          set({ products });
        } catch (error) {
          console.error('Failed to load products:', error);
          set({ error: 'Failed to load products' });
        }
      },

      loadCategories: async () => {
        try {
          const categories = await CategoryService.getAll();
          set({ categories });
        } catch (error) {
          console.error('Failed to load categories:', error);
          set({ error: 'Failed to load categories' });
        }
      },

      setProducts: (products) => set({ products }),
      setCategories: (categories) => set({ categories }),

      addProduct: async (product) => {
        try {
          await ProductService.create(product);
          await get().loadProducts(); // Refresh from database
          
          const currentUser = get().auth.user;
          if (currentUser) {
            await get().addActivityLog({
              userId: currentUser.id,
              action: 'CREATE',
              entity: 'PRODUCT',
              entityId: product.id,
              details: { name: product.name, sku: product.sku }
            });
          }
        } catch (error) {
          console.error('Failed to add product:', error);
          throw error;
        }
      },

      updateProduct: async (productId, updates) => {
        try {
          await ProductService.update(productId, updates);
          await get().loadProducts(); // Refresh from database

          const currentUser = get().auth.user;
          if (currentUser) {
            await get().addActivityLog({
              userId: currentUser.id,
              action: 'UPDATE',
              entity: 'PRODUCT',
              entityId: productId,
              details: updates
            });
          }
        } catch (error) {
          console.error('Failed to update product:', error);
          throw error;
        }
      },

      deleteProduct: async (productId) => {
        try {
          const product = get().products.find(p => p.id === productId);
          await ProductService.delete(productId);
          await get().loadProducts(); // Refresh from database

          const currentUser = get().auth.user;
          if (currentUser && product) {
            await get().addActivityLog({
              userId: currentUser.id,
              action: 'DELETE',
              entity: 'PRODUCT',
              entityId: productId,
              details: { name: product.name, sku: product.sku }
            });
          }
        } catch (error) {
          console.error('Failed to delete product:', error);
          throw error;
        }
      },

      updateStock: async (productId, quantity) => {
        try {
          await ProductService.updateStock(productId, quantity);
          await get().loadProducts(); // Refresh from database
        } catch (error) {
          console.error('Failed to update stock:', error);
          throw error;
        }
      },

      // Category Management
      addCategory: async (category) => {
        try {
          await CategoryService.create(category);
          await get().loadCategories(); // Refresh from database

          const currentUser = get().auth.user;
          if (currentUser) {
            await get().addActivityLog({
              userId: currentUser.id,
              action: 'CREATE',
              entity: 'CATEGORY',
              entityId: category.id,
              details: { name: category.name }
            });
          }
        } catch (error) {
          console.error('Failed to add category:', error);
          throw error;
        }
      },

      updateCategory: async (categoryId, updates) => {
        try {
          await CategoryService.update(categoryId, updates);
          await get().loadCategories(); // Refresh from database

          const currentUser = get().auth.user;
          if (currentUser) {
            await get().addActivityLog({
              userId: currentUser.id,
              action: 'UPDATE',
              entity: 'CATEGORY',
              entityId: categoryId,
              details: updates
            });
          }
        } catch (error) {
          console.error('Failed to update category:', error);
          throw error;
        }
      },

      deleteCategory: async (categoryId) => {
        try {
          const category = get().categories.find(c => c.id === categoryId);
          await CategoryService.delete(categoryId);
          await get().loadCategories(); // Refresh from database

          const currentUser = get().auth.user;
          if (currentUser && category) {
            await get().addActivityLog({
              userId: currentUser.id,
              action: 'DELETE',
              entity: 'CATEGORY',
              entityId: categoryId,
              details: { name: category.name }
            });
          }
        } catch (error) {
          console.error('Failed to delete category:', error);
          throw error;
        }
      },

      // Transactions
      transactions: [],

      loadTransactions: async () => {
        try {
          const transactions = await TransactionService.getAll();
          set({ transactions });
        } catch (error) {
          console.error('Failed to load transactions:', error);
          set({ error: 'Failed to load transactions' });
        }
      },

      setTransactions: (transactions) => set({ transactions }),

      addTransaction: async (transaction) => {
        try {
          await TransactionService.create(transaction);
          await get().loadTransactions(); // Refresh from database

          // Update stock for each item in the transaction
          for (const item of transaction.items) {
            if (transaction.type === 'sale') {
              await get().updateStock(item.productId, -item.quantity);
            } else if (transaction.type === 'refund') {
              await get().updateStock(item.productId, item.quantity);
            }
          }

          const currentUser = get().auth.user;
          if (currentUser) {
            await get().addActivityLog({
              userId: currentUser.id,
              action: 'CREATE',
              entity: 'TRANSACTION',
              entityId: transaction.id,
              details: {
                type: transaction.type,
                total: transaction.total,
                itemCount: transaction.items.length
              }
            });
          }
        } catch (error) {
          console.error('Failed to add transaction:', error);
          throw error;
        }
      },

      updateTransaction: async (transactionId, updates) => {
        try {
          await TransactionService.update(transactionId, updates);
          await get().loadTransactions(); // Refresh from database
        } catch (error) {
          console.error('Failed to update transaction:', error);
          throw error;
        }
      },

      // Users
      users: [],

      loadUsers: async () => {
        try {
          const users = await UserService.getAll();
          set({ users });
        } catch (error) {
          console.error('Failed to load users:', error);
          set({ error: 'Failed to load users' });
        }
      },

      setUsers: (users) => set({ users }),

      addUser: async (user) => {
        try {
          await UserService.create(user);
          await get().loadUsers(); // Refresh from database
        } catch (error) {
          console.error('Failed to add user:', error);
          throw error;
        }
      },

      updateUserData: async (userId, updates) => {
        try {
          await UserService.update(userId, updates);
          await get().loadUsers(); // Refresh from database
        } catch (error) {
          console.error('Failed to update user:', error);
          throw error;
        }
      },

      deleteUser: async (userId) => {
        try {
          await UserService.delete(userId);
          await get().loadUsers(); // Refresh from database
        } catch (error) {
          console.error('Failed to delete user:', error);
          throw error;
        }
      },

      // Activity Logs
      activityLogs: [],

      loadActivityLogs: async () => {
        try {
          const activityLogs = await ActivityLogService.getAll();
          set({ activityLogs });
        } catch (error) {
          console.error('Failed to load activity logs:', error);
          set({ error: 'Failed to load activity logs' });
        }
      },

      addActivityLog: async (log) => {
        try {
          const newLog: ActivityLog = {
            ...log,
            id: Date.now().toString(),
            createdAt: new Date(),
          };

          await ActivityLogService.create(newLog);
          // Don't refresh logs automatically to avoid performance issues
        } catch (error) {
          console.error('Failed to add activity log:', error);
        }
      },

      // UI State
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Settings
      settings: {
        currency: 'PHP',
        storeName: 'My Store',
        printerSettings: {
          autoPrintEnabled: false,
          paperWidth: 58,
          encoding: 'utf8',
          cutType: 'partial',
          cashdrawerEnabled: false
        }
      },

      loadSettings: async () => {
        try {
          const dbSettings = await SettingsService.getOrCreate();
          const appSettings = SettingsService.dbToAppFormat(dbSettings);
          set({ settings: appSettings });
        } catch (error) {
          console.error('Failed to load settings:', error);
          set({ error: 'Failed to load settings' });
        }
      },

      updateSettings: async (newSettings) => {
        try {
          const dbUpdates = SettingsService.appToDbFormat(newSettings);
          await SettingsService.update(dbUpdates);
          await get().loadSettings(); // Refresh from database
        } catch (error) {
          console.error('Failed to update settings:', error);
          throw error;
        }
      },

      // Bluetooth Printer Management
      printerStatus: {
        connected: false,
        printing: false
      },
      availablePrinters: [],
      connectedPrinter: null,
      
      setPrinterStatus: (status) => set({ printerStatus: status }),
      setAvailablePrinters: (printers) => set({ availablePrinters: printers }),
      setConnectedPrinter: (printer) => set({ connectedPrinter: printer }),
      
      scanForPrinters: async () => {
        try {
          const { BluetoothPrinterService } = await import('../services/BluetoothPrinterService');
          const printerService = BluetoothPrinterService.getInstance();
          const printers = await printerService.scanForPrinters();
          get().setAvailablePrinters(printers);
          return printers;
        } catch (error) {
          console.error('Failed to scan for printers:', error);
          throw error;
        }
      },
      
      connectToPrinter: async (printer) => {
        try {
          const { BluetoothPrinterService } = await import('../services/BluetoothPrinterService');
          const printerService = BluetoothPrinterService.getInstance();
          
          // Subscribe to status updates
          printerService.onStatusChange((status) => {
            get().setPrinterStatus(status);
          });
          
          await printerService.connectToPrinter(printer);
          get().setConnectedPrinter(printer);
          
          // Save printer selection
          await get().updatePrinterSettings({
            selectedPrinterId: printer.id,
            selectedPrinterName: printer.name
          });
        } catch (error) {
          console.error('Failed to connect to printer:', error);
          throw error;
        }
      },
      
      disconnectPrinter: async () => {
        try {
          const { BluetoothPrinterService } = await import('../services/BluetoothPrinterService');
          const printerService = BluetoothPrinterService.getInstance();
          await printerService.disconnect();
          get().setConnectedPrinter(null);
        } catch (error) {
          console.error('Failed to disconnect printer:', error);
          throw error;
        }
      },
      
      testPrint: async () => {
        try {
          const { BluetoothPrinterService } = await import('../services/BluetoothPrinterService');
          const printerService = BluetoothPrinterService.getInstance();
          await printerService.testPrint();
        } catch (error) {
          console.error('Test print failed:', error);
          throw error;
        }
      },
      
      updatePrinterSettings: async (newSettings) => {
        try {
          const currentSettings = get().settings;
          const updatedPrinterSettings = { ...currentSettings.printerSettings, ...newSettings };
          await get().updateSettings({ 
            printerSettings: updatedPrinterSettings 
          });
        } catch (error) {
          console.error('Failed to update printer settings:', error);
          throw error;
        }
      },

      // Initialize all data from database
      initializeFromDatabase: async () => {
        set({ loading: true, error: null });
        try {
          await Promise.all([
            get().loadSettings(),
            get().loadCategories(),
            get().loadProducts(),
            get().loadUsers(),
            get().loadTransactions(),
          ]);
          console.log('Store initialized from database successfully');
        } catch (error) {
          console.error('Failed to initialize store from database:', error);
          set({ error: 'Failed to initialize application data' });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'pos-auth-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
        auth: state.auth 
      }), // only persist the auth state, not the entire store
    }
  )
); 