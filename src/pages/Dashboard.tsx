import React from 'react';
import { 
  Coins, 
  TrendingUp, 
  Package, 
  Users,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  X,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Calculator
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import { Transaction } from '../types';

const Dashboard: React.FC = () => {
  const { transactions, products, users, cart } = useStore();
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = React.useState(false);

  // Calculate metrics
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const todayTransactions = transactions?.filter(t => 
    t.createdAt >= todayStart && t.type === 'sale' && t.status === 'completed'
  ) || [];
  
  const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = todayTransactions.length;
  
  const lowStockProducts = products?.filter(p => p.quantity <= p.minStockLevel) || [];
  const totalProducts = products?.length || 0;
  const totalUsers = users?.length || 0;
  
  // Calculate total inventory cost
  const totalInventoryCost = products?.reduce((sum, product) => {
    return sum + (product.cost * product.quantity);
  }, 0) || 0;

  // Calculate total sales from all completed transactions
  const totalSales = transactions?.filter(t => 
    t.type === 'sale' && t.status === 'completed'
  ).reduce((sum, t) => sum + t.total, 0) || 0;

  const recentTransactions = transactions
    ?.filter(t => t.type === 'sale')
    ?.slice(0, 5) || [];

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const closeTransactionModal = () => {
    setSelectedTransaction(null);
    setShowTransactionModal(false);
  };

  const stats = [
    {
      title: "Today's Sales",
      value: formatCurrency(todaySales),
      icon: Coins,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Sales',
      value: formatCurrency(totalSales),
      icon: Receipt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Inventory Cost',
      value: formatCurrency(totalInventoryCost),
      icon: Calculator,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/sales"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">New Sale</p>
              <p className="text-sm text-gray-500">Process a new transaction</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
          </Link>
          
          <Link
            to="/inventory"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Package className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Manage Inventory</p>
              <p className="text-sm text-gray-500">Add or update products</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
          </Link>
          
          <Link
            to="/reports"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">View Reports</p>
              <p className="text-sm text-gray-500">Analyze sales data</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link to="/reports" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              View all
            </Link>
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  onClick={() => handleTransactionClick(transaction)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">#{transaction.transactionNumber}</p>
                    <p className="text-sm text-gray-500">
                      {format(transaction.createdAt, 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(transaction.total)}</p>
                    <p className={`text-xs ${
                      transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
            <Link to="/inventory" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              Manage
            </Link>
          </div>
          
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{product.quantity} left</p>
                    <p className="text-xs text-gray-500">Min: {product.minStockLevel}</p>
                  </div>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{lowStockProducts.length - 5} more items need attention
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-green-600 font-medium">All products well stocked!</p>
            </div>
          )}
        </div>
      </div>

      {/* Current Cart Status */}
      {cart?.items?.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Active Cart</h3>
              <p className="text-blue-700">
                {cart.items.length} items • Total: {formatCurrency(cart.total)}
              </p>
            </div>
            <Link
              to="/sales"
              className="btn btn-primary"
            >
              Continue Sale
            </Link>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-full overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Receipt className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Transaction Details
                  </h3>
                </div>
                <button
                  onClick={closeTransactionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Receipt className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Transaction Number</p>
                      <p className="font-medium">#{selectedTransaction.transactionNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium">
                        {format(selectedTransaction.createdAt, 'MMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Cashier</p>
                      <p className="font-medium">
                        {selectedTransaction.cashier?.firstName} {selectedTransaction.cashier?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium capitalize">{selectedTransaction.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Items Purchased</h4>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                  </div>
                  {selectedTransaction.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedTransaction.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span>{formatCurrency(selectedTransaction.tax)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedTransaction.total)}</span>
                    </div>
                  </div>
                  
                  {selectedTransaction.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Cash Received:</span>
                        <span>{formatCurrency(selectedTransaction.paymentAmount)}</span>
                      </div>
                      {selectedTransaction.changeAmount > 0 && (
                        <div className="flex justify-between text-sm font-medium text-green-600">
                          <span>Change Given:</span>
                          <span>{formatCurrency(selectedTransaction.changeAmount)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    selectedTransaction.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedTransaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedTransaction.items.length} item{selectedTransaction.items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={closeTransactionModal}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 