import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { StocksService } from './stocks.service';
import { StocksRepository } from '../repositories/stocks.repository';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { UsersService } from '../../users/services/users.service';
import { VendorStocksResponse } from '../interfaces/stock.interface';
import { VendorBuyStockResponse } from '../interfaces/buy-stock.interface';

describe('StocksService', () => {
  let service: StocksService;
  let repository: StocksRepository;
  let transactionsService: TransactionsService;
  let usersService: UsersService;
  let cacheManager: jest.Mocked<Cache>;

  const mockStocksResponse: VendorStocksResponse = {
    status: 200,
    data: {
      items: [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.5 },
      ],
      nextToken: 'next-page-token',
    },
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: null,
    createdAt: new Date(),
  };

  const mockTransaction = {
    id: 'transaction-123',
    userId: 'user-123',
    symbol: 'AAPL',
    price: new Prisma.Decimal(150.25),
    quantity: new Prisma.Decimal(10),
    status: 'SUCCESS',
    vendorResponse: {},
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: StocksRepository,
          useValue: {
            fetchStocksFromVendor: jest.fn(),
            buyStockFromVendor: jest.fn(),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            createTransaction: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserByEmail: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
    repository = module.get<StocksRepository>(StocksRepository);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    usersService = module.get<UsersService>(UsersService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStocks', () => {
    it('should fetch from vendor and cache data', async () => {
      cacheManager.get.mockResolvedValue(null);
      jest
        .spyOn(repository, 'fetchStocksFromVendor')
        .mockResolvedValue(mockStocksResponse);

      const result = await service.getStocks();

      expect(result).toEqual({
        items: mockStocksResponse.data.items,
        nextToken: mockStocksResponse.data.nextToken,
      });
      expect(repository.fetchStocksFromVendor).toHaveBeenCalledWith(undefined);
    });
  });

  describe('buyStock', () => {
    const buyStockDto = {
      email: 'test@example.com',
      price: 150.25,
      quantity: 10,
    };

    it('should buy stock successfully', async () => {
      const vendorResponse: VendorBuyStockResponse = {
        status: 200,
        message: 'Order placed successfully',
        data: {
          order: {
            symbol: 'AAPL',
            quantity: 10,
            price: 150.25,
            total: 1502.5,
          },
        },
      };

      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(repository, 'buyStockFromVendor')
        .mockResolvedValue(vendorResponse);
      jest
        .spyOn(transactionsService, 'createTransaction')
        .mockResolvedValue(mockTransaction);

      const result = await service.buyStock('AAPL', buyStockDto);

      expect(result).toEqual(mockTransaction);
    });

    it('should handle purchase errors', async () => {
      const error = new Error('Network error');

      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'buyStockFromVendor').mockRejectedValue(error);
      jest
        .spyOn(transactionsService, 'createTransaction')
        .mockResolvedValue({ ...mockTransaction, status: 'FAILED' });

      await expect(service.buyStock('AAPL', buyStockDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
