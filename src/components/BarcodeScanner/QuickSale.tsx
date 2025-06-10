import React from 'react';
import { Zap, Scan, ShoppingCart, Check, X, Trash2, Plus, Minus } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { useStore } from '../../store/useStore';
import { Product, Transaction, TransactionItem } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface QuickSaleProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickSale: React.FC<QuickSaleProps> = ({ isOpen, onClose }) => {
  const { 
    products, 
    addToCart, 
    removeFromCart, 
    updateCartItem, 
    clearCart, 
    addTransaction, 
    cart, 
    auth 
  } = useStore();
  
  const [showScanner, setShowScanner] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [lastScannedProduct, setLastScannedProduct] = React.useState<Product | null>(null);
  const [notification, setNotification] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [continuousScanning, setContinuousScanning] = React.useState(true);

  React.useEffect(() => {
    if (isOpen && continuousScanning) {
      setShowScanner(true);
    }
  }, [isOpen, continuousScanning]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 2000); // Shorter notification for quick sale
  };

  const handleBarcodeScanned = (sku: string) => {
    const product = products.find(p => 
      p.sku.toLowerCase() === sku.toLowerCase() || 
      p.barcode?.toLowerCase() === sku.toLowerCase()
    );

    if (product) {
      if (product.isActive && product.quantity > 0) {
        // Check if product is already in cart
        const existingItem = cart.items.find(item => item.product.id === product.id);
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        
        if (currentQuantity < product.quantity) {
          addToCart(product, 1);
          setLastScannedProduct(product);
          showNotification('success', `Added ${product.name}`);
        } else {
          showNotification('error', `No more stock available for ${product.name}`);
        }
      } else {
        showNotification('error', `${product.name} is not available`);
      }
    } else {
      showNotification('error', `Product not found: ${sku}`);
    }

    // Keep scanner open for continuous scanning
    if (continuousScanning) {
      setTimeout(() => {
        setShowScanner(true);
      }, 500);
    } else {
      setShowScanner(false);
    }
  };

  const handleQuickCheckout = async () => {
    if (cart.items.length === 0) return;

    setIsProcessing(true);
    try {
      // Create transaction items
      const transactionItems: TransactionItem[] = cart.items.map((item, index) => ({
        id: (Date.now() + index).toString(),
        productId: item.product.id,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount || 0,
      }));

      // Create transaction
      const transaction: Transaction = {
        id: Date.now().toString(),
        transactionNumber: `QS${Date.now()}`,
        type: 'sale',
        status: 'completed',
        items: transactionItems,
        subtotal: cart.subtotal,
        tax: cart.tax,
        discount: cart.discount,
        total: cart.total,
        paymentMethod: 'cash', // Default to cash for quick sale
        paymentAmount: cart.total,
        changeAmount: 0,
        cashierId: auth.user?.id || '',
        cashier: auth.user || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addTransaction(transaction);
      clearCart();
      showNotification('success', `Sale completed: ${formatCurrency(transaction.total)}`);
      
      // Auto-restart scanning if continuous mode is on
      if (continuousScanning) {
        setTimeout(() => {
          setShowScanner(true);
        }, 1000);
      }

    } catch (error) {
      console.error('Quick sale error:', error);
      showNotification('error', 'Failed to process sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeLastItem = () => {
    if (cart.items.length > 0) {
      const lastItem = cart.items[cart.items.length - 1];
      removeFromCart(lastItem.product.id);
      showNotification('success', `Removed ${lastItem.product.name}`);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50">
            <div className="flex items-center">
              <Zap className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quick Sale Mode</h2>
                <p className="text-sm text-gray-600">Rapid scanning for busy periods</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Notification */}
            {notification && (
              <div className={`p-3 rounded-lg text-center font-medium ${
                notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {notification.message}
              </div>
            )}

            {/* Scanner Controls */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Scanner Control</h3>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={continuousScanning}
                      onChange={(e) => setContinuousScanning(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 mr-1"
                    />
                    Continuous
                  </label>
                  {!showScanner && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="btn btn-primary btn-sm flex items-center"
                    >
                      <Scan className="h-4 w-4 mr-1" />
                      Scan
                    </button>
                  )}
                </div>
              </div>

              {/* Last Scanned Product */}
              {lastScannedProduct && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    <strong>Last added:</strong> {lastScannedProduct.name} - {formatCurrency(lastScannedProduct.price)}
                  </p>
                </div>
              )}
            </div>

            {/* Cart Summary */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    Cart ({cart.items.length} items)
                  </h3>
                  {cart.items.length > 0 && (
                    <button
                      onClick={removeLastItem}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove Last
                    </button>
                  )}
                </div>
              </div>

              {cart.items.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Start scanning products to add to cart</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {cart.items.map((item, _) => (
                    <div key={item.product.id} className="p-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">
                            {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartItem(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            disabled={item.quantity >= item.product.quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Display */}
            {cart.items.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(cart.total)}</p>
                  <p className="text-sm text-gray-500">
                    Subtotal: {formatCurrency(cart.subtotal)} | Tax: {formatCurrency(cart.tax)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={() => clearCart()}
                disabled={cart.items.length === 0}
                className="btn btn-outline flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </button>
              <button
                onClick={handleQuickCheckout}
                disabled={cart.items.length === 0 || isProcessing}
                className="btn btn-success flex-2 text-lg py-3"
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Quick Checkout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        mode="quick-sale"
        title="Quick Sale Scanner"
        placeholder="Rapid scanning mode active..."
      />
    </>
  );
};

export default QuickSale; 