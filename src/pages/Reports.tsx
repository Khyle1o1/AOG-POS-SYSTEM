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
  FileDown
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { generatePDFReport, generateDetailedTransactionReport } from '../utils/pdfReportGenerator';

type ReportPeriod = 'today' | 'week' | 'month' | 'custom';

const Reports: React.FC = () => {
  const { transactions } = useStore();
  const [selectedPeriod, setSelectedPeriod] = React.useState<ReportPeriod>('today');
  const [startDate, setStartDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));

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

  const exportToCSV = () => {
    const csvData = [
      ['Transaction ID', 'Date', 'Time', 'Total', 'Payment Method', 'Items Count'],
      ...filteredTransactions.map(t => [
        t.transactionNumber,
        format(t.createdAt, 'yyyy-MM-dd'),
        format(t.createdAt, 'HH:mm:ss'),
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
      averageTransaction,
      netSales,
      totalRefunds,
      topProducts,
      paymentMethods,
      hourlySales
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
      title: 'Avg. Transaction',
      value: formatCurrency(averageTransaction),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Net Sales',
      value: formatCurrency(netSales),
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
          
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product: any, index) => (
                <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-primary-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.productName}</p>
                      <p className="text-sm text-gray-500">{product.quantitySold} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₱{product.revenue.toFixed(2)}</p>
                    <p className="text-sm text-green-600">+₱{product.profit.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sales data available</p>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
          
          {Object.keys(paymentMethods).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(paymentMethods).map(([method, amount]) => {
                const percentage = totalSales > 0 ? (amount / totalSales) * 100 : 0;
                return (
                  <div key={method} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900 capitalize">{method}</span>
                      <span className="text-sm text-gray-600">₱{amount.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payment data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Hourly Sales Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Hour</h2>
        
        {Object.keys(hourlySales).length > 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 24 }, (_, hour) => {
              const sales = hourlySales[hour] || 0;
              const maxSales = Math.max(...Object.values(hourlySales));
              const percentage = maxSales > 0 ? (sales / maxSales) * 100 : 0;
              
              return (
                <div key={hour} className="flex items-center space-x-3">
                  <span className="text-sm font-mono text-gray-500 w-12">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-900 w-16 text-right">
                    ₱{sales.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hourly data available</p>
          </div>
        )}
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
                  <tr key={transaction.id}>
                    <td>
                      <span className="font-mono text-sm">#{transaction.transactionNumber}</span>
                    </td>
                    <td>
                      <div>
                        <div className="text-sm font-medium">{format(transaction.createdAt, 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-gray-500">{format(transaction.createdAt, 'HH:mm:ss')}</div>
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
    </div>
  );
};

export default Reports; 