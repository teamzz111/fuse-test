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
import { ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StocksService } from '../services/stocks.service';
import { StocksResponseDto } from '../dto/stocks-response.dto';
import { GetStocksQueryDto } from '../dto/get-stocks-query.dto';
import { BuyStockDto } from '../dto/buy-stock.dto';
import { Transaction } from '@prisma/client';

@ApiTags('stocks')
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'List of stocks retrieved successfully',
    type: StocksResponseDto,
  })
  async getStocks(
    @Query() query: GetStocksQueryDto,
  ): Promise<StocksResponseDto> {
    return this.stocksService.getStocks(query.nextToken);
  }

  @Post(':symbol/buy')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({
    name: 'symbol',
    description: 'Stock symbol to purchase',
    example: 'AAPL',
  })
  @ApiResponse({
    status: 201,
    description: 'Stock purchased successfully',
  })
  async buyStock(
    @Param('symbol') symbol: string,
    @Body() buyStockDto: BuyStockDto,
  ): Promise<Transaction> {
    return this.stocksService.buyStock(symbol, buyStockDto);
  }
}
