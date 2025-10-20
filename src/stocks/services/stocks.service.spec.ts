import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
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
  let cacheManager: any;

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
    price: new (require('@prisma/client').Prisma.Decimal)(150.25),
    quantity: new (require('@prisma/client').Prisma.Decimal)(10),
    status: 'SUCCESS' as const,
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
    it('should return cached data when cache hit', async () => {
      const cachedData = {
        items: mockStocksResponse.data.items,
        nextToken: mockStocksResponse.data.nextToken,
      };

      cacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getStocks();

      expect(result).toEqual(cachedData);
      expect(cacheManager.get).toHaveBeenCalledWith('stocks:list');
      expect(repository.fetchStocksFromVendor).not.toHaveBeenCalled();
    });

    it('should fetch from vendor and cache when cache miss', async () => {
      cacheManager.get.mockResolvedValue(null);
      jest
        .spyOn(repository, 'fetchStocksFromVendor')
        .mockResolvedValue(mockStocksResponse);

      const result = await service.getStocks();

      expect(result).toEqual({
        items: mockStocksResponse.data.items,
        nextToken: mockStocksResponse.data.nextToken,
      });
      expect(cacheManager.get).toHaveBeenCalledWith('stocks:list');
      expect(repository.fetchStocksFromVendor).toHaveBeenCalledWith(undefined);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'stocks:list',
        {
          items: mockStocksResponse.data.items,
          nextToken: mockStocksResponse.data.nextToken,
        },
        180000,
      );
    });

    it('should use correct cache key when nextToken is provided', async () => {
      const nextToken = 'abc123';
      cacheManager.get.mockResolvedValue(null);
      jest
        .spyOn(repository, 'fetchStocksFromVendor')
        .mockResolvedValue(mockStocksResponse);

      await service.getStocks(nextToken);

      expect(cacheManager.get).toHaveBeenCalledWith(`stocks:list:${nextToken}`);
      expect(repository.fetchStocksFromVendor).toHaveBeenCalledWith(nextToken);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `stocks:list:${nextToken}`,
        expect.any(Object),
        180000,
      );
    });

    it('should handle pagination correctly', async () => {
      const nextToken = 'next-page-token';
      const paginatedResponse: VendorStocksResponse = {
        status: 200,
        data: {
          items: [{ symbol: 'MSFT', name: 'Microsoft', price: 300.0 }],
          nextToken: 'another-token',
        },
      };

      cacheManager.get.mockResolvedValue(null);
      jest
        .spyOn(repository, 'fetchStocksFromVendor')
        .mockResolvedValue(paginatedResponse);

      const result = await service.getStocks(nextToken);

      expect(result.items).toHaveLength(1);
      expect(result.nextToken).toBe('another-token');
    });
  });

  describe('buyStock', () => {
    const buyStockDto = {
      email: 'test@example.com',
      price: 150.25,
      quantity: 10,
    };

    it('should successfully buy stock when vendor returns order', async () => {
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

      expect(usersService.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(repository.buyStockFromVendor).toHaveBeenCalledWith('AAPL', {
        price: 150.25,
        quantity: 10,
      });
      expect(transactionsService.createTransaction).toHaveBeenCalledWith(
        'user-123',
        'AAPL',
        150.25,
        10,
        'SUCCESS',
        vendorResponse.data,
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should successfully buy stock when vendor returns success flag', async () => {
      const vendorResponse: VendorBuyStockResponse = {
        status: 200,
        data: {
          success: true,
          message: 'Purchase successful',
          transactionId: 'txn-123',
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

      expect(transactionsService.createTransaction).toHaveBeenCalledWith(
        'user-123',
        'AAPL',
        150.25,
        10,
        'SUCCESS',
        vendorResponse.data,
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException when vendor rejects purchase', async () => {
      const vendorResponse: VendorBuyStockResponse = {
        status: 200,
        data: {
          success: false,
          message: 'Price validation failed',
        },
      };

      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(repository, 'buyStockFromVendor')
        .mockResolvedValue(vendorResponse);
      jest
        .spyOn(transactionsService, 'createTransaction')
        .mockResolvedValue({ ...mockTransaction, status: 'FAILED' });

      await expect(service.buyStock('AAPL', buyStockDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.buyStock('AAPL', buyStockDto)).rejects.toThrow(
        'Price validation failed',
      );

      expect(transactionsService.createTransaction).toHaveBeenCalledWith(
        'user-123',
        'AAPL',
        150.25,
        10,
        'FAILED',
        vendorResponse.data,
      );
    });

    it('should throw BadRequestException with error message from vendor', async () => {
      const vendorResponse: VendorBuyStockResponse = {
        status: 200,
        error: {
          message: 'Insufficient funds',
          code: 'FUNDS_ERROR',
        },
      };

      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(repository, 'buyStockFromVendor')
        .mockResolvedValue(vendorResponse);
      jest
        .spyOn(transactionsService, 'createTransaction')
        .mockResolvedValue({ ...mockTransaction, status: 'FAILED' });

      await expect(service.buyStock('AAPL', buyStockDto)).rejects.toThrow(
        'Insufficient funds',
      );

      expect(transactionsService.createTransaction).toHaveBeenCalledWith(
        'user-123',
        'AAPL',
        150.25,
        10,
        'FAILED',
        vendorResponse.error,
      );
    });

    it('should handle unexpected errors and create failed transaction', async () => {
      const error = new Error('Network error');

      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'buyStockFromVendor').mockRejectedValue(error);
      jest
        .spyOn(transactionsService, 'createTransaction')
        .mockResolvedValue({ ...mockTransaction, status: 'FAILED' });

      await expect(service.buyStock('AAPL', buyStockDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.buyStock('AAPL', buyStockDto)).rejects.toThrow(
        'Unable to complete stock purchase: Network error',
      );

      expect(transactionsService.createTransaction).toHaveBeenCalledWith(
        'user-123',
        'AAPL',
        150.25,
        10,
        'FAILED',
        { error: 'Network error' },
      );
    });

    it('should rethrow BadRequestException without wrapping', async () => {
      const badRequestError = new BadRequestException('Price too low');

      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(repository, 'buyStockFromVendor')
        .mockRejectedValue(badRequestError);

      await expect(service.buyStock('AAPL', buyStockDto)).rejects.toThrow(
        badRequestError,
      );
      expect(transactionsService.createTransaction).not.toHaveBeenCalled();
    });

    it('should throw default message when no error message available', async () => {
      const vendorResponse: VendorBuyStockResponse = {
        status: 200,
        data: {},
      };

      jest.spyOn(usersService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest
        .spyOn(repository, 'buyStockFromVendor')
        .mockResolvedValue(vendorResponse);
      jest
        .spyOn(transactionsService, 'createTransaction')
        .mockResolvedValue({ ...mockTransaction, status: 'FAILED' });

      await expect(service.buyStock('AAPL', buyStockDto)).rejects.toThrow(
        'Stock purchase failed',
      );
    });
  });
});
