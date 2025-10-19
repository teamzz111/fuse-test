import { Injectable, Logger } from '@nestjs/common';
import { StocksRepository } from '../repositories/stocks.repository';
import { StocksResponseDto } from '../dto/stocks-response.dto';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  constructor(private readonly stocksRepository: StocksRepository) {}

  async getStocks(nextToken?: string): Promise<StocksResponseDto> {
    this.logger.log(
      `Fetching stocks ${nextToken ? `with token: ${nextToken}` : '(first page)'}`,
    );

    const response =
      await this.stocksRepository.fetchStocksFromVendor(nextToken);

    return {
      items: response.data.items,
      nextToken: response.data.nextToken,
    };
  }
}
