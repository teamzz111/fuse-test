import { Module } from '@nestjs/common';
import { PortfoliosController } from './controllers/portfolios.controller';
import { PortfoliosService } from './services/portfolios.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [UsersModule, PrismaModule],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
