import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StocksService } from '../services/stocks.service';
import { StocksResponseDto } from '../dto/stocks-response.dto';
import { GetStocksQueryDto } from '../dto/get-stocks-query.dto';
import { BuyStockDto } from '../dto/buy-stock.dto';
import { Transaction } from '@prisma/client';

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

  @Post(':symbol/buy')
  @HttpCode(HttpStatus.CREATED)
  async buyStock(
    @Param('symbol') symbol: string,
    @Body() buyStockDto: BuyStockDto,
  ): Promise<Transaction> {
    return this.stocksService.buyStock(symbol, buyStockDto);
  }
}
