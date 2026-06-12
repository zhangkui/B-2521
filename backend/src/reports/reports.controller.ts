import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('月度报告')
@Controller('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @ApiOperation({ summary: '获取月度财务报告' })
  async getMonthlyReport(
    @GetUser('id') userId: number,
    @Query('month') month?: string,
  ) {
    return this.reportsService.getMonthlyReport(userId, month);
  }
}
