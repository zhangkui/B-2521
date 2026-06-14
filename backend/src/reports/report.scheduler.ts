import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { ReportPeriod } from '@prisma/client';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(private reportsService: ReportsService) {}

  @Cron(CronExpression.EVERY_MONDAY_1AM, {
    name: 'generate_weekly_reports',
    timeZone: 'Asia/Shanghai',
  })
  async handleWeeklyReports() {
    this.logger.log('开始生成周报...');
    try {
      const result = await this.reportsService.generateReportsForPeriod(ReportPeriod.WEEKLY);
      this.logger.log(
        `周报表生成完成：总计 ${result.total} 个订阅，成功 ${result.results.filter((r) => r.status === 'created').length} 个，已存在 ${result.results.filter((r) => r.status === 'existed').length} 个，失败 ${result.results.filter((r) => r.status === 'error').length} 个`,
      );
    } catch (error) {
      this.logger.error('周报表生成失败', error);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    name: 'generate_monthly_reports',
    timeZone: 'Asia/Shanghai',
  })
  async handleMonthlyReports() {
    this.logger.log('开始生成月报...');
    try {
      const result = await this.reportsService.generateReportsForPeriod(ReportPeriod.MONTHLY);
      this.logger.log(
        `月报表生成完成：总计 ${result.total} 个订阅，成功 ${result.results.filter((r) => r.status === 'created').length} 个，已存在 ${result.results.filter((r) => r.status === 'existed').length} 个，失败 ${result.results.filter((r) => r.status === 'error').length} 个`,
      );
    } catch (error) {
      this.logger.error('月报表生成失败', error);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'report_scheduler_heartbeat',
  })
  async handleHeartbeat() {
    this.logger.debug('定时任务调度器运行正常');
  }
}
