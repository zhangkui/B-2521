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
import { CategoriesService } from './categories.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto,
} from './dto/categories.dto';
import { CategoryType } from '@prisma/client';

@ApiTags('分类')
@Controller('categories')
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: '创建分类' })
  async create(
    @GetUser('id') userId: number,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有分类' })
  async findAll(
    @GetUser('id') userId: number,
    @Query() query: QueryCategoryDto,
  ) {
    return this.categoriesService.findAll(userId, query);
  }

  @Get('type/:type')
  @ApiOperation({ summary: '按类型获取分类' })
  @ApiParam({ name: 'type', description: '分类类型', enum: CategoryType })
  async findByType(
    @GetUser('id') userId: number,
    @Param('type') type: CategoryType,
  ) {
    return this.categoriesService.findByType(userId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个分类详情' })
  @ApiParam({ name: 'id', description: '分类ID', type: Number })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新分类' })
  @ApiParam({ name: 'id', description: '分类ID', type: Number })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(userId, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  @ApiParam({ name: 'id', description: '分类ID', type: Number })
  async remove(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(userId, id);
  }
}
