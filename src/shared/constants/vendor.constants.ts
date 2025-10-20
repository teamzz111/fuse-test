export const VENDOR_ENDPOINTS = {
  STOCKS: '/stocks',
  BUY_STOCK: (symbol: string) => `/stocks/${symbol}/buy`,
} as const;

export const TRANSACTION_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;
