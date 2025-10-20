import { IsEmail, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuyStockDto {
  @ApiProperty({
    description: 'Email of the user making the purchase',
    example: 'andres.largo@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Price of the stock at the time of purchase',
    example: 150.25,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Quantity of stocks to purchase',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}
