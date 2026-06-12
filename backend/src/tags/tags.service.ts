import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto, UpdateTagDto, QueryTagDto } from './dto/tags.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createTagDto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { userId_name: { userId, name: createTagDto.name } },
    });

    if (existing) {
      throw new BadRequestException('标签名称已存在');
    }

    return this.prisma.tag.create({
      data: {
        ...createTagDto,
        userId,
      },
    });
  }

  async findAll(userId: number, query: QueryTagDto) {
    const where: any = { userId };

    if (query.keyword) {
      where.name = { contains: query.keyword };
    }

    return this.prisma.tag.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(userId: number, id: number) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    if (tag.userId !== userId) {
      throw new ForbiddenException('无权访问此标签');
    }

    return tag;
  }

  async update(userId: number, id: number, updateTagDto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    if (tag.userId !== userId) {
      throw new ForbiddenException('无权修改此标签');
    }

    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existing = await this.prisma.tag.findUnique({
        where: { userId_name: { userId, name: updateTagDto.name } },
      });

      if (existing) {
        throw new BadRequestException('标签名称已存在');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });
  }

  async remove(userId: number, id: number) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    if (tag.userId !== userId) {
      throw new ForbiddenException('无权删除此标签');
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: '标签删除成功' };
  }

  async getTransactionTags(userId: number, transactionId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('交易记录不存在');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('无权访问此交易记录');
    }

    return transaction.tags.map((t) => t.tag);
  }

  async updateTransactionTags(userId: number, transactionId: number, tagIds: number[]) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('交易记录不存在');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('无权修改此交易记录');
    }

    const tags = await this.prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('部分标签不存在或无权访问');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transactionTag.deleteMany({
        where: { transactionId },
      });

      if (tagIds.length > 0) {
        await tx.transactionTag.createMany({
          data: tagIds.map((tagId) => ({
            transactionId,
            tagId,
          })),
        });
      }
    });

    return this.getTransactionTags(userId, transactionId);
  }
}
