import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto,
} from './dto/categories.dto';
import { CategoryType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createCategoryDto: CreateCategoryDto) {
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent || parent.userId !== userId) {
        throw new ForbiddenException('父分类不存在或无权访问');
      }

      if (parent.type !== createCategoryDto.type) {
        throw new ForbiddenException('子分类类型必须与父分类一致');
      }
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        userId,
        isSystem: false,
      },
      include: {
        children: true,
      },
    });
  }

  async findAll(userId: number, query?: QueryCategoryDto) {
    const where: any = { userId };

    if (query?.type) {
      where.type = query.type;
    }

    return this.prisma.category.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        children: {
          orderBy: [{ sortOrder: 'asc' }],
        },
      },
    });
  }

  async findByType(userId: number, type: CategoryType) {
    return this.prisma.category.findMany({
      where: { userId, type },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findOne(userId: number, id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('无权访问此分类');
    }

    return category;
  }

  async update(
    userId: number,
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('无权修改此分类');
    }

    if (category.isSystem) {
      if (updateCategoryDto.name || updateCategoryDto.type) {
        throw new ForbiddenException('系统分类的名称和类型不可修改');
      }
    }

    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new ForbiddenException('不能将自己设为父分类');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parent || parent.userId !== userId) {
        throw new ForbiddenException('父分类不存在或无权访问');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        children: true,
      },
    });
  }

  async remove(userId: number, id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('无权删除此分类');
    }

    if (category.isSystem) {
      throw new ForbiddenException('系统分类不可删除');
    }

    const childCount = await this.prisma.category.count({
      where: { parentId: id, userId },
    });

    if (childCount > 0) {
      throw new ForbiddenException('请先删除子分类');
    }

    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId: id, userId },
    });

    if (transactionCount > 0) {
      throw new ForbiddenException('该分类下存在交易记录，无法删除');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: '分类删除成功' };
  }
}
