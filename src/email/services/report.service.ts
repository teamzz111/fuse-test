import { Injectable, Logger } from '@nestjs/common';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { EmailService } from './email.service';
import { Transaction } from '@prisma/client';
import { TRANSACTION_STATUS } from '../../shared/constants/vendor.constants';

interface DailyReportData {
  date: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  transactions: Transaction[];
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly emailService: EmailService,
  ) {}

  async generateDailyReport(date: Date = new Date()): Promise<DailyReportData> {
    const transactions =
      await this.transactionsService.getDailyTransactions(date);

    const successful = transactions.filter(
      (t) => t.status === TRANSACTION_STATUS.SUCCESS,
    );
    const failed = transactions.filter(
      (t) => t.status === TRANSACTION_STATUS.FAILED,
    );

    return {
      date: date.toISOString().split('T')[0],
      totalTransactions: transactions.length,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      transactions,
    };
  }

  async sendDailyReport(
    recipientEmail: string,
    date: Date = new Date(),
  ): Promise<void> {
    const report = await this.generateDailyReport(date);

    const html = this.buildReportHtml(report);

    await this.emailService.sendEmail({
      to: recipientEmail,
      subject: `Daily Stock Trading Report - ${report.date}`,
      html,
    });

    this.logger.log(
      `Daily report sent to ${recipientEmail} for ${report.date}`,
    );
  }

  private buildReportHtml(report: DailyReportData): string {
    const successful = report.transactions.filter(
      (t) => t.status === 'SUCCESS',
    );
    const failed = report.transactions.filter((t) => t.status === 'FAILED');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .summary-item { margin: 10px 0; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            .success { color: green; font-weight: bold; }
            .failed { color: red; font-weight: bold; }
            .section { margin: 30px 0; }
          </style>
        </head>
        <body>
          <h1>Daily Stock Trading Report</h1>
          <p><strong>Date:</strong> ${report.date}</p>

          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-item">Total Transactions: <strong>${report.totalTransactions}</strong></div>
            <div class="summary-item">Successful: <strong class="success">${report.successfulTransactions}</strong></div>
            <div class="summary-item">Failed: <strong class="failed">${report.failedTransactions}</strong></div>
          </div>

          ${successful.length > 0 ? this.buildTransactionsTable('Successful Transactions', successful, 'success') : ''}
          ${failed.length > 0 ? this.buildTransactionsTable('Failed Transactions', failed, 'failed') : ''}

          ${report.totalTransactions === 0 ? '<p><em>No transactions recorded for this day.</em></p>' : ''}
        </body>
      </html>
    `;
  }

  private buildTransactionsTable(
    title: string,
    transactions: Transaction[],
    type: 'success' | 'failed',
  ): string {
    return `
      <div class="section">
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
              ${type === 'failed' ? '<th>Reason</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${transactions
              .map(
                (t) => `
              <tr>
                <td>${new Date(t.createdAt).toLocaleTimeString()}</td>
                <td>${(t as any).user?.email || 'N/A'}</td>
                <td>${t.symbol}</td>
                <td>${t.quantity.toString()}</td>
                <td>$${Number(t.price).toFixed(2)}</td>
                <td>$${(Number(t.price) * Number(t.quantity)).toFixed(2)}</td>
                ${type === 'failed' ? `<td>${this.extractFailureReason(t.vendorResponse)}</td>` : ''}
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private extractFailureReason(vendorResponse: unknown): string {
    if (!vendorResponse) return 'Unknown error';
    if (typeof vendorResponse === 'string') return vendorResponse;
    if (
      typeof vendorResponse === 'object' &&
      'message' in vendorResponse &&
      typeof vendorResponse.message === 'string'
    ) {
      return vendorResponse.message;
    }
    if (
      typeof vendorResponse === 'object' &&
      'error' in vendorResponse &&
      typeof vendorResponse.error === 'object' &&
      vendorResponse.error &&
      'message' in vendorResponse.error &&
      typeof vendorResponse.error.message === 'string'
    ) {
      return vendorResponse.error.message;
    }
    return 'Unknown error';
  }
}
