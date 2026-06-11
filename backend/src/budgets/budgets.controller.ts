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
import { BudgetsService } from './budgets.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  QueryBudgetDto,
} from './dto/budgets.dto';

@ApiTags('预算管理')
@Controller('budgets')
@ApiBearerAuth()
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: '创建/设置预算' })
  async create(
    @GetUser('id') userId: number,
    @Body() createBudgetDto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: '获取预算列表' })
  async findAll(
    @GetUser('id') userId: number,
    @Query() query: QueryBudgetDto,
  ) {
    return this.budgetsService.findAll(userId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: '获取预算汇总（含支出统计）' })
  async getSummary(
    @GetUser('id') userId: number,
    @Query('month') month: string,
  ) {
    const currentMonth = month || new Date().toISOString().slice(0, 7);
    return this.budgetsService.getSummary(userId, currentMonth);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个预算详情' })
  @ApiParam({ name: 'id', description: '预算ID', type: Number })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新预算' })
  @ApiParam({ name: 'id', description: '预算ID', type: Number })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(userId, id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除预算' })
  @ApiParam({ name: 'id', description: '预算ID', type: Number })
  async remove(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.budgetsService.remove(userId, id);
  }
}
