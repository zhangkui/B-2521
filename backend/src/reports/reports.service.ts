import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyReport(userId: number, month?: string) {
    const now = new Date();
    const targetMonth = month || now.toISOString().slice(0, 7);
    const [year, mon] = targetMonth.split('-').map(Number);

    const monthStart = new Date(year, mon - 1, 1);
    const monthEnd = new Date(year, mon, 1);

    const prevMonthStart = new Date(year, mon - 2, 1);
    const prevMonthEnd = monthStart;

    const [
      incomeAgg,
      expenseAgg,
      prevIncomeAgg,
      prevExpenseAgg,
      categoryStats,
      accountStats,
      budgets,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: CategoryType.INCOME,
          transactionDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: CategoryType.EXPENSE,
          transactionDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: CategoryType.INCOME,
          transactionDate: { gte: prevMonthStart, lt: prevMonthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: CategoryType.EXPENSE,
          transactionDate: { gte: prevMonthStart, lt: prevMonthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId', 'type'],
        where: {
          userId,
          transactionDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.groupBy({
        by: ['accountId', 'type'],
        where: {
          userId,
          transactionDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.budget.findMany({
        where: { userId, month: targetMonth },
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true, type: true },
          },
        },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount?.toNumber() || 0;
    const totalExpense = expenseAgg._sum.amount?.toNumber() || 0;
    const prevIncome = prevIncomeAgg._sum.amount?.toNumber() || 0;
    const prevExpense = prevExpenseAgg._sum.amount?.toNumber() || 0;

    const incomeChange =
      prevIncome > 0
        ? Math.round(((totalIncome - prevIncome) / prevIncome) * 10000) / 100
        : totalIncome > 0
          ? 100
          : 0;

    const expenseChange =
      prevExpense > 0
        ? Math.round(((totalExpense - prevExpense) / prevExpense) * 10000) / 100
        : totalExpense > 0
          ? 100
          : 0;

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0
      ? Math.round((netSavings / totalIncome) * 10000) / 100
      : 0;

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
        percentage: totalExpense > 0
          ? Math.round(((s._sum.amount?.toNumber() || 0) / totalExpense) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const incomeByCategory = categoryStats
      .filter((s) => s.type === CategoryType.INCOME)
      .map((s) => ({
        category: categoryMap.get(s.categoryId),
        totalAmount: s._sum.amount?.toNumber() || 0,
        count: s._count,
        percentage: totalIncome > 0
          ? Math.round(((s._sum.amount?.toNumber() || 0) / totalIncome) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const accountIds = accountStats.map((s) => s.accountId);
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true, icon: true, color: true, balance: true },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const expenseByAccount = accountStats
      .filter((s) => s.type === CategoryType.EXPENSE)
      .map((s) => ({
        account: accountMap.get(s.accountId),
        totalAmount: s._sum.amount?.toNumber() || 0,
        count: s._count,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const incomeByAccount = accountStats
      .filter((s) => s.type === CategoryType.INCOME)
      .map((s) => ({
        account: accountMap.get(s.accountId),
        totalAmount: s._sum.amount?.toNumber() || 0,
        count: s._count,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const totalBudget = budgets.reduce(
      (sum, b) => sum + b.amount.toNumber(),
      0,
    );

    const budgetCategoryIds = budgets.map((b) => b.categoryId);
    const budgetExpenses = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: CategoryType.EXPENSE,
        categoryId: { in: budgetCategoryIds },
        transactionDate: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    });

    const totalBudgetSpent = budgetExpenses._sum.amount?.toNumber() || 0;

    const budgetItems = budgets.map((budget) => {
      const catExpense = categoryStats.find(
        (s) => s.categoryId === budget.categoryId && s.type === CategoryType.EXPENSE,
      );
      const spent = catExpense?._sum.amount?.toNumber() || 0;
      return {
        id: budget.id,
        category: budget.category,
        amount: budget.amount.toNumber(),
        spent,
        remaining: budget.amount.toNumber() - spent,
        percentage: budget.amount.toNumber() > 0
          ? Math.round((spent / budget.amount.toNumber()) * 10000) / 100
          : 0,
      };
    });

    const topExpenseCategory = expenseByCategory[0] || null;
    const topIncomeCategory = incomeByCategory[0] || null;

    const tagStats = await this.getTagStats(userId, monthStart, monthEnd);

    const dailyData = await this.getDailyStats(userId, year, mon);

    const narrative = this.generateNarrative({
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      prevIncome,
      prevExpense,
      incomeChange,
      expenseChange,
      incomeCount: incomeAgg._count,
      expenseCount: expenseAgg._count,
      topExpenseCategory,
      topIncomeCategory,
      budgetPercentage: totalBudget > 0
        ? Math.round((totalBudgetSpent / totalBudget) * 10000) / 100
        : 0,
      totalBudget,
      totalBudgetSpent,
    });

    return {
      month: targetMonth,
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        incomeCount: incomeAgg._count,
        expenseCount: expenseAgg._count,
      },
      comparison: {
        prevIncome,
        prevExpense,
        incomeChange,
        expenseChange,
      },
      expenseByCategory,
      incomeByCategory,
      expenseByAccount,
      incomeByAccount,
      budget: {
        totalBudget,
        totalSpent: totalBudgetSpent,
        totalRemaining: totalBudget - totalBudgetSpent,
        percentage: totalBudget > 0
          ? Math.round((totalBudgetSpent / totalBudget) * 10000) / 100
          : 0,
        items: budgetItems,
      },
      highlights: {
        topExpenseCategory,
        topIncomeCategory,
      },
      tagStats,
      narrative,
      dailyStats: dailyData,
    };
  }

  private async getTagStats(
    userId: number,
    monthStart: Date,
    monthEnd: Date,
  ) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: monthStart, lt: monthEnd },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const tagExpenseMap = new Map<number, { tag: any; totalAmount: number; count: number }>();
    const tagIncomeMap = new Map<number, { tag: any; totalAmount: number; count: number }>();

    for (const tx of transactions) {
      for (const tt of tx.tags) {
        const tag = tt.tag;
        const map = tx.type === CategoryType.EXPENSE ? tagExpenseMap : tagIncomeMap;
        const existing = map.get(tag.id);
        if (existing) {
          existing.totalAmount += tx.amount.toNumber();
          existing.count += 1;
        } else {
          map.set(tag.id, {
            tag: { id: tag.id, name: tag.name, color: tag.color },
            totalAmount: tx.amount.toNumber(),
            count: 1,
          });
        }
      }
    }

    const totalExpense = transactions
      .filter((t) => t.type === CategoryType.EXPENSE)
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const totalIncome = transactions
      .filter((t) => t.type === CategoryType.INCOME)
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const expenseByTag = Array.from(tagExpenseMap.values())
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0
          ? Math.round((item.totalAmount / totalExpense) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const incomeByTag = Array.from(tagIncomeMap.values())
      .map((item) => ({
        ...item,
        percentage: totalIncome > 0
          ? Math.round((item.totalAmount / totalIncome) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const untaggedExpense = transactions
      .filter((t) => t.type === CategoryType.EXPENSE && t.tags.length === 0)
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const untaggedIncome = transactions
      .filter((t) => t.type === CategoryType.INCOME && t.tags.length === 0)
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    return {
      expenseByTag,
      incomeByTag,
      untaggedExpense,
      untaggedIncome,
    };
  }

  private generateNarrative(data: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
    prevIncome: number;
    prevExpense: number;
    incomeChange: number;
    expenseChange: number;
    incomeCount: number;
    expenseCount: number;
    topExpenseCategory: any;
    topIncomeCategory: any;
    budgetPercentage: number;
    totalBudget: number;
    totalBudgetSpent: number;
  }): string {
    const parts: string[] = [];

    parts.push(
      `本月共记录 ${data.incomeCount} 笔收入（¥${data.totalIncome.toFixed(2)}）和 ${data.expenseCount} 笔支出（¥${data.totalExpense.toFixed(2)}），`,
    );

    if (data.netSavings >= 0) {
      parts.push(`结余 ¥${data.netSavings.toFixed(2)}，储蓄率 ${data.savingsRate}%。`);
    } else {
      parts.push(`透支 ¥${Math.abs(data.netSavings).toFixed(2)}，支出超过收入。`);
    }

    if (data.incomeChange !== 0) {
      if (data.incomeChange > 0) {
        parts.push(`收入较上月增长 ${data.incomeChange}%，`);
      } else {
        parts.push(`收入较上月下降 ${Math.abs(data.incomeChange)}%，`);
      }
    }

    if (data.expenseChange !== 0) {
      if (data.expenseChange > 0) {
        parts.push(`支出较上月增加 ${data.expenseChange}%。`);
      } else {
        parts.push(`支出较上月减少 ${Math.abs(data.expenseChange)}%。`);
      }
    }

    if (data.topExpenseCategory) {
      parts.push(
        `最大支出类目为「${data.topExpenseCategory.category.name}」，占比 ${data.topExpenseCategory.percentage}%。`,
      );
    }

    if (data.topIncomeCategory) {
      parts.push(
        `最大收入来源为「${data.topIncomeCategory.category.name}」，占比 ${data.topIncomeCategory.percentage}%。`,
      );
    }

    if (data.totalBudget > 0) {
      if (data.budgetPercentage <= 80) {
        parts.push(`预算执行 ${data.budgetPercentage}%，消费控制在预算范围内。`);
      } else if (data.budgetPercentage <= 100) {
        parts.push(`预算执行 ${data.budgetPercentage}%，已接近预算上限，需注意控制支出。`);
      } else {
        parts.push(`预算执行 ${data.budgetPercentage}%，已超出预算，建议下月加强管控。`);
      }
    }

    if (data.savingsRate >= 30) {
      parts.push('储蓄表现优秀，继续保持！');
    } else if (data.savingsRate >= 20) {
      parts.push('储蓄率良好，建议保持。');
    } else if (data.savingsRate >= 10) {
      parts.push('储蓄率一般，建议适当减少非必要支出。');
    } else if (data.netSavings >= 0) {
      parts.push('储蓄率偏低，建议审视消费结构，寻找节省空间。');
    } else {
      parts.push('本月入不敷出，建议尽快调整收支结构。');
    }

    return parts.join('');
  }

  private async getDailyStats(
    userId: number,
    year: number,
    month: number,
  ) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month - 1, day);
      const dayEnd = new Date(year, month - 1, day + 1);

      labels.push(`${day}`);

      const [income, expense] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: CategoryType.INCOME,
            transactionDate: { gte: dayStart, lt: dayEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: CategoryType.EXPENSE,
            transactionDate: { gte: dayStart, lt: dayEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      incomeData.push(income._sum.amount?.toNumber() || 0);
      expenseData.push(expense._sum.amount?.toNumber() || 0);
    }

    return { labels, income: incomeData, expense: expenseData };
  }
}
