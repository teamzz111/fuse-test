import { Injectable } from '@nestjs/common';
import { VendorClientService } from '../../shared/services/vendor-client.service';
import { VENDOR_ENDPOINTS } from '../../shared/constants/vendor.constants';
import { VendorStocksResponse } from '../interfaces/stock.interface';
import {
  VendorBuyStockRequest,
  VendorBuyStockResponse,
} from '../interfaces/buy-stock.interface';

@Injectable()
export class StocksRepository {
  constructor(private readonly vendorClient: VendorClientService) {}

  async fetchStocksFromVendor(
    nextToken?: string,
  ): Promise<VendorStocksResponse> {
    return this.vendorClient.get<VendorStocksResponse>(
      VENDOR_ENDPOINTS.STOCKS,
      nextToken ? { nextToken } : undefined,
    );
  }

  async buyStockFromVendor(
    symbol: string,
    request: VendorBuyStockRequest,
  ): Promise<VendorBuyStockResponse> {
    return this.vendorClient.post<VendorBuyStockResponse>(
      VENDOR_ENDPOINTS.BUY_STOCK(symbol),
      {
        price: request.price,
        quantity: request.quantity,
      },
    );
  }
}
