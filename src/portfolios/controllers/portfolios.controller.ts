import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PortfoliosService } from '../services/portfolios.service';
import { PortfolioResponseDto } from '../dto/portfolio-response.dto';

@ApiTags('portfolios')
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'email',
    description: 'User email',
    example: 'andres.largo@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'User portfolio retrieved successfully',
    type: PortfolioResponseDto,
  })
  async getUserPortfolio(
    @Query('email') email: string,
  ): Promise<PortfolioResponseDto> {
    return this.portfoliosService.getUserPortfolio(email);
  }
}
