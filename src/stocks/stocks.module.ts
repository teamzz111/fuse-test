import { Module } from '@nestjs/common';
import { StocksController } from './controllers/stocks.controller';
import { StocksService } from './services/stocks.service';
import { StocksRepository } from './repositories/stocks.repository';

@Module({
  controllers: [StocksController],
  providers: [StocksService, StocksRepository],
  exports: [StocksService],
})
export class StocksModule {}
