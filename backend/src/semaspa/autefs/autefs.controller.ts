import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AutefsService } from './services/autefs.service';
import { GetAutefsQueryDto } from './dto/get-autefs-query.dto';
import { GetAutefsResponseDto } from './dto/get-autefs-response.dto';
import { AutefResponseDto } from './dto/autef-response.dto';
import { SemaspaPaginationQueryDto } from '../shared/semaspa-pagination.dto';
import {
  GetAutefSpeciesResponseDto,
  GetAutefVolumeBalancesResponseDto,
  GetForestGuidesResponseDto,
  GetHarvestUnitsResponseDto,
  GetPersonRolesResponseDto,
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

  @Get(':id/volume-balances')
  @ApiOperation({ summary: 'List volume balances for an AUTEF' })
  @ApiOkResponse({ type: GetAutefVolumeBalancesResponseDto })
  @ApiNotFoundResponse({ description: 'AUTEF not found' })
  findVolumeBalances(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SemaspaPaginationQueryDto,
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
