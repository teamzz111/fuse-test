export const VENDOR_ENDPOINTS = {
  STOCKS: '/stocks',
  BUY_STOCK: (symbol: string) => `/stocks/${symbol}/buy`,
} as const;
