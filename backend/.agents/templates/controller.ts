import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DomainService } from './services/domain.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { GetDomainsQueryDto } from './dto/get-domains-query.dto';
import { GetDomainsResponseDto } from './dto/get-domains-response.dto';
import { DomainResponseDto } from './dto/domain-response.dto';

@ApiTags('domain')
@Controller('api/domain')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get()
  @ApiOperation({ summary: 'List all items with pagination' })
  @ApiOkResponse({ type: GetDomainsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  async findAll(@Query() query: GetDomainsQueryDto) {
    return this.domainService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single item by ID' })
  @ApiOkResponse({ type: DomainResponseDto })
  @ApiNotFoundResponse({ description: 'Item not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.domainService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiCreatedResponse({ type: DomainResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(@Body() dto: CreateDomainDto) {
    return this.domainService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing item' })
  @ApiOkResponse({ type: DomainResponseDto })
  @ApiNotFoundResponse({ description: 'Item not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDomainDto,
  ) {
    return this.domainService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an item' })
  @ApiNotFoundResponse({ description: 'Item not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.domainService.remove(id);
  }
}
