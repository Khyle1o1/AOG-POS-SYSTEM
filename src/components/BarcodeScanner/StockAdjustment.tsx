import React from 'react';
import { Package, Plus, Save, X, RefreshCw } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { useStore } from '../../store/useStore';
import { Product } from '../../types';

interface StockAdjustmentEntry {
  product: Product;
  currentStock: number;
  newStock: number;
  adjustment: number;
  reason: string;
}

interface StockAdjustmentProps {
  isOpen: boolean;
  onClose: () => void;
}

const StockAdjustment: React.FC<StockAdjustmentProps> = ({ isOpen, onClose }) => {
  const { products, updateStock } = useStore();
  const [showScanner, setShowScanner] = React.useState(false);
  const [adjustments, setAdjustments] = React.useState<StockAdjustmentEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [adjustment, setAdjustment] = React.useState<number>(0);
  const [reason, setReason] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [notification, setNotification] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBarcodeScanned = (sku: string) => {
    const product = products.find(p => 
      p.sku.toLowerCase() === sku.toLowerCase() || 
      p.barcode?.toLowerCase() === sku.toLowerCase()
    );

    if (product) {
      setSelectedProduct(product);
      setAdjustment(0);
      setReason('');
      setShowScanner(false);
      showNotification('success', `Product found: ${product.name}`);
    } else {
      showNotification('error', `Product with SKU "${sku}" not found`);
      setShowScanner(false);
    }
  };

  const addAdjustment = () => {
    if (!selectedProduct || adjustment === 0) return;

    const newStock = selectedProduct.quantity + adjustment;
    if (newStock < 0) {
      showNotification('error', 'Cannot reduce stock below zero');
      return;
    }

    const entry: StockAdjustmentEntry = {
      product: selectedProduct,
      currentStock: selectedProduct.quantity,
      newStock,
      adjustment,
      reason: reason || 'Manual adjustment'
    };

    setAdjustments(prev => [...prev, entry]);
    setSelectedProduct(null);
    setAdjustment(0);
    setReason('');
    showNotification('success', 'Adjustment added to batch');
  };

  const removeAdjustment = (index: number) => {
    setAdjustments(prev => prev.filter((_, i) => i !== index));
  };

  const applyAllAdjustments = async () => {
    if (adjustments.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const entry of adjustments) {
        await updateStock(entry.product.id, entry.adjustment);
      }
      
      showNotification('success', `Successfully applied ${adjustments.length} stock adjustments`);
      setAdjustments([]);
      
      // Optional: Close modal after successful batch update
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error applying stock adjustments:', error);
      showNotification('error', 'Failed to apply some adjustments. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAdjustments = [
    { label: '+1', value: 1, color: 'green' },
    { label: '+5', value: 5, color: 'green' },
    { label: '+10', value: 10, color: 'green' },
    { label: '-1', value: -1, color: 'red' },
    { label: '-5', value: -5, color: 'red' },
    { label: '-10', value: -10, color: 'red' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Stock Adjustment</h2>
              <p className="text-sm text-gray-500">Scan products to quickly adjust stock levels</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Notification */}
            {notification && (
              <div className={`p-4 rounded-lg ${
                notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {notification.message}
              </div>
            )}

            {/* Scanner Controls */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Product Scanner</h3>
                <button
                  onClick={() => setShowScanner(true)}
                  className="btn btn-primary flex items-center"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Scan Product
                </button>
              </div>

              {/* Product Selection */}
              {selectedProduct && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                      <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                      <p className="text-sm text-gray-600">Current Stock: <span className="font-medium">{selectedProduct.quantity}</span></p>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quick Adjustment Buttons */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Quick Adjustments:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickAdjustments.map((qa) => (
                        <button
                          key={qa.label}
                          onClick={() => setAdjustment(qa.value)}
                          className={`px-3 py-1 text-sm rounded border transition-colors ${
                            adjustment === qa.value
                              ? qa.color === 'green'
                                ? 'bg-green-100 border-green-300 text-green-800'
                                : 'bg-red-100 border-red-300 text-red-800'
                              : qa.color === 'green'
                                ? 'border-green-200 text-green-600 hover:bg-green-50'
                                : 'border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Adjustment Input */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adjustment
                      </label>
                      <input
                        type="number"
                        value={adjustment}
                        onChange={(e) => setAdjustment(Number(e.target.value))}
                        className="input"
                        placeholder="Enter adjustment"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Stock Level
                      </label>
                      <input
                        type="number"
                        value={selectedProduct.quantity + adjustment}
                        readOnly
                        className="input bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="input"
                      >
                        <option value="">Select reason</option>
                        <option value="Stock count">Stock count</option>
                        <option value="Damage">Damage</option>
                        <option value="Theft">Theft</option>
                        <option value="Expired">Expired</option>
                        <option value="Received inventory">Received inventory</option>
                        <option value="Correction">Correction</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={addAdjustment}
                      disabled={adjustment === 0}
                      className="btn btn-primary flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Batch
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Adjustments List */}
            {adjustments.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      Pending Adjustments ({adjustments.length})
                    </h3>
                    <button
                      onClick={applyAllAdjustments}
                      disabled={isSubmitting}
                      className="btn btn-success flex items-center"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Apply All
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {adjustments.map((entry, index) => (
                    <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900">{entry.product.name}</h4>
                            <button
                              onClick={() => removeAdjustment(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500">SKU: {entry.product.sku}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span>Current: <strong>{entry.currentStock}</strong></span>
                            <span className={`font-medium ${
                              entry.adjustment > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.adjustment > 0 ? '+' : ''}{entry.adjustment}
                            </span>
                            <span>New: <strong>{entry.newStock}</strong></span>
                            <span className="text-gray-500">({entry.reason})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        mode="stock-adjustment"
        placeholder="Scan product barcode..."
      />
    </>
  );
};

export default StockAdjustment; 