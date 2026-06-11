import { IsInt, IsNumber, IsString, Min, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({ description: '分类ID', example: 1 })
  @IsInt()
  categoryId: number;

  @ApiProperty({ description: '预算金额', example: 1000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: '预算月份，格式 YYYY-MM', example: '2026-06' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: '预算金额' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: '预算月份，格式 YYYY-MM' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month?: string;
}

export class QueryBudgetDto {
  @ApiPropertyOptional({ description: '预算月份，格式 YYYY-MM', example: '2026-06' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({ description: '分类ID' })
  @IsOptional()
  @IsInt()
  categoryId?: number;
}
