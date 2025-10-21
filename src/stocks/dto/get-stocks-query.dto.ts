import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetStocksQueryDto {
  @ApiPropertyOptional({
    description: 'Token for pagination to get the next page of stocks',
  })
  @IsOptional()
  @IsString()
  nextToken?: string;
}
