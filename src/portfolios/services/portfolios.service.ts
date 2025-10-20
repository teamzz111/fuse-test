import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { PortfolioResponseDto } from '../dto/portfolio-response.dto';

@Injectable()
export class PortfoliosService {
  private readonly logger = new Logger(PortfoliosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getUserPortfolio(email: string): Promise<PortfolioResponseDto> {
    const user = await this.usersService.getUserByEmail(email);

    this.logger.log(`Fetching portfolio for user ${user.email}`);

    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId: user.id },
      orderBy: { symbol: 'asc' },
    });

    return {
      userId: user.id,
      email: user.email,
      items: portfolios.map((p) => ({
        symbol: p.symbol,
        quantity: Number(p.quantity),
        avgPrice: p.avgPrice ? Number(p.avgPrice) : null,
      })),
    };
  }
}
