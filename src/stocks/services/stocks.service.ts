import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { StocksRepository } from '../repositories/stocks.repository';
import { StocksResponseDto } from '../dto/stocks-response.dto';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  constructor(
    private readonly stocksRepository: StocksRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStocks(nextToken?: string): Promise<StocksResponseDto> {
    const cacheKey = `stocks:list${nextToken ? `:${nextToken}` : ''}`;

    // Check cache first
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

    // Store in cache with TTL (3 minutes)
    await this.cacheManager.set(cacheKey, result, 180000);
    this.logger.log(`Cached stocks data with key: ${cacheKey}`);

    return result;
  }
}
