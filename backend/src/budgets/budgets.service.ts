import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  QueryBudgetDto,
} from './dto/budgets.dto';
import { CategoryType } from '@prisma/client';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createBudgetDto: CreateBudgetDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: createBudgetDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('无权使用此分类');
    }

    if (category.type !== CategoryType.EXPENSE) {
      throw new BadRequestException('预算只能设置在支出分类上');
    }

    const existing = await this.prisma.budget.findUnique({
      where: {
        userId_categoryId_month: {
          userId,
          categoryId: createBudgetDto.categoryId,
          month: createBudgetDto.month,
        },
      },
    });

    if (existing) {
      return this.prisma.budget.update({
        where: { id: existing.id },
        data: { amount: createBudgetDto.amount },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
        },
      });
    }

    return this.prisma.budget.create({
      data: {
        ...createBudgetDto,
        userId,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
      },
    });
  }

  async findAll(userId: number, query?: QueryBudgetDto) {
    const where: any = { userId };

    if (query?.month) {
      where.month = query.month;
    }

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return budgets;
  }

  async getSummary(userId: number, month: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, month },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
      },
    });

    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);

    const totalBudget = budgets.reduce(
      (sum, b) => sum + b.amount.toNumber(),
      0,
    );

    const categoryIds = budgets.map((b) => b.categoryId);

    const expenses = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: CategoryType.EXPENSE,
        categoryId: { in: categoryIds },
        transactionDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: { amount: true },
    });

    const expenseMap = new Map(
      expenses.map((e) => [e.categoryId, e._sum.amount?.toNumber() || 0]),
    );

    const items = budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      category: b.category,
      amount: b.amount.toNumber(),
      spent: expenseMap.get(b.categoryId) || 0,
      month: b.month,
    }));

    const totalSpent = items.reduce((sum, i) => sum + i.spent, 0);

    return {
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      percentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      items,
    };
  }

  async findOne(userId: number, id: number) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
      },
    });

    if (!budget) {
      throw new NotFoundException('预算不存在');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('无权访问此预算');
    }

    return budget;
  }

  async update(userId: number, id: number, updateBudgetDto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('预算不存在');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('无权修改此预算');
    }

    if (updateBudgetDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateBudgetDto.categoryId },
      });

      if (!category || category.userId !== userId) {
        throw new ForbiddenException('分类不存在或无权访问');
      }

      if (category.type !== CategoryType.EXPENSE) {
        throw new BadRequestException('预算只能设置在支出分类上');
      }
    }

    const newMonth = updateBudgetDto.month || budget.month;
    const newCategoryId = updateBudgetDto.categoryId || budget.categoryId;

    if (updateBudgetDto.month || updateBudgetDto.categoryId) {
      const existing = await this.prisma.budget.findUnique({
        where: {
          userId_categoryId_month: {
            userId,
            categoryId: newCategoryId,
            month: newMonth,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('该分类在该月份已有预算');
      }
    }

    return this.prisma.budget.update({
      where: { id },
      data: updateBudgetDto,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
      },
    });
  }

  async remove(userId: number, id: number) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new NotFoundException('预算不存在');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('无权删除此预算');
    }

    await this.prisma.budget.delete({ where: { id } });

    return { message: '预算删除成功' };
  }
}
