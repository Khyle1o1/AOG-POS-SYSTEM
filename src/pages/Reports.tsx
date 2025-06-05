import React from 'react';
import { 
  TrendingUp, 
  Coins, 
  ShoppingCart, 
  Package,
  Download,
  BarChart3,
  PieChart,
  FileText,
  FileDown,
  Calculator,
  X,
  Receipt,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { generatePDFReport, generateDetailedTransactionReport } from '../utils/pdfReportGenerator';
import { Transaction } from '../types';

type ReportPeriod = 'today' | 'week' | 'month' | 'custom';

const Reports: React.FC = () => {
  const { transactions, products } = useStore();
  const [selectedPeriod, setSelectedPeriod] = React.useState<ReportPeriod>('today');
  const [startDate, setStartDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = React.useState(false);

  // Calculate date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'custom':
        return {
          start: new Date(startDate),
          end: new Date(endDate)
        };
      default:
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
    }
  };

  const { start, end } = getDateRange();

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(t => 
    t.createdAt >= start && 
    t.createdAt <= end && 
    t.type === 'sale' && 
    t.status === 'completed'
  );

  // Calculate metrics
  const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  
  const refunds = transactions.filter(t => 
    t.createdAt >= start && 
    t.createdAt <= end && 
    t.type === 'refund'
  );
  const totalRefunds = refunds.reduce((sum, t) => sum + t.total, 0);
  const netSales = totalSales - totalRefunds;

  // Product sales analysis
  const productSales = filteredTransactions.reduce((acc, transaction) => {
    transaction.items.forEach(item => {
      const productId = item.productId;
      if (!acc[productId]) {
        acc[productId] = {
          productId,
          productName: item.product?.name || 'Unknown',
          quantitySold: 0,
          revenue: 0,
          profit: 0
        };
      }
      acc[productId].quantitySold += item.quantity;
      acc[productId].revenue += item.totalPrice;
      acc[productId].profit += (item.unitPrice - (item.product?.cost || 0)) * item.quantity;
    });
    return acc;
  }, {} as Record<string, any>);

  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);

  // Payment method breakdown
  const paymentMethods = filteredTransactions.reduce((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.total;
    return acc;
  }, {} as Record<string, number>);

  // Hourly sales data
  const hourlySales = filteredTransactions.reduce((acc, t) => {
    const hour = t.createdAt.getHours();
    acc[hour] = (acc[hour] || 0) + t.total;
    return acc;
  }, {} as Record<number, number>);

  // Calculate total inventory cost
  const totalInventoryCost = products?.reduce((sum, product) => {
    return sum + (product.cost * product.quantity);
  }, 0) || 0;

  // Calculate total profit from sales
  const totalProfit = filteredTransactions.reduce((sum, transaction) => {
    const transactionProfit = transaction.items.reduce((itemSum, item) => {
      const profit = (item.unitPrice - (item.product?.cost || 0)) * item.quantity;
      return itemSum + profit;
    }, 0);
    return sum + transactionProfit;
  }, 0);

  const exportToCSV = () => {
    const csvData = [
      ['Transaction ID', 'Date', 'Time', 'Total', 'Payment Method', 'Items Count'],
      ...filteredTransactions.map(t => [
        t.transactionNumber,
        format(t.createdAt, 'yyyy-MM-dd'),
        format(t.createdAt, 'hh:mm:ss a'),
        t.total.toFixed(2),
        t.paymentMethod,
        t.items.length.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(start, 'yyyy-MM-dd')}-to-${format(end, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const reportData = {
      transactions: filteredTransactions,
      dateRange: { start, end },
      totalSales,
      totalTransactions,
      totalInventoryCost,
      totalProfit
    };

    generatePDFReport(reportData);
  };

  const exportDetailedPDF = () => {
    generateDetailedTransactionReport(filteredTransactions, { start, end });
  };

  const stats = [
    {
      title: 'Total Sales',
      value: formatCurrency(totalSales),
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
      title: 'Total Inventory Cost',
      value: formatCurrency(totalInventoryCost),
      icon: Calculator,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const closeTransactionModal = () => {
    setSelectedTransaction(null);
    setShowTransactionModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-500">Analyze your sales performance and trends</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="btn btn-outline"
            disabled={filteredTransactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="btn btn-primary"
            disabled={filteredTransactions.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Summary PDF
          </button>
          <button
            onClick={exportDetailedPDF}
            className="btn btn-secondary"
            disabled={filteredTransactions.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Detailed PDF
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex space-x-2">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'custom', label: 'Custom' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as ReportPeriod)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {selectedPeriod === 'custom' && (
            <div className="flex space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input text-sm"
              />
              <span className="text-gray-500 self-center">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input text-sm"
              />
            </div>
          )}
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

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date & Time</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Cashier</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 10).map(transaction => (
                  <tr 
                    key={transaction.id}
                    onClick={() => handleTransactionClick(transaction)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td>
                      <span className="font-mono text-sm">#{transaction.transactionNumber}</span>
                    </td>
                    <td>
                      <div>
                        <div className="text-sm font-medium">{format(transaction.createdAt, 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-gray-500">{format(transaction.createdAt, 'hh:mm:ss a')}</div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{transaction.items.length} items</span>
                    </td>
                    <td>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                        {transaction.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium">₱{transaction.total.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900">
                        {transaction.cashier?.firstName} {transaction.cashier?.lastName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found for this period</p>
          </div>
        )}
      </div>

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
                        {format(selectedTransaction.createdAt, 'MMM dd, yyyy hh:mm:ss a')}
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

export default Reports; 