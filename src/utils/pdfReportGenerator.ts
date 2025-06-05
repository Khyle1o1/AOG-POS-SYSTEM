import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Transaction } from '../types';

interface ReportData {
  transactions: Transaction[];
  dateRange: { start: Date; end: Date };
  totalSales: number;
  totalTransactions: number;
  totalInventoryCost: number;
  totalProfit: number;
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
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`, pageWidth - 60, 28);
  
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
    ['Total Inventory Cost', `PHP ${data.totalInventoryCost.toFixed(2)}`],
    ['Total Profit', `PHP ${data.totalProfit.toFixed(2)}`]
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
      cellPadding: 4,
      halign: 'center'
    },
    columnStyles: { 
      0: { cellWidth: contentWidth * 0.65, halign: 'center', fontStyle: 'normal' }, 
      1: { cellWidth: contentWidth * 0.35, halign: 'center', fontStyle: 'bold' } 
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    styles: {
      cellPadding: 4,
      valign: 'middle',
      halign: 'center'
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Recent Transactions Section
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Transactions', margin, yPosition);
  yPosition += 10;

  if (data.transactions.length > 0) {
    const transactionData = data.transactions.slice(0, 15).map(transaction => [
      `#${transaction.transactionNumber.slice(-4)}`, // Show only last 4 digits
      format(transaction.createdAt, 'MM/dd hh:mm a'),
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
      headStyles: { 
        fillColor: primaryColor, 
        textColor: 255, 
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 6
      },
      bodyStyles: { 
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245] // Light gray for alternating rows
      },
      columnStyles: { 
        0: { cellWidth: contentWidth * 0.15, halign: 'center' },
        1: { cellWidth: contentWidth * 0.25, halign: 'center' },
        2: { cellWidth: contentWidth * 0.12, halign: 'center' },
        3: { cellWidth: contentWidth * 0.12, halign: 'center' },
        4: { cellWidth: contentWidth * 0.18, halign: 'center' },
        5: { cellWidth: contentWidth * 0.18, halign: 'center' }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      styles: {
        halign: 'center',
        valign: 'middle',
        lineColor: [229, 229, 229],
        lineWidth: 0.5
      }
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
      doc.text(`${format(transaction.createdAt, 'MMM dd, yyyy hh:mm a')}`, margin, yPosition + 8);
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
          headStyles: { 
            fillColor: [59, 130, 246] as [number, number, number], 
            textColor: 255, 
            fontSize: 8,
            halign: 'center'
          },
          bodyStyles: { 
            fontSize: 7,
            halign: 'center'
          },
          columnStyles: { 
            0: { cellWidth: contentWidth * 0.5, halign: 'center' },
            1: { cellWidth: contentWidth * 0.15, halign: 'center' },
            2: { cellWidth: contentWidth * 0.175, halign: 'center' },
            3: { cellWidth: contentWidth * 0.175, halign: 'center' }
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth,
          styles: {
            halign: 'center'
          }
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