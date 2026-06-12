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
import { TagsService } from './tags.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  CreateTagDto,
  UpdateTagDto,
  QueryTagDto,
  UpdateTransactionTagsDto,
} from './dto/tags.dto';

@ApiTags('标签管理')
@Controller('tags')
@ApiBearerAuth()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: '创建标签' })
  async create(
    @GetUser('id') userId: number,
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.tagsService.create(userId, createTagDto);
  }

  @Get()
  @ApiOperation({ summary: '获取标签列表' })
  async findAll(
    @GetUser('id') userId: number,
    @Query() query: QueryTagDto,
  ) {
    return this.tagsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个标签详情' })
  @ApiParam({ name: 'id', description: '标签ID', type: Number })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tagsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新标签' })
  @ApiParam({ name: 'id', description: '标签ID', type: Number })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(userId, id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标签' })
  @ApiParam({ name: 'id', description: '标签ID', type: Number })
  async remove(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tagsService.remove(userId, id);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: '获取交易记录的标签' })
  @ApiParam({ name: 'transactionId', description: '交易记录ID', type: Number })
  async getTransactionTags(
    @GetUser('id') userId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.tagsService.getTransactionTags(userId, transactionId);
  }

  @Patch('transaction/:transactionId')
  @ApiOperation({ summary: '更新交易记录的标签' })
  @ApiParam({ name: 'transactionId', description: '交易记录ID', type: Number })
  async updateTransactionTags(
    @GetUser('id') userId: number,
    @Param('transactionId', ParseIntPipe) transactionId: number,
    @Body() updateTransactionTagsDto: UpdateTransactionTagsDto,
  ) {
    return this.tagsService.updateTransactionTags(
      userId,
      transactionId,
      updateTransactionTagsDto.tagIds,
    );
  }
}
