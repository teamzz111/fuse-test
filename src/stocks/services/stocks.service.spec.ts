import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { StocksService } from './stocks.service';
import { StocksRepository } from '../repositories/stocks.repository';
import { VendorStocksResponse } from '../interfaces/stock.interface';

describe('StocksService', () => {
  let service: StocksService;
  let repository: StocksRepository;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        {
          provide: StocksRepository,
          useValue: {
            fetchStocksFromVendor: jest.fn(),
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
});
