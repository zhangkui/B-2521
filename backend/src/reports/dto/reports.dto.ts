import { IsString, IsOptional, IsEnum, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportPeriod } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ description: '报表周期', enum: ReportPeriod, example: ReportPeriod.WEEKLY })
  @IsEnum(ReportPeriod)
  period: ReportPeriod;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryReportDto {
  @ApiPropertyOptional({ description: '报表周期', enum: ReportPeriod })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数', example: 20 })
  @IsOptional()
  @IsInt()
  pageSize?: number;
}

export class GenerateReportDto {
  @ApiProperty({ description: '报表周期', enum: ReportPeriod, example: ReportPeriod.MONTHLY })
  @IsEnum(ReportPeriod)
  period: ReportPeriod;

  @ApiPropertyOptional({ description: '周期标识，如 2026-06 或 2026-W24', example: '2026-06' })
  @IsOptional()
  @IsString()
  periodKey?: string;
}
