import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ReportService } from './report.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly reportService: ReportService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendDailyReports() {
    this.logger.log('Starting daily report generation and delivery');

    const recipients = this.configService
      .get<string>('DAILY_REPORT_RECIPIENTS', '')
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (recipients.length === 0) {
      this.logger.warn('No recipients configured for daily reports');
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    for (const recipient of recipients) {
      try {
        await this.reportService.sendDailyReport(recipient, yesterday);
        this.logger.log(`Report sent successfully to ${recipient}`);
      } catch (error) {
        this.logger.error(
          `Failed to send report to ${recipient}`,
          error instanceof Error ? error.stack : error,
        );
      }
    }

    this.logger.log('Daily report delivery completed');
  }
}
