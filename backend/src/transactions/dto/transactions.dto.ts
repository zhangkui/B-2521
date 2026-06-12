import { IsString, IsOptional, IsEnum, IsInt, IsNumber, IsDateString, Min, IsNotEmpty } from 'class-validator';
import { CategoryType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
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

  @ApiProperty({ description: '交易日期', example: '2024-01-15T12:00:00.000Z' })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({ description: '交易描述', example: '午餐' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '备注', example: '和同事一起吃' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateTransactionDto {
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

  @ApiPropertyOptional({ description: '交易日期' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: '交易描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class QueryTransactionDto {
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

  @ApiPropertyOptional({ description: '开始日期', example: '2024-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

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
