import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AccountType, CategoryType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password, nickname } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        nickname: nickname || username,
        accounts: {
          create: [
            {
              name: '默认现金账户',
              type: AccountType.CASH,
              initialBalance: 0,
              balance: 0,
              isDefault: true,
              icon: '💰',
              color: '#4CAF50',
            },
          ],
        },
        categories: {
          create: [
            { name: '工资', type: CategoryType.INCOME, icon: '💼', color: '#2196F3', isSystem: true, sortOrder: 1 },
            { name: '奖金', type: CategoryType.INCOME, icon: '🎁', color: '#9C27B0', isSystem: true, sortOrder: 2 },
            { name: '投资收益', type: CategoryType.INCOME, icon: '📈', color: '#4CAF50', isSystem: true, sortOrder: 3 },
            { name: '其他收入', type: CategoryType.INCOME, icon: '💵', color: '#FF9800', isSystem: true, sortOrder: 4 },
            { name: '餐饮', type: CategoryType.EXPENSE, icon: '🍜', color: '#F44336', isSystem: true, sortOrder: 1 },
            { name: '交通', type: CategoryType.EXPENSE, icon: '🚗', color: '#FF9800', isSystem: true, sortOrder: 2 },
            { name: '购物', type: CategoryType.EXPENSE, icon: '🛒', color: '#9C27B0', isSystem: true, sortOrder: 3 },
            { name: '娱乐', type: CategoryType.EXPENSE, icon: '🎮', color: '#E91E63', isSystem: true, sortOrder: 4 },
            { name: '居住', type: CategoryType.EXPENSE, icon: '🏠', color: '#3F51B5', isSystem: true, sortOrder: 5 },
            { name: '医疗', type: CategoryType.EXPENSE, icon: '💊', color: '#00BCD4', isSystem: true, sortOrder: 6 },
            { name: '教育', type: CategoryType.EXPENSE, icon: '📚', color: '#8BC34A', isSystem: true, sortOrder: 7 },
            { name: '其他支出', type: CategoryType.EXPENSE, icon: '📝', color: '#607D8B', isSystem: true, sortOrder: 8 },
          ],
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({
      sub: user.id,
      username: user.username,
      email: user.email,
    });

    return { user, token };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.generateToken({
      sub: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
      },
      token,
    };
  }

  private generateToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
