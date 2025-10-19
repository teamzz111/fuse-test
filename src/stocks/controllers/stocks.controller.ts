import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { StocksService } from '../services/stocks.service';
import { StocksResponseDto } from '../dto/stocks-response.dto';
import { GetStocksQueryDto } from '../dto/get-stocks-query.dto';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getStocks(
    @Query() query: GetStocksQueryDto,
  ): Promise<StocksResponseDto> {
    return this.stocksService.getStocks(query.nextToken);
  }
}
