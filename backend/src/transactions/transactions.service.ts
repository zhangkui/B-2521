import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  QueryTransactionDto,
} from './dto/transactions.dto';
import { CategoryType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private async validateAccount(userId: number, accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException('账户不存在');
    }
    if (account.userId !== userId) {
      throw new ForbiddenException('无权使用此账户');
    }
    return account;
  }

  private async validateCategory(userId: number, categoryId: number, expectedType?: CategoryType) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('无权使用此分类');
    }
    if (expectedType && category.type !== expectedType) {
      throw new BadRequestException(`分类类型应为 ${expectedType}`);
    }
    return category;
  }

  private async updateAccountBalance(
    accountId: number,
    type: CategoryType,
    amount: number,
    reverse: boolean = false,
  ) {
    const signedAmount = type === CategoryType.INCOME ? amount : -amount;
    const adjustment = reverse ? -signedAmount : signedAmount;

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: adjustment,
        },
      },
    });
  }

  async create(userId: number, createTransactionDto: CreateTransactionDto) {
    const account = await this.validateAccount(userId, createTransactionDto.accountId);
    await this.validateCategory(userId, createTransactionDto.categoryId, createTransactionDto.type);

    if (
      createTransactionDto.type === CategoryType.EXPENSE &&
      createTransactionDto.amount > account.balance.toNumber()
    ) {
      throw new BadRequestException('账户余额不足');
    }

    const tagIds = createTransactionDto.tagIds || [];
    if (tagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds }, userId },
      });
      if (tags.length !== tagIds.length) {
        throw new BadRequestException('部分标签不存在或无权访问');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          accountId: createTransactionDto.accountId,
          categoryId: createTransactionDto.categoryId,
          type: createTransactionDto.type,
          amount: createTransactionDto.amount,
          transactionDate: new Date(createTransactionDto.transactionDate),
          description: createTransactionDto.description,
          note: createTransactionDto.note,
          userId,
        },
        include: {
          account: { select: { id: true, name: true, icon: true, color: true } },
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
        },
      });

      if (tagIds.length > 0) {
        await tx.transactionTag.createMany({
          data: tagIds.map((tagId) => ({
            transactionId: transaction.id,
            tagId,
          })),
        });
      }

      await tx.account.update({
        where: { id: createTransactionDto.accountId },
        data: {
          balance: {
            increment:
              createTransactionDto.type === CategoryType.INCOME
                ? createTransactionDto.amount
                : -createTransactionDto.amount,
          },
        },
      });

      const transactionWithTags = await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          account: { select: { id: true, name: true, icon: true, color: true } },
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
          tags: {
            include: { tag: true },
          },
        },
      });

      return transactionWithTags;
    });

    return result;
  }

  async findAll(userId: number, query: QueryTransactionDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };

    if (query.type) {
      where.type = query.type;
    }
    if (query.accountId) {
      where.accountId = query.accountId;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) {
        where.transactionDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.transactionDate.lte = new Date(query.endDate);
      }
    }
    if (query.keyword) {
      where.OR = [
        { description: { contains: query.keyword } },
        { note: { contains: query.keyword } },
      ];
    }

    if (query.tagIds && query.tagIds.length > 0) {
      const tagMode = query.tagMode || 'OR';
      if (tagMode === 'AND') {
        where.AND = query.tagIds.map((tagId) => ({
          tags: {
            some: { tagId },
          },
        }));
      } else {
        where.tags = {
          some: {
            tagId: { in: query.tagIds },
          },
        };
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { transactionDate: 'desc' },
        include: {
          account: { select: { id: true, name: true, icon: true, color: true } },
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalIncome = await this.prisma.transaction.aggregate({
      where: { ...where, type: CategoryType.INCOME },
      _sum: { amount: true },
    });

    const totalExpense = await this.prisma.transaction.aggregate({
      where: { ...where, type: CategoryType.EXPENSE },
      _sum: { amount: true },
    });

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalIncome: totalIncome._sum.amount?.toNumber() || 0,
        totalExpense: totalExpense._sum.amount?.toNumber() || 0,
        netBalance:
          (totalIncome._sum.amount?.toNumber() || 0) -
          (totalExpense._sum.amount?.toNumber() || 0),
      },
    };
  }

  async findOne(userId: number, id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, icon: true, color: true } },
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('交易记录不存在');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('无权访问此交易记录');
    }

    return transaction;
  }

  async update(
    userId: number,
    id: number,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('交易记录不存在');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('无权修改此交易记录');
    }

    const newAccountId = updateTransactionDto.accountId ?? existing.accountId;
    const newCategoryId = updateTransactionDto.categoryId ?? existing.categoryId;
    const newType = updateTransactionDto.type ?? existing.type;
    const newAmount = updateTransactionDto.amount ?? existing.amount.toNumber();

    await this.validateAccount(userId, newAccountId);
    await this.validateCategory(userId, newCategoryId, newType);

    const tagIds = updateTransactionDto.tagIds;
    if (tagIds && tagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds }, userId },
      });
      if (tags.length !== tagIds.length) {
        throw new BadRequestException('部分标签不存在或无权访问');
      }
    }

    const oldAccountId = existing.accountId;
    const oldType = existing.type;
    const oldAmount = existing.amount.toNumber();

    const result = await this.prisma.$transaction(async (tx) => {
      if (oldAccountId === newAccountId) {
        const oldSigned = oldType === CategoryType.INCOME ? -oldAmount : oldAmount;
        const newSigned = newType === CategoryType.INCOME ? newAmount : -newAmount;
        const balanceChange = oldSigned + newSigned;

        if (balanceChange !== 0) {
          if (balanceChange < 0) {
            const account = await tx.account.findUnique({ where: { id: newAccountId } });
            if (account.balance.toNumber() + balanceChange < 0) {
              throw new BadRequestException('账户余额不足');
            }
          }

          await tx.account.update({
            where: { id: newAccountId },
            data: { balance: { increment: balanceChange } },
          });
        }
      } else {
        await this.validateAccount(userId, newAccountId);

        const oldReturn = oldType === CategoryType.INCOME ? -oldAmount : oldAmount;
        const newAccount = await tx.account.findUnique({ where: { id: newAccountId } });
        const newCharge = newType === CategoryType.INCOME ? newAmount : -newAmount;

        if (newCharge < 0 && newAccount.balance.toNumber() + newCharge < 0) {
          throw new BadRequestException('转入账户余额不足');
        }

        await tx.account.update({
          where: { id: oldAccountId },
          data: { balance: { increment: oldReturn } },
        });

        await tx.account.update({
          where: { id: newAccountId },
          data: { balance: { increment: newCharge } },
        });
      }

      const updateData: any = {};
      if (updateTransactionDto.accountId !== undefined) updateData.accountId = updateTransactionDto.accountId;
      if (updateTransactionDto.categoryId !== undefined) updateData.categoryId = updateTransactionDto.categoryId;
      if (updateTransactionDto.type !== undefined) updateData.type = updateTransactionDto.type;
      if (updateTransactionDto.amount !== undefined) updateData.amount = updateTransactionDto.amount;
      if (updateTransactionDto.transactionDate !== undefined) {
        updateData.transactionDate = new Date(updateTransactionDto.transactionDate);
      }
      if (updateTransactionDto.description !== undefined) updateData.description = updateTransactionDto.description;
      if (updateTransactionDto.note !== undefined) updateData.note = updateTransactionDto.note;

      const updated = await tx.transaction.update({
        where: { id },
        data: updateData,
        include: {
          account: { select: { id: true, name: true, icon: true, color: true } },
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
        },
      });

      if (tagIds !== undefined) {
        await tx.transactionTag.deleteMany({
          where: { transactionId: id },
        });

        if (tagIds.length > 0) {
          await tx.transactionTag.createMany({
            data: tagIds.map((tagId) => ({
              transactionId: id,
              tagId,
            })),
          });
        }
      }

      return tx.transaction.findUnique({
        where: { id },
        include: {
          account: { select: { id: true, name: true, icon: true, color: true } },
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
          tags: {
            include: { tag: true },
          },
        },
      });
    });

    return result;
  }

  async remove(userId: number, id: number) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('交易记录不存在');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('无权删除此交易记录');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: existing.accountId },
        data: {
          balance: {
            increment:
              existing.type === CategoryType.INCOME
                ? -existing.amount.toNumber()
                : existing.amount.toNumber(),
          },
        },
      });

      await tx.transaction.delete({ where: { id } });
    });

    return { message: '交易记录删除成功' };
  }

  async getStatistics(userId: number, query: QueryTransactionDto) {
    const where: any = { userId };

    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) {
        where.transactionDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.transactionDate.lte = new Date(query.endDate);
      }
    }

    const totalIncomeAgg = await this.prisma.transaction.aggregate({
      where: { ...where, type: CategoryType.INCOME },
      _sum: { amount: true },
    });

    const totalExpenseAgg = await this.prisma.transaction.aggregate({
      where: { ...where, type: CategoryType.EXPENSE },
      _sum: { amount: true },
    });

    const categoryStats = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where,
      _sum: { amount: true },
      _count: true,
    });

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
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const incomeByCategory = categoryStats
      .filter((s) => s.type === CategoryType.INCOME)
      .map((s) => ({
        category: categoryMap.get(s.categoryId),
        totalAmount: s._sum.amount?.toNumber() || 0,
        count: s._count,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      summary: {
        totalIncome: totalIncomeAgg._sum.amount?.toNumber() || 0,
        totalExpense: totalExpenseAgg._sum.amount?.toNumber() || 0,
        netBalance:
          (totalIncomeAgg._sum.amount?.toNumber() || 0) -
          (totalExpenseAgg._sum.amount?.toNumber() || 0),
      },
      expenseByCategory,
      incomeByCategory,
    };
  }
}
