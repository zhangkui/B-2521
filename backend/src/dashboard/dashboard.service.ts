import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: number) {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const [year, mon] = currentMonth.split('-').map(Number);

    const monthStart = new Date(year, mon - 1, 1);
    const monthEnd = new Date(year, mon, 1);

    const prevMonthStart = new Date(year, mon - 2, 1);
    const prevMonthEnd = monthStart;

    const [
      totalBalanceAgg,
      currentIncomeAgg,
      currentExpenseAgg,
      prevIncomeAgg,
      prevExpenseAgg,
      budgetSummary,
    ] = await Promise.all([
      this.prisma.account.aggregate({
        where: { userId },
        _sum: { balance: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: CategoryType.INCOME,
          transactionDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: CategoryType.EXPENSE,
          transactionDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
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
      this.getBudgetSummary(userId, currentMonth),
    ]);

    const totalBalance = totalBalanceAgg._sum.balance?.toNumber() || 0;
    const currentIncome = currentIncomeAgg._sum.amount?.toNumber() || 0;
    const currentExpense = currentExpenseAgg._sum.amount?.toNumber() || 0;
    const prevIncome = prevIncomeAgg._sum.amount?.toNumber() || 0;
    const prevExpense = prevExpenseAgg._sum.amount?.toNumber() || 0;

    const incomeChange =
      prevIncome > 0
        ? Math.round(((currentIncome - prevIncome) / prevIncome) * 10000) / 100
        : currentIncome > 0
          ? 100
          : 0;

    const expenseChange =
      prevExpense > 0
        ? Math.round(((currentExpense - prevExpense) / prevExpense) * 10000) / 100
        : currentExpense > 0
          ? 100
          : 0;

    return {
      totalBalance,
      currentMonth: {
        income: currentIncome,
        expense: currentExpense,
      },
      prevMonth: {
        income: prevIncome,
        expense: prevExpense,
      },
      incomeChange,
      expenseChange,
      budget: budgetSummary,
    };
  }

  async getChartData(userId: number, period: 'week' | 'month' = 'week') {
    const now = new Date();

    if (period === 'week') {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      const days: string[] = [];
      const incomeData: number[] = [];
      const expenseData: number[] = [];

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(weekStart);
        dayStart.setDate(weekStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);

        days.push(
          dayStart.toLocaleDateString('zh-CN', { weekday: 'short' }),
        );

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

      return { labels: days, income: incomeData, expense: expenseData };
    }

    const [year, mon] = [now.getFullYear(), now.getMonth()];
    const monthStart = new Date(year, mon, 1);
    const daysInMonth = new Date(year, mon + 1, 0).getDate();

    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStart = new Date(year, mon, i);
      const dayEnd = new Date(year, mon, i + 1);

      labels.push(`${i}日`);

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

  private async getBudgetSummary(userId: number, month: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, month },
    });

    if (budgets.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        percentage: 0,
      };
    }

    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);

    const totalBudget = budgets.reduce(
      (sum, b) => sum + b.amount.toNumber(),
      0,
    );

    const categoryIds = budgets.map((b) => b.categoryId);

    const expenses = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: CategoryType.EXPENSE,
        categoryId: { in: categoryIds },
        transactionDate: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
    });

    const totalSpent = expenses._sum.amount?.toNumber() || 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      percentage:
        totalBudget > 0
          ? Math.round((totalSpent / totalBudget) * 100)
          : 0,
    };
  }
}
