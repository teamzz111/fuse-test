export interface Stock {
  symbol: string;
  name: string;
  price: number;
  lastUpdated?: string;
}

export interface VendorStocksResponse {
  status: number;
  data: {
    items: Stock[];
    nextToken?: string;
  };
}
