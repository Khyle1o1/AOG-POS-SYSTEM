import React from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
  RefreshCw,
  FolderPlus,
  Archive,
  Scan,
  X,
  Folder,
  Upload,
  Camera
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Product, ProductFormData, Category } from '../types';
import { useForm } from 'react-hook-form';
import BarcodeScanner from '../components/BarcodeScanner/BarcodeScanner';
import { formatCurrency } from '../utils/currency';

interface CategoryFormData {
  name: string;
  description?: string;
}

const Inventory: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    auth
  } = useStore();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [sortField, setSortField] = React.useState<'name' | 'price' | 'quantity' | 'category'>('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  const [stockFilter, setStockFilter] = React.useState<'all' | 'low' | 'out'>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = React.useState(false);
  const [notification, setNotification] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>();

  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategory,
    formState: { errors: categoryErrors, isSubmitting: isSubmittingCategory }
  } = useForm<CategoryFormData>();

  // Watch SKU field for validation
  const watchedSKU = watch('sku');

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setValue('imageUrl', result);
    };
    reader.readAsDataURL(file);
  };

  // Clear selected image
  const clearImage = () => {
    setImagePreview(null);
    setValue('imageUrl', '');
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
      
      // Stock filter
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = product.quantity <= product.minStockLevel && product.quantity > 0;
      } else if (stockFilter === 'out') {
        matchesStock = product.quantity === 0;
      }

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = product.isActive;
      } else if (statusFilter === 'inactive') {
        matchesStatus = !product.isActive;
      }

      return matchesSearch && matchesCategory && matchesStock && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'category':
          const categoryA = categories.find(c => c.id === a.categoryId)?.name || '';
          const categoryB = categories.find(c => c.id === b.categoryId)?.name || '';
          comparison = categoryA.localeCompare(categoryB);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel && p.quantity > 0);
  const outOfStockProducts = products.filter(p => p.quantity === 0);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const validateSKU = (sku: string): boolean => {
    // SKU validation - should be alphanumeric, 3-50 characters
    const cleanSKU = sku.trim();
    return cleanSKU.length >= 3 && cleanSKU.length <= 50 && /^[A-Za-z0-9\-_]+$/.test(cleanSKU);
  };

  const checkSKUExists = (sku: string, excludeId?: string): boolean => {
    return products.some(p => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== excludeId);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setImagePreview(product.imageUrl || null);
      reset({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        barcode: product.barcode || '',
        price: product.price,
        cost: product.cost,
        quantity: product.quantity,
        minStockLevel: product.minStockLevel,
        categoryId: product.categoryId,
        isActive: product.isActive,
        imageUrl: product.imageUrl || '',
        wholesalePrice: product.wholesalePrice || undefined,
        wholesaleMinQuantity: product.wholesaleMinQuantity || undefined,
      });
    } else {
      setEditingProduct(null);
      setImagePreview(null);
      reset({
        name: '',
        description: '',
        sku: '',
        barcode: '',
        price: 0,
        cost: 0,
        quantity: 0,
        minStockLevel: 5,
        categoryId: categories[0]?.id || '',
        isActive: true,
        imageUrl: '',
        wholesalePrice: undefined,
        wholesaleMinQuantity: undefined,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImagePreview(null);
    reset();
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);

      // Validate SKU
      if (!validateSKU(data.sku)) {
        showNotification('error', 'Invalid SKU format. Must be 3-50 alphanumeric characters (letters, numbers, hyphens, underscores).');
        return;
      }

      // Check for duplicate SKU
      if (checkSKUExists(data.sku, editingProduct?.id)) {
        showNotification('error', 'SKU already exists. Please use a different SKU.');
        return;
      }

      // Clean SKU (trim whitespace)
      const cleanedData = {
        ...data,
        sku: data.sku.trim().toUpperCase(),
        barcode: data.barcode || data.sku.trim().toUpperCase(),
      };

      if (editingProduct) {
        updateProduct(editingProduct.id, {
          ...cleanedData,
          updatedAt: new Date(),
        });
        showNotification('success', 'Product updated successfully!');
      } else {
        const newProduct: Product = {
          ...cleanedData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addProduct(newProduct);
        showNotification('success', 'Product added successfully!');
      }
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('error', 'Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        deleteProduct(product.id);
        showNotification('success', 'Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('error', 'Failed to delete product. Please try again.');
      }
    }
  };

  const handleBulkAction = (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedProducts.length === 0) return;

    const confirmMessage = 
      action === 'delete' 
        ? `Are you sure you want to delete ${selectedProducts.length} selected products?`
        : `Are you sure you want to ${action} ${selectedProducts.length} selected products?`;

    if (window.confirm(confirmMessage)) {
      selectedProducts.forEach(productId => {
        if (action === 'delete') {
          deleteProduct(productId);
        } else {
          updateProduct(productId, { 
            isActive: action === 'activate',
            updatedAt: new Date()
          });
        }
      });
      setSelectedProducts([]);
      showNotification('success', `Bulk ${action} completed successfully!`);
    }
  };

  const handleBarcodeScanned = (sku: string) => {
    // Clean the SKU
    const cleanSKU = sku.trim().toUpperCase();
    
    // Find product by SKU
    const product = products.find(p => p.sku.toUpperCase() === cleanSKU || p.barcode === sku);
    
    if (product) {
      // Open the product for editing
      openModal(product);
      showNotification('success', `Found product: ${product.name}`);
    } else {
      // Pre-fill SKU in new product form
      openModal();
      setValue('sku', cleanSKU);
      setValue('barcode', cleanSKU);
      showNotification('success', 'New product form opened with scanned SKU');
    }
    
    setShowBarcodeScanner(false);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Quantity', 'Min Stock', 'Status'];
    const csvData = filteredProducts.map(product => {
      const category = categories.find(c => c.id === product.categoryId)?.name || 'N/A';
      return [
        product.name,
        product.sku,
        category,
        product.price.toFixed(2),
        product.cost.toFixed(2),
        product.quantity,
        product.minStockLevel,
        product.isActive ? 'Active' : 'Inactive'
      ];
    });

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    showNotification('success', 'Inventory exported to CSV successfully!');
  };

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      resetCategory({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      resetCategory({
        name: '',
        description: '',
      });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    resetCategory();
  };

  const onSubmitCategory = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        updateCategory(editingCategory.id, {
          ...data,
          updatedAt: new Date(),
        });
        showNotification('success', 'Category updated successfully!');
      } else {
        const newCategory: Category = {
          ...data,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addCategory(newCategory);
        showNotification('success', 'Category added successfully!');
      }
      closeCategoryModal();
    } catch (error) {
      console.error('Error saving category:', error);
      showNotification('error', 'Failed to save category. Please try again.');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const productsCount = products.filter(p => p.categoryId === category.id).length;
      if (productsCount > 0) {
        if (!window.confirm(`This category contains ${productsCount} products. Are you sure you want to delete it? You'll need to reassign those products to other categories first.`)) {
          return;
        }
        showNotification('error', `Cannot delete category. ${productsCount} products are using this category. Please reassign them first.`);
        return;
      }

      if (window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
        deleteCategory(category.id);
        showNotification('success', 'Category deleted successfully!');
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showNotification('error', error.message || 'Failed to delete category. Please try again.');
    }
  };

  const canEdit = auth.user?.role === 'admin' || auth.user?.role === 'manager';
  const canDelete = auth.user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500">Manage your products and stock levels</p>
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
            <span>Total: {products.length}</span>
            <span>Active: {products.filter(p => p.isActive).length}</span>
            <span>Low Stock: {lowStockProducts.length}</span>
            <span>Out of Stock: {outOfStockProducts.length}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {canEdit && (
            <>
              <button 
                onClick={() => openCategoryModal()}
                className="btn btn-outline"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Manage Categories
              </button>
              <button 
                onClick={exportToCSV}
                className="btn btn-outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => openModal()}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lowStockProducts.length > 0 && (
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              <div>
                <h3 className="text-orange-800 font-medium">Low Stock Alert</h3>
                <p className="text-orange-700 text-sm">
                  {lowStockProducts.length} product(s) are running low on stock
                </p>
              </div>
            </div>
          </div>
        )}

        {outOfStockProducts.length > 0 && (
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center">
              <Archive className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-red-800 font-medium">Out of Stock</h3>
                <p className="text-red-700 text-sm">
                  {outOfStockProducts.length} product(s) are out of stock
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="btn btn-outline flex items-center"
                  title="Scan SKU"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Scan SKU
                </button>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="input"
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={() => {
                  setSelectedCategory('');
                  setStockFilter('all');
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="btn btn-outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && canEdit && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 font-medium">
              {selectedProducts.length} product(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="btn btn-outline btn-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="btn btn-outline btn-sm"
              >
                Deactivate
              </button>
              {canDelete && (
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {canEdit && (
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  </th>
                )}
                <th 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Product
                    {sortField === 'name' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>SKU</th>
                <th 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Category
                    {sortField === 'category' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Price
                    {sortField === 'price' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>Cost</th>
                <th 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    Stock
                    {sortField === 'quantity' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const category = categories.find(c => c.id === product.categoryId);
                const isLowStock = product.quantity <= product.minStockLevel && product.quantity > 0;
                const isOutOfStock = product.quantity === 0;
                
                return (
                  <tr key={product.id} className={`
                    ${isOutOfStock ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : ''}
                    ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}
                  `}>
                    {canEdit && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-mono">{product.sku}</span>
                    </td>
                    <td>
                      <span className="text-sm">{category?.name || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="font-medium">{formatCurrency(product.price)}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">{formatCurrency(product.cost)}</span>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <span className={`font-medium ${
                          isOutOfStock ? 'text-red-600' : 
                          isLowStock ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {product.quantity}
                        </span>
                        {(isLowStock || isOutOfStock) && (
                          <AlertTriangle className={`h-4 w-4 ml-1 ${
                            isOutOfStock ? 'text-red-500' : 'text-orange-500'
                          }`} />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {product.minStockLevel}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(product)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
              {(searchTerm || selectedCategory || stockFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setStockFilter('all');
                    setStatusFilter('all');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-full overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Category Management</h3>
                <button
                  onClick={closeCategoryModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Add/Edit Category Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h4>
                
                <form onSubmit={handleSubmitCategory(onSubmitCategory)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name *
                      </label>
                      <input
                        {...registerCategory('name', { 
                          required: 'Category name is required',
                          minLength: { value: 2, message: 'Category name must be at least 2 characters' }
                        })}
                        className="input"
                        placeholder="Enter category name"
                      />
                      {categoryErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{categoryErrors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        {...registerCategory('description')}
                        className="input"
                        placeholder="Enter category description (optional)"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          resetCategory({ name: '', description: '' });
                        }}
                        className="btn btn-outline"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmittingCategory}
                    >
                      {isSubmittingCategory ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      {editingCategory ? 'Update Category' : 'Add Category'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Existing Categories</h4>
                
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No categories found</p>
                    <p className="text-sm text-gray-400">Add your first category above</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(category => {
                      const productsCount = products.filter(p => p.categoryId === category.id).length;
                      
                      return (
                        <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{category.name}</h5>
                              {category.description && (
                                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                {productsCount} product{productsCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => openCategoryModal(category)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit Category"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete Category"
                                disabled={productsCount > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={closeCategoryModal}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-full overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image Upload Section */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  
                  <div className="space-y-3">
                    {/* Image Preview/Upload Area */}
                    <div className="relative">
                      <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group">
                        {imagePreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <button
                                type="button"
                                onClick={clearImage}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-lg"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <label className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                                <div className="bg-white bg-opacity-90 rounded-lg px-3 py-2 flex items-center space-x-2 text-gray-700 hover:bg-opacity-100 transition-all duration-200">
                                  <Upload className="h-4 w-4" />
                                  <span className="text-sm font-medium">Change Image</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-600 transition-colors duration-200">
                            <Camera className="h-12 w-12 mb-3" />
                            <p className="text-sm font-medium mb-1">Click to upload image</p>
                            <p className="text-xs text-gray-400">or drag and drop</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Upload Button (Alternative) - Only show when no image */}
                    {!imagePreview && (
                      <label className="btn btn-outline w-full cursor-pointer flex items-center justify-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* File Info */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Supported formats: JPG, PNG, GIF
                      </p>
                      <p className="text-xs text-gray-400">
                        Maximum file size: 5MB
                      </p>
                    </div>

                    {/* Hidden input for form submission */}
                    <input
                      {...register('imageUrl')}
                      type="hidden"
                    />
                  </div>
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      {...register('name', { 
                        required: 'Product name is required',
                        minLength: { value: 2, message: 'Product name must be at least 2 characters' }
                      })}
                      className="input"
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      {...register('sku', { 
                        required: 'SKU is required',
                        minLength: { value: 3, message: 'SKU must be at least 3 characters' },
                        maxLength: { value: 50, message: 'SKU must be no more than 50 characters' },
                        pattern: {
                          value: /^[A-Za-z0-9\-_]+$/,
                          message: 'SKU can only contain letters, numbers, hyphens, and underscores'
                        },
                        validate: {
                          unique: (value) => {
                            if (checkSKUExists(value, editingProduct?.id)) {
                              return 'SKU already exists';
                            }
                            return true;
                          }
                        }
                      })}
                      className="input"
                      placeholder="Enter SKU (e.g., PROD-001, SKU123)"
                      maxLength={50}
                    />
                    {errors.sku && (
                      <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                    )}
                    {watchedSKU && !validateSKU(watchedSKU) && (
                      <p className="mt-1 text-sm text-orange-600">
                        SKU should be 3-50 alphanumeric characters
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      {...register('categoryId', { required: 'Category is required' })}
                      className="input"
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode
                    </label>
                    <input
                      {...register('barcode')}
                      className="input"
                      placeholder="Enter barcode (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      {...register('price', { 
                        required: 'Price is required',
                        min: { value: 0.01, message: 'Price must be greater than 0' },
                        valueAsNumber: true
                      })}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="₱0.00"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost *
                    </label>
                    <input
                      {...register('cost', { 
                        required: 'Cost is required',
                        min: { value: 0, message: 'Cost must be greater than or equal to 0' },
                        valueAsNumber: true
                      })}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="₱0.00"
                    />
                    {errors.cost && (
                      <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wholesale Price
                    </label>
                    <input
                      {...register('wholesalePrice', { 
                        min: { value: 0.01, message: 'Wholesale price must be greater than 0' },
                        valueAsNumber: true
                      })}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="₱0.00 (optional)"
                    />
                    {errors.wholesalePrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.wholesalePrice.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wholesale Min Quantity
                    </label>
                    <input
                      {...register('wholesaleMinQuantity', { 
                        min: { value: 1, message: 'Minimum quantity must be at least 1' },
                        valueAsNumber: true
                      })}
                      type="number"
                      className="input"
                      placeholder="0 (optional)"
                    />
                    {errors.wholesaleMinQuantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.wholesaleMinQuantity.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum quantity to apply wholesale pricing
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      {...register('quantity', { 
                        required: 'Quantity is required',
                        min: { value: 0, message: 'Quantity must be greater than or equal to 0' },
                        valueAsNumber: true
                      })}
                      type="number"
                      className="input"
                      placeholder="0"
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Stock Level *
                    </label>
                    <input
                      {...register('minStockLevel', { 
                        required: 'Minimum stock level is required',
                        min: { value: 0, message: 'Minimum stock level must be greater than or equal to 0' },
                        valueAsNumber: true
                      })}
                      type="number"
                      className="input"
                      placeholder="5"
                    />
                    {errors.minStockLevel && (
                      <p className="mt-1 text-sm text-red-600">{errors.minStockLevel.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="input"
                      placeholder="Enter product description (optional)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        {...register('isActive')}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Active (available for sale)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                  disabled={isSubmitting || isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
};

export default Inventory; 