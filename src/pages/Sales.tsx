import React from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Check,
  Receipt,
  Scan
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Product, Transaction, TransactionItem } from '../types';
import { format } from 'date-fns';
import BarcodeScanner from '../components/BarcodeScanner/BarcodeScanner';
import { formatCurrency } from '../utils/currency';

const Sales: React.FC = () => {
  // Debug: Log component initialization
  console.log('Sales component rendering...');

  const {
    products,
    categories,
    cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    addTransaction,
    auth,
    settings
  } = useStore();

  // Debug: Log store data
  console.log('Sales - Store data:', {
    productsCount: products?.length || 0,
    categoriesCount: categories?.length || 0,
    cartItems: cart?.items?.length || 0,
    authUser: auth?.user?.username || 'none'
  });

  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [paymentAmount, setPaymentAmount] = React.useState(0);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = React.useState(false);
  const [lastTransaction, setLastTransaction] = React.useState<Transaction | null>(null);

  // Early return with debug info if no data
  if (!products || !categories || !cart) {
    console.log('Sales - Missing required data:', { products: !!products, categories: !!categories, cart: !!cart });
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Sales Page - Debug Mode</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-medium text-yellow-800 mb-2">Loading Debug Info:</h2>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>Products: {products ? `${products.length} items` : 'Not loaded'}</li>
            <li>Categories: {categories ? `${categories.length} items` : 'Not loaded'}</li>
            <li>Cart: {cart ? 'Initialized' : 'Not initialized'}</li>
            <li>Auth: {auth?.user ? `${auth.user.username} (${auth.user.role})` : 'Not authenticated'}</li>
          </ul>
          <p className="mt-2 text-xs">If this persists, check the browser console for errors.</p>
        </div>
      </div>
    );
  }

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    // Debug: Check for truly problematic products (missing essential fields)
    if (!product || !product.name) {
      console.warn('Sales - Problematic product found:', product);
      return false;
    }
    
    // Safety checks for undefined/null values
    const productName = product?.name || '';
    const productSku = product?.sku || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = productName.toLowerCase().includes(searchTermLower) ||
                         productSku.toLowerCase().includes(searchTermLower);
    const matchesCategory = !selectedCategory || product?.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && product?.isActive && (product?.quantity || 0) > 0;
  });

  console.log('Sales - Filtered products:', filteredProducts.length);

  // Helper function to safely format price
  // const formatPrice = (price: any): string => {
  //   const numPrice = Number(price) || 0;
  //   return formatCurrency(numPrice);
  // };

  const handleAddToCart = (product: Product) => {
    if (product.quantity > 0) {
      addToCart(product, 1);
    }
  };

  const handleBarcodeScanned = (sku: string) => {
    // Find product by SKU (case-insensitive)
    const foundProduct = products.find(p => 
      p.sku.toLowerCase() === sku.toLowerCase() || 
      p.barcode?.toLowerCase() === sku.toLowerCase()
    );
    
    if (foundProduct) {
      if (foundProduct.isActive && foundProduct.quantity > 0) {
        handleAddToCart(foundProduct);
        // Optional: Show success message
        console.log(`Added ${foundProduct.name} to cart via barcode scan`);
      } else {
        alert(`Product "${foundProduct.name}" is not available for sale.`);
      }
    } else {
      alert(`Product with SKU "${sku}" not found in inventory.`);
    }
    
    setShowBarcodeScanner(false);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCartItem(productId, newQuantity);
    }
  };

  const handleProcessPayment = () => {
    if (cart.items.length === 0) return;
    
    // Calculate change for cash payment
    const change = Math.max(0, paymentAmount - cart.total);
    
    // Create transaction
    const transactionItems: TransactionItem[] = cart.items.map((item, index) => ({
      id: (Date.now() + index).toString(),
      productId: item.product.id,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      discount: item.discount || 0,
    }));

    const transaction: Transaction = {
      id: Date.now().toString(),
      transactionNumber: `TXN${Date.now()}`,
      type: 'sale',
      status: 'completed',
      items: transactionItems,
      subtotal: cart.subtotal,
      tax: cart.tax,
      discount: cart.discount,
      total: cart.total,
      paymentMethod: 'cash',
      paymentAmount: paymentAmount,
      changeAmount: change,
      cashierId: auth.user?.id || '',
      cashier: auth.user || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addTransaction(transaction);
    setLastTransaction(transaction);
    clearCart();
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    setPaymentAmount(0);
  };

  const openPaymentModal = () => {
    setPaymentAmount(cart.total);
    setShowPaymentModal(true);
  };

  const printReceipt = () => {
    // In a real application, this would trigger the receipt printer
    window.print();
  };

  return (
    <div className="h-full flex">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col">
        {/* Search and Filters */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="btn btn-primary flex items-center"
              title="Scan Barcode"
            >
              <Scan className="h-4 w-4 mr-2" />
              Scan
            </button>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-48"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="card p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-2xl">📦</div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Current Sale</h2>
            <div className="flex items-center text-gray-500">
              <ShoppingCart className="h-5 w-5 mr-1" />
              <span>{cart.items.length}</span>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Cart is empty</p>
              <p className="text-sm text-gray-400">Add products to start a sale</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map(item => (
                <div key={item.product.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        disabled={item.quantity >= item.product.quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.items.length > 0 && (
          <>
            <div className="border-t border-gray-200 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({settings.taxRate}%):</span>
                <span>{formatCurrency(cart.tax)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(cart.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <button
                onClick={openPaymentModal}
                className="btn btn-primary w-full"
              >
                Process Payment
              </button>
              <button
                onClick={() => clearCart()}
                className="btn btn-outline w-full"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Payment</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Received
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="input w-full text-lg"
                  min={cart.total}
                  step="0.01"
                  placeholder="Enter amount received"
                  autoFocus
                />
                {paymentAmount > cart.total && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <span className="text-lg font-bold text-green-800">
                      Change: {formatCurrency(paymentAmount - cart.total)}
                    </span>
                  </div>
                )}
                {paymentAmount > 0 && paymentAmount < cart.total && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-red-800">
                      Insufficient amount. Need {formatCurrency(cart.total - paymentAmount)} more.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={paymentAmount < cart.total}
                  className="flex-1 btn btn-primary"
                >
                  Complete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sale Completed!</h3>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 mb-4 font-mono text-sm">
              <div className="text-center mb-2">
                <h4 className="font-bold">{settings.storeName}</h4>
                <p className="text-xs">Receipt</p>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mb-2">
                <p>Transaction: #{lastTransaction.transactionNumber}</p>
                <p>Date: {format(lastTransaction.createdAt, 'MMM dd, yyyy hh:mm a')}</p>
                <p>Cashier: {lastTransaction.cashier?.firstName} {lastTransaction.cashier?.lastName}</p>
              </div>

              <div className="border-t border-gray-200 pt-2 mb-2">
                {lastTransaction.items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs mb-1">
                    <span>{item.product?.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-2 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(lastTransaction.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(lastTransaction.tax)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(lastTransaction.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment (cash):</span>
                  <span>{formatCurrency(lastTransaction.paymentAmount)}</span>
                </div>
                {lastTransaction.changeAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>{formatCurrency(lastTransaction.changeAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={printReceipt}
                className="flex-1 btn btn-outline"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 btn btn-primary"
              >
                Done
              </button>
            </div>
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

export default Sales; 