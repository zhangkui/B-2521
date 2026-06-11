import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('仪表盘')
@Controller('dashboard')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取仪表盘概览数据' })
  async getOverview(@GetUser('id') userId: number) {
    return this.dashboardService.getOverview(userId);
  }

  @Get('chart')
  @ApiOperation({ summary: '获取收支走势图表数据' })
  async getChartData(
    @GetUser('id') userId: number,
    @Query('period') period: 'week' | 'month' = 'week',
  ) {
    return this.dashboardService.getChartData(userId, period);
  }
}
