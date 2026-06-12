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

    const dailyData = await this.getDailyStats(userId, year, mon);

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
      dailyStats: dailyData,
    };
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
