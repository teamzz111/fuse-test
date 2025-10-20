import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Transaction } from '@prisma/client';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTransactionDto): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        userId: data.userId,
        symbol: data.symbol,
        price: data.price,
        quantity: data.quantity,
        status: data.status,
        vendorResponse: data.vendorResponse as object | undefined,
      },
    });
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({
      where: { id },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }
}
