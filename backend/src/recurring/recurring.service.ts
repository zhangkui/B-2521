import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRecurringDto,
  UpdateRecurringDto,
  QueryRecurringDto,
  GenerateRecurringDto,
} from './dto/recurring.dto';
import { CategoryType, RecurringFrequency } from '@prisma/client';

@Injectable()
export class RecurringService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createRecurringDto: CreateRecurringDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: createRecurringDto.accountId },
    });
    if (!account) {
      throw new NotFoundException('账户不存在');
    }
    if (account.userId !== userId) {
      throw new ForbiddenException('无权使用此账户');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: createRecurringDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('无权使用此分类');
    }
    if (category.type !== createRecurringDto.type) {
      throw new BadRequestException(`分类类型应为 ${createRecurringDto.type}`);
    }

    const tagIds = createRecurringDto.tagIds || [];
    if (tagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds }, userId },
      });
      if (tags.length !== tagIds.length) {
        throw new BadRequestException('部分标签不存在或无权访问');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const recurring = await tx.recurringTransaction.create({
        data: {
          accountId: createRecurringDto.accountId,
          categoryId: createRecurringDto.categoryId,
          type: createRecurringDto.type,
          amount: createRecurringDto.amount,
          frequency: createRecurringDto.frequency,
          startDate: new Date(createRecurringDto.startDate),
          endDate: createRecurringDto.endDate
            ? new Date(createRecurringDto.endDate)
            : undefined,
          description: createRecurringDto.description,
          note: createRecurringDto.note,
          isActive: createRecurringDto.isActive,
          userId,
        },
        include: {
          account: { select: { id: true, name: true, icon: true, color: true } },
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
        },
      });

      if (tagIds.length > 0) {
        await tx.recurringTag.createMany({
          data: tagIds.map((tagId) => ({
            recurringId: recurring.id,
            tagId,
          })),
        });
      }

      return tx.recurringTransaction.findUnique({
        where: { id: recurring.id },
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

  async findAll(userId: number, query: QueryRecurringDto) {
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
    if (query.frequency) {
      where.frequency = query.frequency;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [list, total] = await Promise.all([
      this.prisma.recurringTransaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          account: { select: { id: true, name: true, icon: true, color: true } },
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
          tags: {
            include: { tag: true },
          },
        },
      }),
      this.prisma.recurringTransaction.count({ where }),
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

  async findOne(userId: number, id: number) {
    const recurring = await this.prisma.recurringTransaction.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true, icon: true, color: true } },
        category: { select: { id: true, name: true, icon: true, color: true, type: true } },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!recurring) {
      throw new NotFoundException('周期账单不存在');
    }

    if (recurring.userId !== userId) {
      throw new ForbiddenException('无权访问此周期账单');
    }

    return recurring;
  }

  async update(userId: number, id: number, updateRecurringDto: UpdateRecurringDto) {
    const recurring = await this.prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!recurring) {
      throw new NotFoundException('周期账单不存在');
    }

    if (recurring.userId !== userId) {
      throw new ForbiddenException('无权修改此周期账单');
    }

    if (updateRecurringDto.accountId) {
      const account = await this.prisma.account.findUnique({
        where: { id: updateRecurringDto.accountId },
      });
      if (!account || account.userId !== userId) {
        throw new ForbiddenException('无权使用此账户');
      }
    }

    if (updateRecurringDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateRecurringDto.categoryId },
      });
      if (!category || category.userId !== userId) {
        throw new ForbiddenException('无权使用此分类');
      }
    }

    const tagIds = updateRecurringDto.tagIds;
    if (tagIds && tagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds }, userId },
      });
      if (tags.length !== tagIds.length) {
        throw new BadRequestException('部分标签不存在或无权访问');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (updateRecurringDto.accountId !== undefined) updateData.accountId = updateRecurringDto.accountId;
      if (updateRecurringDto.categoryId !== undefined) updateData.categoryId = updateRecurringDto.categoryId;
      if (updateRecurringDto.type !== undefined) updateData.type = updateRecurringDto.type;
      if (updateRecurringDto.amount !== undefined) updateData.amount = updateRecurringDto.amount;
      if (updateRecurringDto.frequency !== undefined) updateData.frequency = updateRecurringDto.frequency;
      if (updateRecurringDto.startDate !== undefined) updateData.startDate = new Date(updateRecurringDto.startDate);
      if (updateRecurringDto.endDate !== undefined) {
        updateData.endDate = updateRecurringDto.endDate
          ? new Date(updateRecurringDto.endDate)
          : null;
      }
      if (updateRecurringDto.description !== undefined) updateData.description = updateRecurringDto.description;
      if (updateRecurringDto.note !== undefined) updateData.note = updateRecurringDto.note;
      if (updateRecurringDto.isActive !== undefined) updateData.isActive = updateRecurringDto.isActive;

      await tx.recurringTransaction.update({
        where: { id },
        data: updateData,
      });

      if (tagIds !== undefined) {
        await tx.recurringTag.deleteMany({
          where: { recurringId: id },
        });

        if (tagIds.length > 0) {
          await tx.recurringTag.createMany({
            data: tagIds.map((tagId) => ({
              recurringId: id,
              tagId,
            })),
          });
        }
      }

      return tx.recurringTransaction.findUnique({
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
    const recurring = await this.prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!recurring) {
      throw new NotFoundException('周期账单不存在');
    }

    if (recurring.userId !== userId) {
      throw new ForbiddenException('无权删除此周期账单');
    }

    await this.prisma.recurringTransaction.delete({
      where: { id },
    });

    return { message: '周期账单删除成功' };
  }

  private getNextDate(current: Date, frequency: RecurringFrequency): Date {
    const next = new Date(current);

    switch (frequency) {
      case RecurringFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurringFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurringFrequency.BIWEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case RecurringFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case RecurringFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        break;
      case RecurringFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  async generateTransactions(userId: number, id: number, generateDto: GenerateRecurringDto) {
    const recurring = await this.prisma.recurringTransaction.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });

    if (!recurring) {
      throw new NotFoundException('周期账单不存在');
    }

    if (recurring.userId !== userId) {
      throw new ForbiddenException('无权操作此周期账单');
    }

    if (!recurring.isActive) {
      throw new BadRequestException('周期账单已停用');
    }

    const untilDate = generateDto.untilDate
      ? new Date(generateDto.untilDate)
      : new Date();

    const generated: any[] = [];
    let currentDate = recurring.lastGeneratedDate
      ? this.getNextDate(recurring.lastGeneratedDate, recurring.frequency)
      : new Date(recurring.startDate);

    const account = await this.prisma.account.findUnique({
      where: { id: recurring.accountId },
    });
    if (!account) {
      throw new NotFoundException('关联账户不存在');
    }

    const recurringTagIds = recurring.tags.map((rt) => rt.tagId);

    while (currentDate <= untilDate) {
      if (recurring.endDate && currentDate > recurring.endDate) {
        break;
      }

      const txDate = new Date(currentDate);

      const result = await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            userId,
            accountId: recurring.accountId,
            categoryId: recurring.categoryId,
            type: recurring.type,
            amount: recurring.amount,
            description: recurring.description,
            note: recurring.note,
            transactionDate: txDate,
          },
          include: {
            account: { select: { id: true, name: true, icon: true, color: true } },
            category: { select: { id: true, name: true, icon: true, color: true, type: true } },
          },
        });

        if (recurringTagIds.length > 0) {
          await tx.transactionTag.createMany({
            data: recurringTagIds.map((tagId) => ({
              transactionId: transaction.id,
              tagId,
            })),
          });
        }

        const amountNum = recurring.amount.toNumber();
        const adjustment = recurring.type === CategoryType.INCOME ? amountNum : -amountNum;

        await tx.account.update({
          where: { id: recurring.accountId },
          data: { balance: { increment: adjustment } },
        });

        await tx.recurringTransaction.update({
          where: { id: recurring.id },
          data: { lastGeneratedDate: txDate },
        });

        return tx.transaction.findUnique({
          where: { id: transaction.id },
          include: {
            account: { select: { id: true, name: true, icon: true, color: true } },
            category: { select: { id: true, name: true, icon: true, color: true, type: true } },
            tags: { include: { tag: true } },
          },
        });
      });

      generated.push(result);

      currentDate = this.getNextDate(currentDate, recurring.frequency);
    }

    return {
      generatedCount: generated.length,
      transactions: generated,
    };
  }

  async getPreview(userId: number, id: number, count: number = 5) {
    const recurring = await this.prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!recurring) {
      throw new NotFoundException('周期账单不存在');
    }

    if (recurring.userId !== userId) {
      throw new ForbiddenException('无权访问此周期账单');
    }

    const dates: Date[] = [];
    let currentDate = new Date(recurring.startDate);

    for (let i = 0; i < count; i++) {
      if (recurring.endDate && currentDate > recurring.endDate) {
        break;
      }
      dates.push(new Date(currentDate));
      currentDate = this.getNextDate(currentDate, recurring.frequency);
    }

    return {
      id: recurring.id,
      amount: recurring.amount,
      type: recurring.type,
      frequency: recurring.frequency,
      previewDates: dates,
    };
  }
}
