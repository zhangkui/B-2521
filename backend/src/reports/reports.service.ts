import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType, ReportPeriod } from '@prisma/client';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  QueryReportDto,
  GenerateReportDto,
} from './dto/reports.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async createSubscription(userId: number, dto: CreateSubscriptionDto) {
    const existing = await this.prisma.reportSubscription.findUnique({
      where: { userId_period: { userId, period: dto.period } },
    });
    if (existing) {
      throw new ConflictException('该周期的订阅已存在');
    }

    return this.prisma.reportSubscription.create({
      data: { userId, period: dto.period },
    });
  }

  async getSubscriptions(userId: number) {
    return this.prisma.reportSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSubscription(userId: number, id: number, dto: UpdateSubscriptionDto) {
    const sub = await this.prisma.reportSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('订阅不存在');
    if (sub.userId !== userId) throw new ForbiddenException('无权访问此订阅');

    return this.prisma.reportSubscription.update({
      where: { id },
      data: dto,
    });
  }

  async removeSubscription(userId: number, id: number) {
    const sub = await this.prisma.reportSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('订阅不存在');
    if (sub.userId !== userId) throw new ForbiddenException('无权访问此订阅');

    await this.prisma.reportSubscription.delete({ where: { id } });
    return { message: '订阅已取消' };
  }

  async generateReport(userId: number, dto: GenerateReportDto) {
    const { period, periodKey } = this.resolvePeriod(dto.period, dto.periodKey);
    const { startDate, endDate } = this.getDateRange(period, periodKey);

    const title = this.generateTitle(period, periodKey);

    const existing = await this.prisma.report.findUnique({
      where: { userId_period_periodKey: { userId, period, periodKey } },
    });
    if (existing) {
      return existing;
    }

    const content = await this.buildReportContent(userId, startDate, endDate);

    const report = await this.prisma.report.create({
      data: {
        userId,
        title,
        period,
        periodKey,
        startDate,
        endDate,
        content,
      },
    });

    const sub = await this.prisma.reportSubscription.findUnique({
      where: { userId_period: { userId, period } },
    });
    if (sub) {
      await this.prisma.reportSubscription.update({
        where: { id: sub.id },
        data: { lastGeneratedAt: new Date() },
      });
    }

    return report;
  }

  async getReports(userId: number, query: QueryReportDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (query.period) where.period = query.period;

    const [list, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getReportDetail(userId: number, id: number) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('报表不存在');
    if (report.userId !== userId) throw new ForbiddenException('无权访问此报表');
    return report;
  }

  async deleteReport(userId: number, id: number) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('报表不存在');
    if (report.userId !== userId) throw new ForbiddenException('无权访问此报表');

    await this.prisma.report.delete({ where: { id } });
    return { message: '报表已删除' };
  }

  async generateReportsForPeriod(period: ReportPeriod) {
    const subscriptions = await this.prisma.reportSubscription.findMany({
      where: { period, isActive: true },
    });

    const results = [];
    for (const sub of subscriptions) {
      try {
        const periodKey = this.getPreviousPeriodKey(period);
        const { startDate, endDate } = this.getDateRange(period, periodKey);
        const title = this.generateTitle(period, periodKey);

        const existing = await this.prisma.report.findUnique({
          where: { userId_period_periodKey: { userId: sub.userId, period, periodKey } },
        });
        if (existing) {
          results.push({ userId: sub.userId, status: 'existed', reportId: existing.id });
          continue;
        }

        const content = await this.buildReportContent(sub.userId, startDate, endDate);
        const report = await this.prisma.report.create({
          data: {
            userId: sub.userId,
            title,
            period,
            periodKey,
            startDate,
            endDate,
            content,
          },
        });

        await this.prisma.reportSubscription.update({
          where: { id: sub.id },
          data: { lastGeneratedAt: new Date() },
        });

        results.push({ userId: sub.userId, status: 'created', reportId: report.id });
      } catch (error) {
        results.push({ userId: sub.userId, status: 'error', error: String(error) });
      }
    }

    return { total: subscriptions.length, results };
  }

  private getPreviousPeriodKey(period: ReportPeriod): string {
    const now = new Date();
    if (period === ReportPeriod.MONTHLY) {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const year = lastWeek.getFullYear();
      const weekNum = this.getWeekNumber(lastWeek);
      return `${year}-W${weekNum}`;
    }
  }

  private resolvePeriod(period: ReportPeriod, periodKey?: string) {
    if (periodKey) return { period, periodKey };

    const now = new Date();
    if (period === ReportPeriod.MONTHLY) {
      periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const year = now.getFullYear();
      const weekNum = this.getWeekNumber(now);
      periodKey = `${year}-W${weekNum}`;
    }
    return { period, periodKey };
  }

  private getDateRange(period: ReportPeriod, periodKey: string): { startDate: Date; endDate: Date } {
    if (period === ReportPeriod.MONTHLY) {
      const [year, month] = periodKey.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      return { startDate, endDate };
    } else {
      const [yearStr, weekStr] = periodKey.split('-W');
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);
      const jan4 = new Date(year, 0, 4);
      const dayOfWeek = jan4.getDay() || 7;
      const jan1Monday = new Date(jan4);
      jan1Monday.setDate(jan4.getDate() - dayOfWeek + 1);
      const startDate = new Date(jan1Monday);
      startDate.setDate(jan1Monday.getDate() + (week - 1) * 7);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      return { startDate, endDate };
    }
  }

  private generateTitle(period: ReportPeriod, periodKey: string): string {
    if (period === ReportPeriod.MONTHLY) {
      const [year, month] = periodKey.split('-');
      return `${year}年${parseInt(month)}月个人财务报表`;
    } else {
      const [year, weekStr] = periodKey.split('-W');
      return `${year}年第${parseInt(weekStr)}周个人财务报表`;
    }
  }

  private async buildReportContent(userId: number, startDate: Date, endDate: Date) {
    const where: any = {
      userId,
      transactionDate: { gte: startDate, lt: endDate },
    };

    const [
      totalIncomeAgg,
      totalExpenseAgg,
      transactions,
      categoryStats,
      tagStats,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: CategoryType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: CategoryType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId', 'type'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transactionTag.findMany({
        where: { transaction: where },
        include: { transaction: true, tag: true },
      }),
    ]);

    const totalIncome = totalIncomeAgg._sum.amount?.toNumber() || 0;
    const totalExpense = totalExpenseAgg._sum.amount?.toNumber() || 0;
    const netBalance = totalIncome - totalExpense;

    const categoryIds = categoryStats.map((s) => s.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true, color: true, type: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const expenseByCategory = categoryStats
      .filter((s) => s.type === CategoryType.EXPENSE)
      .map((s) => ({
        category: categoryMap.get(s.categoryId),
        totalAmount: s._sum.amount?.toNumber() || 0,
        count: s._count,
        percentage: totalExpense > 0 ? ((s._sum.amount?.toNumber() || 0) / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const incomeByCategory = categoryStats
      .filter((s) => s.type === CategoryType.INCOME)
      .map((s) => ({
        category: categoryMap.get(s.categoryId),
        totalAmount: s._sum.amount?.toNumber() || 0,
        count: s._count,
        percentage: totalIncome > 0 ? ((s._sum.amount?.toNumber() || 0) / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const tagMap = new Map<number, any>();
    tagStats.forEach((ts) => {
      if (!tagMap.has(ts.tagId)) {
        tagMap.set(ts.tagId, {
          tag: ts.tag,
          incomeAmount: 0,
          expenseAmount: 0,
          incomeCount: 0,
          expenseCount: 0,
        });
      }
      const stat = tagMap.get(ts.tagId)!;
      if (ts.transaction.type === CategoryType.INCOME) {
        stat.incomeAmount += ts.transaction.amount.toNumber();
        stat.incomeCount += 1;
      } else {
        stat.expenseAmount += ts.transaction.amount.toNumber();
        stat.expenseCount += 1;
      }
    });

    const tagSummary = Array.from(tagMap.values())
      .map((s) => ({
        tag: s.tag,
        income: { amount: s.incomeAmount, count: s.incomeCount },
        expense: { amount: s.expenseAmount, count: s.expenseCount },
        total: s.incomeAmount + s.expenseAmount,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: transactions.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      incomeByCategory,
      expenseByCategory,
      tagSummary,
      recentTransactions: transactions.slice(0, 50),
    };
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  }
}
