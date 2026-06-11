import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min } from 'class-validator';
import { AccountType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ description: '账户名称', example: '招商银行卡' })
  @IsString()
  name: string;

  @ApiProperty({ description: '账户类型', enum: AccountType, example: AccountType.BANK_CARD })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({ description: '初始余额', example: 10000 })
  @IsNumber()
  @Min(0)
  initialBalance: number;

  @ApiPropertyOptional({ description: '货币类型', example: 'CNY' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: '图标', example: '🏦' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '颜色', example: '#2196F3' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '描述', example: '工资卡' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否默认账户', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: '账户名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '账户类型', enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ description: '初始余额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;

  @ApiPropertyOptional({ description: '货币类型' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: '图标' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '颜色' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否默认账户' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
