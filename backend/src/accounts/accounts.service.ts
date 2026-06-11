import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createAccountDto: CreateAccountDto) {
    if (createAccountDto.isDefault) {
      await this.prisma.account.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        balance: createAccountDto.initialBalance,
        userId,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(userId: number, id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('账户不存在');
    }

    if (account.userId !== userId) {
      throw new ForbiddenException('无权访问此账户');
    }

    return account;
  }

  async update(
    userId: number,
    id: number,
    updateAccountDto: UpdateAccountDto,
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('账户不存在');
    }

    if (account.userId !== userId) {
      throw new ForbiddenException('无权修改此账户');
    }

    if (updateAccountDto.isDefault && !account.isDefault) {
      await this.prisma.account.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    let balanceDelta = 0;
    if (updateAccountDto.initialBalance !== undefined) {
      balanceDelta = updateAccountDto.initialBalance - account.initialBalance.toNumber();
    }

    return this.prisma.account.update({
      where: { id },
      data: {
        ...updateAccountDto,
        balance: balanceDelta !== 0
          ? account.balance.toNumber() + balanceDelta
          : account.balance.toNumber(),
      },
    });
  }

  async remove(userId: number, id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('账户不存在');
    }

    if (account.userId !== userId) {
      throw new ForbiddenException('无权删除此账户');
    }

    const transactionCount = await this.prisma.transaction.count({
      where: { accountId: id, userId },
    });

    if (transactionCount > 0) {
      throw new ForbiddenException('该账户下存在交易记录，无法删除');
    }

    await this.prisma.account.delete({
      where: { id },
    });

    return { message: '账户删除成功' };
  }

  async getSummary(userId: number) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { balance: true },
    });

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + acc.balance.toNumber(),
      0,
    );

    return {
      totalAccounts: accounts.length,
      totalBalance,
    };
  }
}
