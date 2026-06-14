import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { ReportPeriod } from '@prisma/client';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(private reportsService: ReportsService) {}

  @Cron('0 0 1 * * 1', {
    name: 'generate_weekly_reports',
    timeZone: 'Asia/Shanghai',
  })
  async handleWeeklyReports() {
    this.logger.log('开始生成周报（每周一凌晨1点）...');
    try {
      const result = await this.reportsService.generateReportsForPeriod(ReportPeriod.WEEKLY);
      const created = result.results.filter((r: any) => r.status === 'created').length;
      const existed = result.results.filter((r: any) => r.status === 'existed').length;
      const errored = result.results.filter((r: any) => r.status === 'error').length;
      this.logger.log(
        `周报表生成完成：总计 ${result.total} 个订阅，成功 ${created} 个，已存在 ${existed} 个，失败 ${errored} 个`,
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
    this.logger.log('开始生成月报（每月1日零点）...');
    try {
      const result = await this.reportsService.generateReportsForPeriod(ReportPeriod.MONTHLY);
      const created = result.results.filter((r: any) => r.status === 'created').length;
      const existed = result.results.filter((r: any) => r.status === 'existed').length;
      const errored = result.results.filter((r: any) => r.status === 'error').length;
      this.logger.log(
        `月报表生成完成：总计 ${result.total} 个订阅，成功 ${created} 个，已存在 ${existed} 个，失败 ${errored} 个`,
      );
    } catch (error) {
      this.logger.error('月报表生成失败', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'report_scheduler_heartbeat',
  })
  handleHeartbeat() {
    this.logger.debug('定时任务调度器运行正常');
  }
}
