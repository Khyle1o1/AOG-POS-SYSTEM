// Currency utility for PHP Peso formatting
export const formatCurrency = (amount: number | string): string => {
  const numAmount = Number(amount) || 0;
  return `₱${numAmount.toFixed(2)}`;
};

export const getCurrencySymbol = (): string => {
  return '₱';
};

export const parseCurrency = (formattedAmount: string): number => {
  return Number(formattedAmount.replace('₱', '').replace(',', '')) || 0;
}; 