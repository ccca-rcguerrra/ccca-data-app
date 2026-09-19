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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ForestGuidesService } from './services/forest-guides.service';
import { PermitReferencesService } from '../permit-references/services/permit-references.service';
import { GetForestGuidesQueryDto } from './dto/get-forest-guides-query.dto';
import { ForestGuideResponseDto } from './dto/forest-guide-response.dto';
import { SemaspaPaginationQueryDto } from '../shared/semaspa-pagination.dto';
import {
  GetForestGuidesResponseDto,
  GetForestGuideSpeciesResponseDto,
  GetPermitReferencesResponseDto,
  GetPersonRolesResponseDto,
} from '../shared/paginated-responses.dto';
import { GetAutefsResponseDto } from '../autefs/dto/get-autefs-response.dto';

@ApiTags('semaspa-forest-guides')
@Controller('api/semaspa/forest-guides')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ForestGuidesController {
  constructor(
    private readonly forestGuidesService: ForestGuidesService,
    private readonly permitReferencesService: PermitReferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List forest guides with pagination and filters' })
  @ApiOkResponse({ type: GetForestGuidesResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(@Query() query: GetForestGuidesQueryDto): Promise<GetForestGuidesResponseDto> {
    return this.forestGuidesService.findAll(query);
  }

  @Get(':id/species')
  @ApiOperation({ summary: 'List species transported on a forest guide' })
  @ApiOkResponse({ type: GetForestGuideSpeciesResponseDto })
  @ApiNotFoundResponse({ description: 'Forest guide not found' })
  findSpecies(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetForestGuideSpeciesResponseDto> {
    return this.forestGuidesService.findSpecies(id, query);
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'List person roles for a forest guide' })
  @ApiOkResponse({ type: GetPersonRolesResponseDto })
  @ApiNotFoundResponse({ description: 'Forest guide not found' })
  findRoles(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonRolesResponseDto> {
    return this.forestGuidesService.findRoles(id, query);
  }

  @Get(':id/autefs')
  @ApiOperation({ summary: 'List AUTEFs linked to a forest guide' })
  @ApiOkResponse({ type: GetAutefsResponseDto })
  @ApiNotFoundResponse({ description: 'Forest guide not found' })
  findAutefs(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetAutefsResponseDto> {
    return this.forestGuidesService.findAutefs(id, query);
  }

  @Get(':id/permit-references')
  @ApiOperation({
    summary: 'List declared AUTEF references for a forest guide',
  })
  @ApiOkResponse({ type: GetPermitReferencesResponseDto })
  @ApiNotFoundResponse({ description: 'Forest guide not found' })
  findPermitReferences(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: SemaspaPaginationQueryDto,
  ): Promise<GetPermitReferencesResponseDto> {
    return this.permitReferencesService.findByForestGuideId(id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get forest guide by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: ForestGuideResponseDto })
  @ApiNotFoundResponse({ description: 'Forest guide not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ForestGuideResponseDto> {
    return this.forestGuidesService.findOne(id);
  }
}
