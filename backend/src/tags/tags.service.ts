import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType } from '@prisma/client';
import {
  CreateTagDto,
  UpdateTagDto,
  TagTransactionDto,
  QueryTagStatsDto,
  QueryTagTrendDto,
} from './dto/tags.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createTagDto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { userId_name: { userId, name: createTagDto.name } },
    });
    if (existing) {
      throw new ConflictException('标签名称已存在');
    }

    return this.prisma.tag.create({
      data: { ...createTagDto, userId },
    });
  }

  async findAll(userId: number) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: number, id: number) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('标签不存在');
    if (tag.userId !== userId) throw new ForbiddenException('无权访问此标签');
    return tag;
  }

  async update(userId: number, id: number, updateTagDto: UpdateTagDto) {
    await this.findOne(userId, id);

    if (updateTagDto.name) {
      const existing = await this.prisma.tag.findUnique({
        where: { userId_name: { userId, name: updateTagDto.name } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('标签名称已存在');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });
  }

  async remove(userId: number, id: number) {
    await this.findOne(userId, id);
    await this.prisma.tag.delete({ where: { id } });
    return { message: '标签删除成功' };
  }

  async tagTransaction(userId: number, dto: TagTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
    });
    if (!transaction) throw new NotFoundException('交易记录不存在');
    if (transaction.userId !== userId) throw new ForbiddenException('无权访问此交易记录');

    const tags = await this.prisma.tag.findMany({
      where: { userId, id: { in: dto.tagIds } },
    });
    if (tags.length !== dto.tagIds.length) {
      throw new NotFoundException('部分标签不存在');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transactionTag.deleteMany({
        where: { transactionId: dto.transactionId },
      });
      await tx.transactionTag.createMany({
        data: dto.tagIds.map((tagId) => ({
          transactionId: dto.transactionId,
          tagId,
        })),
      });
    });

    return this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      include: { tags: { include: { tag: true } } },
    });
  }

  async getTransactionTags(userId: number, transactionId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundException('交易记录不存在');
    if (transaction.userId !== userId) throw new ForbiddenException('无权访问此交易记录');

    const result = await this.prisma.transactionTag.findMany({
      where: { transactionId },
      include: { tag: true },
    });
    return result.map((r) => r.tag);
  }

  async getTagStats(userId: number, query: QueryTagStatsDto) {
    const where: any = { userId };

    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) where.transactionDate.gte = new Date(query.startDate);
      if (query.endDate) where.transactionDate.lte = new Date(query.endDate);
    }
    if (query.type) where.type = query.type;

    const allTags = await this.prisma.tag.findMany({ where: { userId } });

    const rawStats = await this.prisma.transactionTag.findMany({
      where: {
        transaction: where,
      },
      include: {
        transaction: true,
        tag: true,
      },
    });

    const incomeTotal = rawStats
      .filter((r) => r.transaction.type === CategoryType.INCOME)
      .reduce((s, r) => s + r.transaction.amount.toNumber(), 0);

    const expenseTotal = rawStats
      .filter((r) => r.transaction.type === CategoryType.EXPENSE)
      .reduce((s, r) => s + r.transaction.amount.toNumber(), 0);

    const tagStatsMap = new Map<
      number,
      {
        tag: any;
        incomeAmount: number;
        expenseAmount: number;
        incomeCount: number;
        expenseCount: number;
      }
    >();

    allTags.forEach((tag) => {
      tagStatsMap.set(tag.id, {
        tag,
        incomeAmount: 0,
        expenseAmount: 0,
        incomeCount: 0,
        expenseCount: 0,
      });
    });

    rawStats.forEach((r) => {
      const stat = tagStatsMap.get(r.tagId);
      if (!stat) return;
      if (r.transaction.type === CategoryType.INCOME) {
        stat.incomeAmount += r.transaction.amount.toNumber();
        stat.incomeCount += 1;
      } else {
        stat.expenseAmount += r.transaction.amount.toNumber();
        stat.expenseCount += 1;
      }
    });

    const stats = Array.from(tagStatsMap.values())
      .filter((s) => s.incomeCount > 0 || s.expenseCount > 0)
      .map((s) => ({
        tag: s.tag,
        income: {
          amount: s.incomeAmount,
          count: s.incomeCount,
          percentage: incomeTotal > 0 ? (s.incomeAmount / incomeTotal) * 100 : 0,
        },
        expense: {
          amount: s.expenseAmount,
          count: s.expenseCount,
          percentage: expenseTotal > 0 ? (s.expenseAmount / expenseTotal) * 100 : 0,
        },
        total: {
          amount: s.incomeAmount + s.expenseAmount,
          count: s.incomeCount + s.expenseCount,
        },
      }))
      .sort((a, b) => b.total.amount - a.total.amount);

    return {
      summary: {
        incomeTotal,
        expenseTotal,
        netTotal: incomeTotal - expenseTotal,
        transactionCount: rawStats.length,
      },
      stats,
    };
  }

  async getTagTrend(userId: number, query: QueryTagTrendDto) {
    const granularity = query.granularity || 'day';
    const periods = query.periods || (granularity === 'day' ? 7 : granularity === 'week' ? 8 : 6);

    const now = new Date();
    const endDate = query.endDate ? new Date(query.endDate) : now;
    const startDate = query.startDate ? new Date(query.startDate) : this.getStartDate(endDate, granularity, periods);

    const dateRanges = this.generateDateRanges(startDate, endDate, granularity);

    const where: any = {
      userId,
      transactionDate: { gte: startDate, lte: endDate },
    };
    if (query.tagId) where.tags = { some: { tagId: query.tagId } };

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { tags: { include: { tag: true } } },
    });

    const tagMap = new Map<number, string>();
    if (query.tagId) {
      const tag = await this.prisma.tag.findUnique({ where: { id: query.tagId } });
      if (tag) tagMap.set(tag.id, tag.name);
    } else {
      const allTags = await this.prisma.tag.findMany({ where: { userId } });
      allTags.forEach((t) => tagMap.set(t.id, t.name));
    }

    const tagTrendMap = new Map<number, Map<string, { income: number; expense: number; count: number }>>();

    dateRanges.forEach(({ key }) => {
      tagMap.forEach((_name, tagId) => {
        if (!tagTrendMap.has(tagId)) {
          tagTrendMap.set(tagId, new Map());
        }
        tagTrendMap.get(tagId)!.set(key, { income: 0, expense: 0, count: 0 });
      });
    });

    transactions.forEach((t) => {
      const dateKey = this.getDateKey(t.transactionDate, granularity);
      const tags = query.tagId ? t.tags.filter((tt) => tt.tagId === query.tagId) : t.tags;

      tags.forEach((tt) => {
        const trend = tagTrendMap.get(tt.tagId)?.get(dateKey);
        if (trend) {
          if (t.type === CategoryType.INCOME) {
            trend.income += t.amount.toNumber();
          } else {
            trend.expense += t.amount.toNumber();
          }
          trend.count += 1;
        }
      });
    });

    const labels = dateRanges.map(({ key, label }) => ({ key, label }));

    const trends = Array.from(tagTrendMap.entries()).map(([tagId, dataMap]) => {
      const tagName = tagMap.get(tagId) || '未知';
      const incomeData: number[] = [];
      const expenseData: number[] = [];
      const countData: number[] = [];

      dateRanges.forEach(({ key }) => {
        const data = dataMap.get(key) || { income: 0, expense: 0, count: 0 };
        incomeData.push(data.income);
        expenseData.push(data.expense);
        countData.push(data.count);
      });

      const incomeChange = this.calculateChange(incomeData);
      const expenseChange = this.calculateChange(expenseData);

      return {
        tagId,
        tagName,
        labels,
        income: incomeData,
        expense: expenseData,
        count: countData,
        incomeChange,
        expenseChange,
      };
    });

    return {
      granularity,
      labels,
      trends,
    };
  }

  private getStartDate(endDate: Date, granularity: string, periods: number): Date {
    const d = new Date(endDate);
    if (granularity === 'day') {
      d.setDate(d.getDate() - periods + 1);
    } else if (granularity === 'week') {
      d.setDate(d.getDate() - periods * 7 + 1);
    } else {
      d.setMonth(d.getMonth() - periods + 1);
      d.setDate(1);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private generateDateRanges(
    startDate: Date,
    endDate: Date,
    granularity: string,
  ): { key: string; label: string; start: Date; end: Date }[] {
    const ranges: { key: string; label: string; start: Date; end: Date }[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const rangeStart = new Date(current);
      let rangeEnd: Date;
      let key: string;
      let label: string;

      if (granularity === 'day') {
        rangeEnd = new Date(current);
        rangeEnd.setDate(rangeEnd.getDate() + 1);
        key = rangeStart.toISOString().slice(0, 10);
        label = `${rangeStart.getMonth() + 1}/${rangeStart.getDate()}`;
        current.setDate(current.getDate() + 1);
      } else if (granularity === 'week') {
        const dayOfWeek = rangeStart.getDay() || 7;
        const weekStart = new Date(rangeStart);
        weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);
        rangeEnd = new Date(weekStart);
        rangeEnd.setDate(rangeEnd.getDate() + 7);
        const year = weekStart.getFullYear();
        const weekNum = this.getWeekNumber(weekStart);
        key = `${year}-W${weekNum}`;
        label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}周`;
        current.setDate(current.getDate() + 7);
      } else {
        rangeEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        label = `${current.getFullYear()}年${current.getMonth() + 1}月`;
        current.setMonth(current.getMonth() + 1);
      }

      ranges.push({ key, label, start: rangeStart, end: rangeEnd });
    }

    return ranges;
  }

  private getDateKey(date: Date, granularity: string): string {
    if (granularity === 'day') {
      return date.toISOString().slice(0, 10);
    } else if (granularity === 'week') {
      const year = date.getFullYear();
      const weekNum = this.getWeekNumber(date);
      return `${year}-W${weekNum}`;
    } else {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  }

  private calculateChange(data: number[]): number {
    if (data.length < 2) return 0;
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }
}
