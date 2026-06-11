import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  QueryTransactionDto,
} from './dto/transactions.dto';

@ApiTags('交易记录')
@Controller('transactions')
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: '创建交易记录' })
  async create(
    @GetUser('id') userId: number,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: '获取交易记录列表（分页）' })
  async findAll(
    @GetUser('id') userId: number,
    @Query() query: QueryTransactionDto,
  ) {
    return this.transactionsService.findAll(userId, query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取交易统计数据' })
  async getStatistics(
    @GetUser('id') userId: number,
    @Query() query: QueryTransactionDto,
  ) {
    return this.transactionsService.getStatistics(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单条交易记录详情' })
  @ApiParam({ name: 'id', description: '交易记录ID', type: Number })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新交易记录' })
  @ApiParam({ name: 'id', description: '交易记录ID', type: Number })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除交易记录' })
  @ApiParam({ name: 'id', description: '交易记录ID', type: Number })
  async remove(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transactionsService.remove(userId, id);
  }
}
