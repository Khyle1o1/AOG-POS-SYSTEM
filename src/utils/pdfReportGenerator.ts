import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Transaction } from '../types';

interface ReportData {
  transactions: Transaction[];
  dateRange: { start: Date; end: Date };
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  netSales: number;
  totalRefunds: number;
  topProducts: any[];
  paymentMethods: Record<string, number>;
  hourlySales: Record<number, number>;
}

export const generatePDFReport = (data: ReportData) => {
  // Explicitly set A4 format
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 15; // 15mm margins
  const contentWidth = pageWidth - (2 * margin);
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const secondaryColor: [number, number, number] = [107, 114, 128]; // Gray
  // const accentColor: [number, number, number] = [16, 185, 129]; // Green
  
  let yPosition = 20;

  // Header with reduced height
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Sales Report', margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const periodText = `${format(data.dateRange.start, 'MMM dd, yyyy')} - ${format(data.dateRange.end, 'MMM dd, yyyy')}`;
  doc.text(periodText, margin, 28);
  
  // Generated date
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth - 60, 28);
  
  yPosition = 45;

  // Executive Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, yPosition);
  yPosition += 10;

  // Summary metrics in a compact table
  const summaryData = [
    ['Total Sales', `PHP ${data.totalSales.toFixed(2)}`],
    ['Total Transactions', data.totalTransactions.toString()],
    ['Average Transaction', `PHP ${data.averageTransaction.toFixed(2)}`],
    ['Total Refunds', `PHP ${data.totalRefunds.toFixed(2)}`],
    ['Net Sales', `PHP ${data.netSales.toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor, 
      textColor: 255, 
      fontSize: 10,
      halign: 'center',
      fontStyle: 'bold'
    },
    bodyStyles: { 
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: { 
      0: { cellWidth: contentWidth * 0.65, halign: 'left', fontStyle: 'normal' }, 
      1: { cellWidth: contentWidth * 0.35, halign: 'right', fontStyle: 'bold' } 
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      cellPadding: 4,
      valign: 'middle'
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Top Products Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top Performing Products', margin, yPosition);
  yPosition += 8;

  if (data.topProducts.length > 0) {
    const productData = data.topProducts.slice(0, 8).map((product, index) => [
      (index + 1).toString(),
      product.productName.length > 30 ? product.productName.substring(0, 30) + '...' : product.productName,
      product.quantitySold.toString(),
      `PHP ${product.revenue.toFixed(0)}`,
      `PHP ${product.profit.toFixed(0)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Product Name', 'Qty', 'Revenue', 'Profit']],
      body: productData,
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: 255, 
        fontSize: 9, 
        halign: 'center',
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: { 
        0: { cellWidth: contentWidth * 0.08, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: contentWidth * 0.50, halign: 'left', fontStyle: 'normal' },
        2: { cellWidth: contentWidth * 0.10, halign: 'center', fontStyle: 'normal' },
        3: { cellWidth: contentWidth * 0.16, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: contentWidth * 0.16, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      styles: {
        cellPadding: 3,
        valign: 'middle'
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('No product sales data available for this period.', margin, yPosition);
    yPosition += 15;
  }

  // Check if we need a new page
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  // Payment Methods Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Methods', margin, yPosition);
  yPosition += 8;

  if (Object.keys(data.paymentMethods).length > 0) {
    const paymentData = Object.entries(data.paymentMethods).map(([method, amount]) => {
      const percentage = data.totalSales > 0 ? (amount / data.totalSales) * 100 : 0;
      return [
        method.charAt(0).toUpperCase() + method.slice(1),
        `PHP ${amount.toFixed(2)}`,
        `${percentage.toFixed(1)}%`
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Payment Method', 'Amount', 'Percentage']],
      body: paymentData,
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: 255, 
        fontSize: 9, 
        halign: 'center',
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: { 
        0: { cellWidth: contentWidth * 0.45, halign: 'left', fontStyle: 'normal' },
        1: { cellWidth: contentWidth * 0.30, halign: 'right', fontStyle: 'bold' },
        2: { cellWidth: contentWidth * 0.25, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      styles: {
        cellPadding: 3,
        valign: 'middle'
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Hourly Sales Analysis (compact version)
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Peak Hours Sales', margin, yPosition);
  yPosition += 8;

  if (Object.keys(data.hourlySales).length > 0) {
    // Show only top 6 hours with sales
    const hourlyData = Object.entries(data.hourlySales)
      .filter(([_, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([hour, amount]) => [
        `${hour.padStart(2, '0')}:00`,
        `PHP ${amount.toFixed(2)}`
      ]);

    if (hourlyData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [['Hour', 'Sales Amount']],
        body: hourlyData,
        theme: 'grid',
        headStyles: { 
          fillColor: primaryColor, 
          textColor: 255, 
          fontSize: 9,
          halign: 'center',
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: { 
          0: { cellWidth: contentWidth * 0.25, halign: 'center', fontStyle: 'normal' },
          1: { cellWidth: contentWidth * 0.35, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth * 0.6,
        styles: {
          cellPadding: 3,
          valign: 'middle'
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Recent Transactions Section (compact)
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Transactions', margin, yPosition);
  yPosition += 8;

  if (data.transactions.length > 0) {
    const transactionData = data.transactions.slice(0, 12).map(transaction => [
      `#${transaction.transactionNumber.slice(-4)}`, // Show only last 4 digits
      format(transaction.createdAt, 'MM/dd HH:mm'),
      transaction.items.length.toString(),
      transaction.paymentMethod.charAt(0).toUpperCase(),
      `PHP ${transaction.total.toFixed(0)}`,
      `${transaction.cashier?.firstName?.[0] || ''}${transaction.cashier?.lastName?.[0] || ''}` // Initials only
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Date/Time', 'Items', 'Pay', 'Total', 'By']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 
        0: { cellWidth: contentWidth * 0.15 },
        1: { cellWidth: contentWidth * 0.2 },
        2: { cellWidth: contentWidth * 0.1, halign: 'center' },
        3: { cellWidth: contentWidth * 0.1, halign: 'center' },
        4: { cellWidth: contentWidth * 0.15, halign: 'right' },
        5: { cellWidth: contentWidth * 0.1, halign: 'center' }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth * 0.8
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 10);
    doc.text('Generated by POS System', margin, pageHeight - 10);
  }

  // Save the PDF
  const filename = `sales-report-${format(data.dateRange.start, 'yyyy-MM-dd')}-to-${format(data.dateRange.end, 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};

export const generateDetailedTransactionReport = (transactions: Transaction[], dateRange: { start: Date; end: Date }) => {
  // Explicitly set A4 format
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 15; // 15mm margins
  const contentWidth = pageWidth - (2 * margin);
  
  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Transaction Report', margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const periodText = `${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`;
  doc.text(periodText, margin, 28);
  
  let yPosition = 45;

  if (transactions.length === 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('No transactions found for the selected period.', margin, yPosition);
  } else {
    // Summary
    const totalAmount = transactions.reduce((sum, t) => sum + t.total, 0);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Total Transactions: ${transactions.length}`, margin, yPosition);
    doc.text(`Total Amount: PHP ${totalAmount.toFixed(2)}`, margin, yPosition + 10);
    yPosition += 25;

    // Detailed transaction list (limit to prevent oversized PDFs)
    const limitedTransactions = transactions.slice(0, 50); // Limit to 50 transactions for A4 optimization
    
    limitedTransactions.forEach((transaction) => {
      if (yPosition > pageHeight - 70) {
        doc.addPage();
        yPosition = 20;
      }

      // Transaction header (more compact)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${transaction.transactionNumber}`, margin, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${format(transaction.createdAt, 'MMM dd, yyyy HH:mm')}`, margin, yPosition + 8);
      doc.text(`${transaction.cashier?.firstName || ''} ${transaction.cashier?.lastName || ''}`, margin + 50, yPosition + 8);
      doc.text(`${transaction.paymentMethod}`, margin + 100, yPosition + 8);
      doc.text(`PHP ${transaction.total.toFixed(2)}`, margin + 130, yPosition + 8);

      yPosition += 18;

      // Transaction items (compact table)
      if (transaction.items.length > 0) {
        const itemData = transaction.items.map(item => [
          item.product?.name?.substring(0, 30) || 'Unknown Product',
          item.quantity.toString(),
          `PHP ${item.unitPrice.toFixed(2)}`,
          `PHP ${item.totalPrice.toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Product', 'Qty', 'Price', 'Total']],
          body: itemData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] as [number, number, number], textColor: 255, fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          columnStyles: { 
            0: { cellWidth: contentWidth * 0.5 },
            1: { cellWidth: contentWidth * 0.15, halign: 'center' },
            2: { cellWidth: contentWidth * 0.175, halign: 'right' },
            3: { cellWidth: contentWidth * 0.175, halign: 'right' }
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth
        });

        yPosition = (doc as any).lastAutoTable.finalY + 8;
      }

      // Add separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
    });

    // Add note if transactions were limited
    if (transactions.length > 50) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(`Note: Report limited to first 50 transactions. Total transactions in period: ${transactions.length}`, margin, yPosition);
    }
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 10);
    doc.text('Generated by POS System', margin, pageHeight - 10);
  }

  // Save the PDF
  const filename = `detailed-transactions-${format(dateRange.start, 'yyyy-MM-dd')}-to-${format(dateRange.end, 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}; 