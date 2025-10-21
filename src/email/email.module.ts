import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { ReportService } from './services/report.service';
import { SchedulerService } from './services/scheduler.service';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [ConfigModule, TransactionsModule],
  providers: [EmailService, ReportService, SchedulerService],
  exports: [EmailService, ReportService],
})
export class EmailModule {}
