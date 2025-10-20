import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { StocksRepository } from '../repositories/stocks.repository';
import { StocksResponseDto } from '../dto/stocks-response.dto';
import { BuyStockDto } from '../dto/buy-stock.dto';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { UsersService } from '../../users/services/users.service';
import { Transaction } from '@prisma/client';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  constructor(
    private readonly stocksRepository: StocksRepository,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStocks(nextToken?: string): Promise<StocksResponseDto> {
    const cacheKey = `stocks:list${nextToken ? `:${nextToken}` : ''}`;

    const cachedData = await this.cacheManager.get<StocksResponseDto>(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cachedData;
    }

    this.logger.log(
      `Cache miss - Fetching stocks from vendor ${nextToken ? `with token: ${nextToken}` : '(first page)'}`,
    );

    const response =
      await this.stocksRepository.fetchStocksFromVendor(nextToken);

    const result: StocksResponseDto = {
      items: response.data.items,
      nextToken: response.data.nextToken,
    };

    await this.cacheManager.set(cacheKey, result, 180000);
    this.logger.log(`Cached stocks data with key: ${cacheKey}`);

    return result;
  }

  async buyStock(
    symbol: string,
    buyStockDto: BuyStockDto,
  ): Promise<Transaction> {
    this.logger.log(
      `User ${buyStockDto.email} attempting to buy ${symbol} x${buyStockDto.quantity} @ ${buyStockDto.price}`,
    );

    const user = await this.usersService.getUserByEmail(buyStockDto.email);

    try {
      const vendorResponse = await this.stocksRepository.buyStockFromVendor(
        symbol,
        {
          price: buyStockDto.price,
          quantity: buyStockDto.quantity,
        },
      );

      const isSuccess =
        vendorResponse.status === 200 &&
        (vendorResponse.data?.success === true ||
          vendorResponse.data?.order !== undefined);

      if (isSuccess) {
        this.logger.log(
          `Transaction successful for user ${user.email} - ${symbol} x${buyStockDto.quantity}`,
        );

        return this.transactionsService.createTransaction(
          user.id,
          symbol,
          buyStockDto.price,
          buyStockDto.quantity,
          'SUCCESS',
          vendorResponse.data,
        );
      }

      const failureMessage =
        vendorResponse.message ||
        vendorResponse.data?.message ||
        vendorResponse.error?.message ||
        'Stock purchase failed';

      this.logger.warn(
        `Transaction failed for user ${user.email} - ${symbol}: ${failureMessage}`,
      );

      await this.transactionsService.createTransaction(
        user.id,
        symbol,
        buyStockDto.price,
        buyStockDto.quantity,
        'FAILED',
        vendorResponse.data || vendorResponse.error,
      );

      throw new BadRequestException(failureMessage);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.error(
        `Unexpected error during purchase for user ${user.email} - ${symbol}: ${errorMessage}`,
        error instanceof Error ? error.stack : error,
      );

      await this.transactionsService.createTransaction(
        user.id,
        symbol,
        buyStockDto.price,
        buyStockDto.quantity,
        'FAILED',
        { error: errorMessage },
      );

      throw new BadRequestException(
        `Unable to complete stock purchase: ${errorMessage}`,
      );
    }
  }
}
