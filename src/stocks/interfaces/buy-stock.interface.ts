export interface VendorBuyStockRequest {
  price: number;
  quantity: number;
}

export interface VendorBuyStockResponse {
  status: number;
  message?: string;
  data?: {
    order?: {
      symbol: string;
      quantity: number;
      price: number;
      total: number;
    };
    success?: boolean;
    message?: string;
    transactionId?: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}
