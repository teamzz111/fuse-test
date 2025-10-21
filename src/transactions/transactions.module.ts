import { Module } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransactionsRepository } from './repositories/transactions.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TransactionsService, TransactionsRepository],
  exports: [TransactionsService],
})
export class TransactionsModule {}
