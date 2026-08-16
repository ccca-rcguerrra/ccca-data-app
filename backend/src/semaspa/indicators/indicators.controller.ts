import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IndicatorsService } from './services/indicators.service';
import { IndicatorSavedFiltersService } from './services/indicator-saved-filters.service';
import { GetIndicatorFiltersDto } from './dto/get-indicator-filters.dto';
import { GetIndicatorCasesQueryDto } from './dto/get-indicator-cases-query.dto';
import { IndicatorSummaryResponseDto } from './dto/indicator-summary-response.dto';
import { GetIndicatorCasesResponseDto } from './dto/indicator-case-response.dto';
import {
  CreateSavedFilterDto,
  SavedFilterResponseDto,
  UpdateSavedFilterDto,
} from './dto/saved-filter.dto';

@ApiTags('semaspa-indicators')
@Controller('api/semaspa/indicators')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IndicatorsController {
  constructor(
    private readonly indicatorsService: IndicatorsService,
    private readonly savedFiltersService: IndicatorSavedFiltersService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Aggregated investigative indicator counts',
    description:
      'Returns catalog metadata and distinct case counts for volume, person, and plate indicators. Counts are not legal conclusions.',
  })
  @ApiOkResponse({ type: IndicatorSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  getSummary(
    @Query() query: GetIndicatorFiltersDto,
  ): Promise<IndicatorSummaryResponseDto> {
    return this.indicatorsService.getSummary(query);
  }

  @Get('saved-filters')
  @ApiOperation({
    summary: 'List named Indicator Center filter presets',
    description: 'Returns presets owned by the authenticated user.',
  })
  @ApiOkResponse({ type: [SavedFilterResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  listSavedFilters(@Request() req): Promise<SavedFilterResponseDto[]> {
    return this.savedFiltersService.findAll(req.user.id);
  }

  @Post('saved-filters')
  @ApiOperation({
    summary: 'Save a named Indicator Center filter preset',
    description:
      'Stores the current indicator selection and filters for the authenticated user.',
  })
  @ApiCreatedResponse({ type: SavedFilterResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  createSavedFilter(
    @Body() dto: CreateSavedFilterDto,
    @Request() req,
  ): Promise<SavedFilterResponseDto> {
    return this.savedFiltersService.create(req.user.id, dto);
  }

  @Patch('saved-filters/:id')
  @ApiOperation({
    summary: 'Update a named Indicator Center filter preset',
    description: 'Allowed only to the preset owner.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: SavedFilterResponseDto })
  @ApiNotFoundResponse({ description: 'Saved filter not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  updateSavedFilter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSavedFilterDto,
    @Request() req,
  ): Promise<SavedFilterResponseDto> {
    return this.savedFiltersService.update(req.user.id, id, dto);
  }

  @Delete('saved-filters/:id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a named Indicator Center filter preset',
    description: 'Allowed only to the preset owner.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({ description: 'Saved filter deleted' })
  @ApiNotFoundResponse({ description: 'Saved filter not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  removeSavedFilter(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    return this.savedFiltersService.remove(req.user.id, id);
  }

  @Get(':id/cases.csv')
  @ApiOperation({
    summary: 'Export indicator cases as CSV',
    description:
      'Exports up to 10,000 matching cases. Columns follow the indicator entity. Use id=any for AUTEFs matching any Phase 1 volume indicator.',
  })
  @ApiParam({
    name: 'id',
    example: 'autef_over_extracted',
    description: 'Catalog indicator id, or "any"',
  })
  @ApiProduces('text/csv')
  @ApiNotFoundResponse({ description: 'Indicator not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCasesCsv(
    @Param('id') id: string,
    @Query() query: GetIndicatorFiltersDto,
  ): Promise<StreamableFile> {
    const { filename, body } = await this.indicatorsService.exportCasesCsv(
      id,
      query,
    );
    return new StreamableFile(Buffer.from(body, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get(':id/cases')
  @ApiOperation({
    summary: 'List cases matching an investigative indicator',
    description:
      'Use id=any to list AUTEFs that match any Phase 1 volume-balance indicator. Person and plate indicators return those entities.',
  })
  @ApiParam({
    name: 'id',
    example: 'autef_over_extracted',
    description: 'Catalog indicator id, or "any"',
  })
  @ApiOkResponse({ type: GetIndicatorCasesResponseDto })
  @ApiNotFoundResponse({ description: 'Indicator not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findCases(
    @Param('id') id: string,
    @Query() query: GetIndicatorCasesQueryDto,
  ): Promise<GetIndicatorCasesResponseDto> {
    return this.indicatorsService.findCases(id, query);
  }
}
