// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'cashier';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'cashier';
  isActive: boolean;
}

// Product and Inventory Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  quantity: number;
  minStockLevel: number;
  categoryId: string;
  category?: Category;
  isActive: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  quantity: number;
  minStockLevel: number;
  categoryId: string;
  isActive: boolean;
  imageUrl?: string;
}

// Transaction and Sales Types
export interface TransactionItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  type: 'sale' | 'refund' | 'void';
  status: 'pending' | 'completed' | 'cancelled';
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  paymentAmount: number;
  changeAmount: number;
  cashierId: string;
  cashier?: User;
  customerId?: string;
  notes?: string;
  refundedTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

// Report Types
export interface SalesReport {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalSales: number;
  totalTransactions: number;
  totalRefunds: number;
  netSales: number;
  averageTransactionValue: number;
  topProducts: ProductSalesData[];
  salesByHour?: HourlySales[];
  salesByDay?: DailySales[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface HourlySales {
  hour: number;
  sales: number;
  transactions: number;
}

export interface DailySales {
  date: Date;
  sales: number;
  transactions: number;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Backup Types
export interface BackupData {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  fileSize: number;
  createdAt: Date;
  createdBy: string;
  restoredAt?: Date;
  restoredBy?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface SalesFormData {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  paymentMethod: 'cash' | 'card' | 'digital';
  paymentAmount: number;
  customerId?: string;
  notes?: string;
}

// Store State Types
export interface AppState {
  auth: AuthState;
  cart: Cart;
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

// Filter and Search Types
export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'quantity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: 'sale' | 'refund' | 'void';
  status?: 'pending' | 'completed' | 'cancelled';
  cashierId?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Settings Types
export interface AppSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  taxRate: number;
  currency: string;
  receiptMessage?: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lowStockAlert: boolean;
  lowStockThreshold: number;
} 