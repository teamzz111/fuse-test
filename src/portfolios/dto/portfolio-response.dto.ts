import { ApiProperty } from '@nestjs/swagger';

export class PortfolioItemDto {
  @ApiProperty({
    description: 'Stock symbol',
    example: 'AAPL',
  })
  symbol: string;

  @ApiProperty({
    description: 'Quantity of stocks owned',
    example: 10,
  })
  quantity: number;

  @ApiProperty({
    description: 'Average purchase price',
    example: 150.25,
    nullable: true,
  })
  avgPrice: number | null;
}

export class PortfolioResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '37c84a9d-57c7-4bd2-8973-1868e5a1cd7e',
  })
  userId: string;

  @ApiProperty({
    description: 'User email',
    example: 'andres.largo@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'List of portfolio items',
    type: [PortfolioItemDto],
  })
  items: PortfolioItemDto[];
}
