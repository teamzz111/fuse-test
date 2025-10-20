import { JsonValue } from '@prisma/client/runtime/library';

export interface CreateTransactionDto {
  userId: string;
  symbol: string;
  price: number;
  quantity: number;
  status: 'SUCCESS' | 'FAILED';
  vendorResponse?: JsonValue;
}
