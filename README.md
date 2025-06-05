# React POS System

A comprehensive Point of Sale (POS) system built with React, TypeScript, and modern web technologies. This system provides complete functionality for retail businesses including sales processing, inventory management, user management, reporting, and data backup/restore capabilities.

## 🚀 Features

### 1. Sales Processing
- **Manual entry for items sold**: Easy product selection and quantity management
- **Real-time cart management**: Add, remove, and modify items in the cart
- **Multiple payment methods**: Support for cash, card, and digital payments
- **Receipt generation**: Automatic receipt creation with store branding
- **Refund and void transactions**: Complete transaction reversal capabilities
- **Tax calculation**: Automatic tax computation based on configurable rates

### 2. Inventory Management
- **Real-time stock tracking**: Live inventory updates after each sale
- **Automated inventory updates**: Stock levels automatically adjust after transactions
- **Product management**: Add, edit, remove, and organize products
- **Database for product information**: Store name, price, SKU, quantity, and descriptions
- **Category and subcategory organization**: Hierarchical product organization
- **Low stock alerts**: Automatic notifications when products reach minimum levels
- **Barcode support**: SKU and barcode management for easy scanning
- **Bulk operations**: Import/export product data

### 3. User Management
- **Role-based access control**: Three user levels (Admin, Manager, Cashier)
- **Individual login credentials**: Secure authentication for each user
- **Transaction tracking**: Log all user activities for audit purposes
- **User permissions**: Granular access control based on user roles
- **Activity logging**: Complete audit trail of user actions

### 4. Reporting and Analytics
- **Daily, weekly, and monthly sales reports**: Comprehensive sales analysis
- **Exportable reports**: PDF and Excel export functionality
- **User activity logging**: Complete audit trails for compliance
- **Sales analytics**: Top products, payment method breakdown, hourly sales
- **Financial reporting**: Revenue, profit, and tax reporting
- **Custom date ranges**: Flexible reporting periods

### 5. Data Management
- **Backup functionality**: Complete system data backup
- **Restore capabilities**: Full data recovery from backup files
- **Data export**: JSON format for easy data portability
- **Data import**: Restore operations from backup files

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: Zustand with persistent storage
- **Routing**: React Router v6
- **Forms**: React Hook Form with validation
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charts**: Recharts (for analytics)
- **File Operations**: File-saver, XLSX for exports
- **PDF Generation**: jsPDF with auto-table
- **Build Tool**: Vite
- **Development**: ESLint, TypeScript, PostCSS

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-pos-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔐 Default Login Credentials

The system comes with three demo accounts for testing:

- **Admin**: `admin` / `password`
  - Full system access including user management and settings
- **Manager**: `manager` / `password` 
  - Inventory management and detailed reporting access
- **Cashier**: `cashier` / `password`
  - Sales processing and basic reporting access

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Auth/            # Authentication components
│   └── Layout/          # Layout and navigation
├── pages/               # Main application pages
│   ├── Dashboard.tsx    # Main dashboard with metrics
│   ├── Sales.tsx        # POS sales interface
│   ├── Inventory.tsx    # Product management
│   ├── Reports.tsx      # Analytics and reporting
│   ├── UserManagement.tsx # User administration
│   └── Settings.tsx     # System configuration
├── store/               # State management
│   └── useStore.ts      # Zustand store configuration
├── types/               # TypeScript type definitions
│   └── index.ts         # All interface definitions
├── utils/               # Utility functions
│   └── currency.ts      # Currency formatting utilities
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles and Tailwind
```

## 🎯 Usage Guide

### Getting Started
1. **Login**: Use one of the demo accounts to access the system
2. **Dashboard**: View key metrics and quick actions
3. **Sample Data**: The system initializes with sample products and categories

### Processing Sales
1. Navigate to the **Sales** page
2. Browse or search for products
3. Add items to cart by clicking on product cards
4. Adjust quantities using +/- buttons
5. Click "Process Payment" when ready
6. Select payment method and complete the transaction
7. Print or view the receipt

### Managing Inventory
1. Go to **Inventory** page
2. **Add Products**: Click "Add Product" button
3. **Edit Products**: Click the edit icon next to any product
4. **Categories**: Organize products using the category dropdown
5. **Stock Alerts**: Monitor low stock warnings
6. **Search**: Use the search bar to find specific products

### Generating Reports
1. Visit the **Reports** page
2. **Time Periods**: Select from today, week, month, or custom range
3. **Export Data**: Click "Export CSV" to download transaction data
4. **Analytics**: View top products, payment methods, and hourly sales
5. **Trends**: Analyze sales patterns and performance metrics

### User Administration (Admin Only)
1. Access **User Management** page
2. **Add Users**: Create new employee accounts
3. **Role Assignment**: Set appropriate permission levels
4. **User Status**: Activate/deactivate user accounts
5. **Security**: Each user has individual login credentials

### System Configuration
1. Open **Settings** page
2. **Store Info**: Configure store name, tax rate, and currency
3. **Data Management**: Backup, restore, or clear system data
4. **Receipt Settings**: Customize receipt appearance and options

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory for custom configuration:

```env
VITE_APP_NAME=My POS System
VITE_DEFAULT_TAX_RATE=10
VITE_DEFAULT_CURRENCY=USD
```

### Customization
- **Colors**: Modify the color palette in `tailwind.config.js`
- **Branding**: Update store information in the Settings page
- **Features**: Enable/disable features based on user roles
- **Data**: Initialize with your own product catalog

## 📊 Data Persistence

The system uses browser localStorage for data persistence, including:
- User authentication state
- Product catalog and inventory levels
- Transaction history
- User accounts and activity logs
- System settings and preferences

For production use, integrate with a backend database system.

## 🔒 Security Features

- **Role-based access control**: Three permission levels
- **Authentication**: Secure login system
- **Activity logging**: Complete audit trail
- **Data validation**: Input sanitization and validation
- **Session management**: Automatic logout and session handling

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design
- **Intuitive Navigation**: Easy-to-use sidebar and breadcrumbs
- **Real-time Updates**: Live data updates and notifications
- **Accessibility**: WCAG compliant design patterns
- **Dark Mode Ready**: CSS variables for easy theme switching

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Netlify/Vercel
1. Connect your repository to the platform
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on code changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo accounts and sample data

## 🔮 Future Enhancements

- **Backend Integration**: REST API and database connectivity
- **Real-time Synchronization**: Multi-device data sync
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: React Native companion app
- **Hardware Integration**: Barcode scanner and receipt printer support
- **Multi-store Support**: Chain store management
- **Customer Management**: Customer database and loyalty programs
- **Advanced Reporting**: Business intelligence dashboard

---

**Built with ❤️ using React and TypeScript** 