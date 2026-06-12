import { IsString, IsOptional, IsInt, Min, IsNotEmpty, IsEnum, IsBoolean, IsDateString, IsArray, IsNumber } from 'class-validator';
import { CategoryType, RecurringFrequency } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRecurringDto {
  @ApiProperty({ description: '账户ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  accountId: number;

  @ApiProperty({ description: '分类ID', example: 5 })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ description: '交易类型', enum: CategoryType, example: CategoryType.EXPENSE })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiProperty({ description: '交易金额', example: 50.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: '周期频率', enum: RecurringFrequency, example: RecurringFrequency.MONTHLY })
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @ApiProperty({ description: '开始日期', example: '2024-01-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '交易描述', example: '房租' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '备注', example: '每月1号自动扣除' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '标签ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}

export class UpdateRecurringDto {
  @ApiPropertyOptional({ description: '账户ID' })
  @IsOptional()
  @IsInt()
  accountId?: number;

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: '交易类型', enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiPropertyOptional({ description: '交易金额' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: '周期频率', enum: RecurringFrequency })
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '交易描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '标签ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}

export class QueryRecurringDto {
  @ApiPropertyOptional({ description: '按类型筛选', enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiPropertyOptional({ description: '按账户ID筛选' })
  @IsOptional()
  @IsInt()
  accountId?: number;

  @ApiPropertyOptional({ description: '按分类ID筛选' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: '按频率筛选', enum: RecurringFrequency })
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @ApiPropertyOptional({ description: '是否只显示启用的' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class GenerateRecurringDto {
  @ApiPropertyOptional({ description: '截止日期', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  untilDate?: string;
}
