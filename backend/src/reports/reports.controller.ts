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
import { ReportsService } from './reports.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  QueryReportDto,
  GenerateReportDto,
} from './dto/reports.dto';

@ApiTags('报表')
@Controller('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('subscriptions')
  @ApiOperation({ summary: '创建报表订阅（按周/月自动生成）' })
  async createSubscription(
    @GetUser('id') userId: number,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.reportsService.createSubscription(userId, dto);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: '获取所有报表订阅' })
  async getSubscriptions(@GetUser('id') userId: number) {
    return this.reportsService.getSubscriptions(userId);
  }

  @Patch('subscriptions/:id')
  @ApiOperation({ summary: '更新报表订阅状态' })
  @ApiParam({ name: 'id', description: '订阅ID', type: Number })
  async updateSubscription(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.reportsService.updateSubscription(userId, id, dto);
  }

  @Delete('subscriptions/:id')
  @ApiOperation({ summary: '取消报表订阅' })
  @ApiParam({ name: 'id', description: '订阅ID', type: Number })
  async removeSubscription(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.removeSubscription(userId, id);
  }

  @Post('generate')
  @ApiOperation({ summary: '手动生成财务报表' })
  async generateReport(
    @GetUser('id') userId: number,
    @Body() dto: GenerateReportDto,
  ) {
    return this.reportsService.generateReport(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取历史报表列表（分页）' })
  async getReports(@GetUser('id') userId: number, @Query() query: QueryReportDto) {
    return this.reportsService.getReports(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取报表详情' })
  @ApiParam({ name: 'id', description: '报表ID', type: Number })
  async getReportDetail(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.getReportDetail(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除历史报表' })
  @ApiParam({ name: 'id', description: '报表ID', type: Number })
  async deleteReport(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportsService.deleteReport(userId, id);
  }
}
