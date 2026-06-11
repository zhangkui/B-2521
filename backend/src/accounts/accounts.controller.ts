import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto';

@ApiTags('账户')
@Controller('accounts')
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: '创建账户' })
  async create(
    @GetUser('id') userId: number,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.create(userId, createAccountDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有账户列表' })
  async findAll(@GetUser('id') userId: number) {
    return this.accountsService.findAll(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: '获取账户汇总信息' })
  async getSummary(@GetUser('id') userId: number) {
    return this.accountsService.getSummary(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个账户详情' })
  @ApiParam({ name: 'id', description: '账户ID', type: Number })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.accountsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新账户信息' })
  @ApiParam({ name: 'id', description: '账户ID', type: Number })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(userId, id, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除账户' })
  @ApiParam({ name: 'id', description: '账户ID', type: Number })
  async remove(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.accountsService.remove(userId, id);
  }
}
