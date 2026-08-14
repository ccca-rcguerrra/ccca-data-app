import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TerritoriesService } from './services/territories.service';
import { GetTerritoriesQueryDto } from './dto/get-territories-query.dto';
import { GetTerritoriesResponseDto } from './dto/get-territories-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TerritoryResponseDto } from './dto/territory-response.dto';

@ApiTags('territories')
@Controller('api/territories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TerritoriesController {

  constructor(private readonly territoriesService: TerritoriesService) { }

  @Get()
  @ApiOperation({
    summary: 'List territories',
    description: 'Returns a paginated list of territories with optional filters. Note: This endpoint should not be called automatically on page load. When filtering by name, implement debounce on the frontend (recommended: 300-500ms) to avoid excessive API calls.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter territories by name (partial match). Frontend should implement debounce when user types (recommended: 300-500ms delay).',
    example: 'Amazonas',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by territory category. Comma-separated for multiple (e.g. state,city,refined_biome)',
    example: 'state',
    type: String,
  })
  @ApiQuery({
    name: 'withGeom',
    required: false,
    description: 'Include geometry in response',
    example: false,
  })
  @ApiQuery({
    name: 'withBbox',
    required: false,
    description: 'Include the territory bounding box ([west, south, east, north]) in response',
    example: false,
  })
  @ApiOkResponse({
    description: 'Territories list returned successfully',
    type: GetTerritoriesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  findAll(@Query() queryDto: GetTerritoriesQueryDto): Promise<GetTerritoriesResponseDto> {
    return this.territoriesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get territory by ID',
    description: 'Returns a single territory by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the territory to retrieve',
    example: 1,
  })
  @ApiQuery({
    name: 'withBbox',
    required: false,
    description: 'Return the territory bounding box ([west, south, east, north]) instead of the full geometry',
    example: false,
  })
  @ApiOkResponse({
    description: 'Territory returned successfully',
    type: TerritoryResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  findOne(
    @Param('id') id: number,
    @Query('withBbox') withBbox?: string,
  ): Promise<TerritoryResponseDto> {
    return this.territoriesService.findOne(id, withBbox === 'true');
  }
}

