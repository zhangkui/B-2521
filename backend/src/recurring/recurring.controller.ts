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
import { RecurringService } from './recurring.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  CreateRecurringDto,
  UpdateRecurringDto,
  QueryRecurringDto,
  GenerateRecurringDto,
} from './dto/recurring.dto';

@ApiTags('周期账单')
@Controller('recurring')
@ApiBearerAuth()
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  @ApiOperation({ summary: '创建周期账单' })
  async create(
    @GetUser('id') userId: number,
    @Body() createRecurringDto: CreateRecurringDto,
  ) {
    return this.recurringService.create(userId, createRecurringDto);
  }

  @Get()
  @ApiOperation({ summary: '获取周期账单列表' })
  async findAll(
    @GetUser('id') userId: number,
    @Query() query: QueryRecurringDto,
  ) {
    return this.recurringService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个周期账单详情' })
  @ApiParam({ name: 'id', description: '周期账单ID', type: Number })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.recurringService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新周期账单' })
  @ApiParam({ name: 'id', description: '周期账单ID', type: Number })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecurringDto: UpdateRecurringDto,
  ) {
    return this.recurringService.update(userId, id, updateRecurringDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除周期账单' })
  @ApiParam({ name: 'id', description: '周期账单ID', type: Number })
  async remove(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.recurringService.remove(userId, id);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: '生成周期交易记录' })
  @ApiParam({ name: 'id', description: '周期账单ID', type: Number })
  async generate(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() generateDto: GenerateRecurringDto,
  ) {
    return this.recurringService.generateTransactions(userId, id, generateDto);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: '预览周期账单日期' })
  @ApiParam({ name: 'id', description: '周期账单ID', type: Number })
  async preview(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('count', ParseIntPipe) count?: number,
  ) {
    return this.recurringService.getPreview(userId, id, count);
  }
}
