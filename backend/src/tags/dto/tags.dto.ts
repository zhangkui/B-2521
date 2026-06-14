import { IsString, IsOptional, IsInt, Min, Max, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class CreateTagDto {
  @ApiProperty({ description: '标签名称', example: '旅游' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '标签颜色', example: '#3b82f6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '标签图标', example: 'Plane' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional({ description: '标签名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '标签颜色' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '标签图标' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class TagTransactionDto {
  @ApiProperty({ description: '交易ID', example: 1 })
  @IsInt()
  transactionId: number;

  @ApiProperty({ description: '标签ID数组', example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  tagIds: number[];
}

export class QueryTagStatsDto {
  @ApiPropertyOptional({ description: '开始日期', example: '2026-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2026-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '收支类型', enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}

export class QueryTagTrendDto {
  @ApiProperty({ description: '统计粒度', enum: ['day', 'week', 'month'] })
  @IsString()
  granularity: 'day' | 'week' | 'month';

  @ApiPropertyOptional({ description: '标签ID', example: 1 })
  @IsOptional()
  @IsInt()
  tagId?: number;

  @ApiPropertyOptional({ description: '开始日期', example: '2026-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2026-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '数据周期数', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  periods?: number;
}
