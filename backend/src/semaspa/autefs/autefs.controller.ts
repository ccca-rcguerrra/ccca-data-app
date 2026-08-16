import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AutefsService } from './services/autefs.service';
import { GetAutefsQueryDto } from './dto/get-autefs-query.dto';
import { GetAutefsResponseDto } from './dto/get-autefs-response.dto';
import { AutefResponseDto } from './dto/autef-response.dto';
import { GetAutefNestedVolumeBalancesQueryDto } from './dto/get-autef-nested-volume-balances-query.dto';
import { GetVolumeBalanceForestGuidesQueryDto } from './dto/get-volume-balance-forest-guides-query.dto';
import { SemaspaPaginationQueryDto } from '../shared/semaspa-pagination.dto';
import {
  GetAutefSpeciesResponseDto,
  GetAutefVolumeBalancesResponseDto,
  GetForestGuidesResponseDto,
  GetHarvestUnitsResponseDto,
  GetPersonRolesResponseDto,
  GetVolumeBalanceForestGuidesResponseDto,
} from '../shared/paginated-responses.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

class AutefDetailQueryDto {
  @ApiPropertyOptional({ description: 'Include geometry', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  withGeom?: boolean = false;

  @ApiPropertyOptional({ description: 'Include bounding box', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  withBbox?: boolean = false;
}

class AutefHarvestUnitsQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Include geometry', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  withGeom?: boolean = false;
}

@ApiTags('semaspa-autefs')
@Controller('api/semaspa/autefs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AutefsController {
  constructor(private readonly autefsService: AutefsService) {}

  @Get()
  @ApiOperation({ summary: 'List AUTEFs with pagination and filters' })
  @ApiOkResponse({ type: GetAutefsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(@Query() query: GetAutefsQueryDto): Promise<GetAutefsResponseDto> {
    return this.autefsService.findAll(query);
  }

  @Get(':id/species')
  @ApiOperation({ summary: 'List species authorized for an AUTEF' })
  @ApiOkResponse({ type: GetAutefSpeciesResponseDto })
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  findSpecies(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetAutefSpeciesResponseDto> {
    return this.autefsService.findSpecies(id, query);
  }

  @Get(':id/volume-balances.csv')
  @ApiOperation({
    summary: 'Export AUTEF volume balances as CSV',
    description:
      'Exports up to 10,000 species-product balances for one AUTEF. Grain is species-product; GF1 only.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiProduces('text/csv')
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportVolumeBalancesCsv(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetAutefNestedVolumeBalancesQueryDto,
  ): Promise<StreamableFile> {
    const { filename, body } = await this.autefsService.exportVolumeBalancesCsv(
      id,
      query,
    );
    return new StreamableFile(Buffer.from(body, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get(':id/volume-balances/:speciesProductId/forest-guides')
  @ApiOperation({
    summary: 'List GF1 contributions for an AUTEF species-product balance',
    description:
      'Returns forest guides that enter moved_volume: GF1 with accepted statuses, chronological. Unknown species-product IDs return an empty list.',
  })
  @ApiParam({ name: 'id', example: 497 })
  @ApiParam({ name: 'speciesProductId', example: 'c58688845974af07c441d6d3e74e4c4b' })
  @ApiOkResponse({ type: GetVolumeBalanceForestGuidesResponseDto })
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  findVolumeBalanceForestGuides(
    @Param('id', ParseIntPipe) id: number,
    @Param('speciesProductId') speciesProductId: string,
    @Query() query: GetVolumeBalanceForestGuidesQueryDto,
  ): Promise<GetVolumeBalanceForestGuidesResponseDto> {
    return this.autefsService.findVolumeBalanceForestGuides(
      id,
      speciesProductId,
      query,
    );
  }

  @Get(':id/volume-balances')
  @ApiOperation({
    summary: 'List volume balances for an AUTEF',
    description:
      'Species-product grain. Default sort is excess volume descending (largest discrepancy first).',
  })
  @ApiOkResponse({ type: GetAutefVolumeBalancesResponseDto })
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  findVolumeBalances(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetAutefNestedVolumeBalancesQueryDto,
  ): Promise<GetAutefVolumeBalancesResponseDto> {
    return this.autefsService.findVolumeBalances(id, query);
  }

  @Get(':id/forest-guides')
  @ApiOperation({ summary: 'List forest guides linked to an AUTEF' })
  @ApiOkResponse({ type: GetForestGuidesResponseDto })
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  findForestGuides(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetForestGuidesResponseDto> {
    return this.autefsService.findForestGuides(id, query);
  }

  @Get(':id/harvest-units')
  @ApiOperation({ summary: 'List harvest units linked to an AUTEF' })
  @ApiOkResponse({ type: GetHarvestUnitsResponseDto })
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  findHarvestUnits(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AutefHarvestUnitsQueryDto,
  ): Promise<GetHarvestUnitsResponseDto> {
    return this.autefsService.findHarvestUnits(id, query);
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'List person roles for an AUTEF' })
  @ApiOkResponse({ type: GetPersonRolesResponseDto })
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  findRoles(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonRolesResponseDto> {
    return this.autefsService.findRoles(id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AUTEF by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: AutefResponseDto })
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AutefDetailQueryDto,
  ): Promise<AutefResponseDto> {
    return this.autefsService.findOne(id, {
      withGeom: query.withGeom,
      withBbox: query.withBbox,
    });
  }
}
