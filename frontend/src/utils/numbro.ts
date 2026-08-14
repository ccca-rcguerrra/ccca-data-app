import numbro from 'numbro';

// Configure numbro defaults for better formatting
numbro.setDefaults({
  thousandSeparated: true,
  mantissa: 2,
});

// Helper function to format numbers in Brazilian Portuguese style
export const formatNumberBR = (value: number, options?: any) => {
  return numbro(value).format(options || {
    thousandSeparated: true,
    mantissa: 2,
  });
};

// Helper function to format currency in Brazilian Portuguese style
export const formatCurrencyBR = (value: number) => {
  return numbro(value).formatCurrency({
    thousandSeparated: true,
    mantissa: 2,
    currencySymbol: 'R$',
  });
};

export default numbro;
