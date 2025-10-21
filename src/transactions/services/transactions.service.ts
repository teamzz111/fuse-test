import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { TransactionsRepository } from '../repositories/transactions.repository';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async createTransaction(
    userId: string,
    symbol: string,
    price: number,
    quantity: number,
    status: 'SUCCESS' | 'FAILED',
    vendorResponse?: JsonValue,
  ): Promise<Transaction> {
    this.logger.log(
      `Creating transaction: ${status} - ${symbol} x${quantity} @ ${price} for user ${userId}`,
    );

    return this.transactionsRepository.create({
      userId,
      symbol,
      price,
      quantity,
      status,
      vendorResponse,
    });
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionsRepository.findByUserId(userId);
  }

  async getDailyTransactions(date: Date): Promise<Transaction[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.transactionsRepository.findByDateRange(startOfDay, endOfDay);
  }
}
