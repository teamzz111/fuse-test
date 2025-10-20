import { Module } from '@nestjs/common';
import { StocksController } from './controllers/stocks.controller';
import { StocksService } from './services/stocks.service';
import { StocksRepository } from './repositories/stocks.repository';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';

@Module({
  imports: [TransactionsModule, UsersModule, PortfoliosModule],
  controllers: [StocksController],
  providers: [StocksService, StocksRepository],
  exports: [StocksService],
})
export class StocksModule {}
