import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SpeciesProductsService } from './services/species-products.service';
import { GetSpeciesProductsQueryDto } from './dto/get-species-products-query.dto';
import { SpeciesProductResponseDto } from './dto/species-product-response.dto';
import { GetSpeciesProductsResponseDto } from '../shared/paginated-responses.dto';

@ApiTags('semaspa-species-products')
@Controller('api/semaspa/species-products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SpeciesProductsController {
  constructor(private readonly speciesProductsService: SpeciesProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List species-products with pagination and filters' })
  @ApiOkResponse({ type: GetSpeciesProductsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(@Query() query: GetSpeciesProductsQueryDto): Promise<GetSpeciesProductsResponseDto> {
    return this.speciesProductsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get species-product by ID' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4e5f6' })
  @ApiOkResponse({ type: SpeciesProductResponseDto })
  @ApiNotFoundResponse({ description: 'Species product not found' })
  findOne(@Param('id') id: string): Promise<SpeciesProductResponseDto> {
    return this.speciesProductsService.findOne(id);
  }
}
