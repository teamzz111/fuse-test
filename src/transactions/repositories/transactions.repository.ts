import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Transaction } from '@prisma/client';

export interface CreateTransactionDto {
  userId: string;
  symbol: string;
  price: number;
  quantity: number;
  status: 'SUCCESS' | 'FAILED';
  vendorResponse?: any;
}

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
        vendorResponse: data.vendorResponse,
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
}
