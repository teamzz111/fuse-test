import { Test, TestingModule } from '@nestjs/testing';
import { StocksController } from './stocks.controller';
import { StocksService } from '../services/stocks.service';
import { GetStocksQueryDto } from '../dto/get-stocks-query.dto';
import { StocksResponseDto } from '../dto/stocks-response.dto';

describe('StocksController', () => {
  let controller: StocksController;
  let service: StocksService;

  const mockStocksResponse: StocksResponseDto = {
    items: [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.5 },
    ],
    nextToken: 'next-page-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [
        {
          provide: StocksService,
          useValue: {
            getStocks: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StocksController>(StocksController);
    service = module.get<StocksService>(StocksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStocks', () => {
    it('should return stocks without nextToken', async () => {
      // Arrange
      const query: GetStocksQueryDto = {};
      jest.spyOn(service, 'getStocks').mockResolvedValue(mockStocksResponse);

      // Act
      const result = await controller.getStocks(query);

      // Assert
      expect(result).toEqual(mockStocksResponse);
      expect(service.getStocks).toHaveBeenCalledWith(undefined);
      expect(service.getStocks).toHaveBeenCalledTimes(1);
    });

    it('should return stocks with nextToken for pagination', async () => {
      // Arrange
      const nextToken = 'abc123';
      const query: GetStocksQueryDto = { nextToken };
      const paginatedResponse: StocksResponseDto = {
        items: [{ symbol: 'MSFT', name: 'Microsoft', price: 300.0 }],
        nextToken: 'xyz789',
      };
      jest.spyOn(service, 'getStocks').mockResolvedValue(paginatedResponse);

      // Act
      const result = await controller.getStocks(query);

      // Assert
      expect(result).toEqual(paginatedResponse);
      expect(service.getStocks).toHaveBeenCalledWith(nextToken);
      expect(service.getStocks).toHaveBeenCalledTimes(1);
    });

    it('should return empty nextToken when last page', async () => {
      // Arrange
      const query: GetStocksQueryDto = {};
      const lastPageResponse: StocksResponseDto = {
        items: [{ symbol: 'TSLA', name: 'Tesla Inc.', price: 700.0 }],
        nextToken: undefined,
      };
      jest.spyOn(service, 'getStocks').mockResolvedValue(lastPageResponse);

      // Act
      const result = await controller.getStocks(query);

      // Assert
      expect(result).toEqual(lastPageResponse);
      expect(result.nextToken).toBeUndefined();
      expect(service.getStocks).toHaveBeenCalledTimes(1);
    });

    it('should handle empty stocks list', async () => {
      // Arrange
      const query: GetStocksQueryDto = {};
      const emptyResponse: StocksResponseDto = {
        items: [],
        nextToken: undefined,
      };
      jest.spyOn(service, 'getStocks').mockResolvedValue(emptyResponse);

      // Act
      const result = await controller.getStocks(query);

      // Assert
      expect(result).toEqual(emptyResponse);
      expect(result.items).toHaveLength(0);
      expect(service.getStocks).toHaveBeenCalledTimes(1);
    });
  });
});
