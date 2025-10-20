import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { PortfolioResponseDto } from '../dto/portfolio-response.dto';
import { Portfolio } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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

  async updatePortfolio(
    userId: string,
    symbol: string,
    quantity: number,
    price: number,
  ): Promise<Portfolio> {
    this.logger.log(
      `Updating portfolio for user ${userId} - ${symbol} x${quantity} @ ${price}`,
    );

    const existingPortfolio = await this.prisma.portfolio.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol,
        },
      },
    });

    if (existingPortfolio) {
      const currentQuantity = Number(existingPortfolio.quantity);
      const currentAvgPrice = existingPortfolio.avgPrice
        ? Number(existingPortfolio.avgPrice)
        : 0;

      const newQuantity = currentQuantity + quantity;
      const newAvgPrice =
        (currentQuantity * currentAvgPrice + quantity * price) / newQuantity;

      this.logger.log(
        `Existing portfolio found - updating from ${currentQuantity} @ ${currentAvgPrice} to ${newQuantity} @ ${newAvgPrice.toFixed(2)}`,
      );

      return this.prisma.portfolio.update({
        where: {
          userId_symbol: {
            userId,
            symbol,
          },
        },
        data: {
          quantity: new Decimal(newQuantity),
          avgPrice: new Decimal(newAvgPrice.toFixed(2)),
        },
      });
    }

    this.logger.log(`Creating new portfolio entry for ${symbol}`);

    return this.prisma.portfolio.create({
      data: {
        userId,
        symbol,
        quantity: new Decimal(quantity),
        avgPrice: new Decimal(price.toFixed(2)),
      },
    });
  }
}
