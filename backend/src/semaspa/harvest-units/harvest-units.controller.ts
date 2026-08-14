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
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HarvestUnitsService } from './services/harvest-units.service';
import { GetHarvestUnitsQueryDto } from './dto/get-harvest-units-query.dto';
import { HarvestUnitResponseDto } from './dto/harvest-unit-response.dto';
import { GetHarvestUnitsResponseDto } from '../shared/paginated-responses.dto';

class HarvestUnitDetailQueryDto {
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

@ApiTags('semaspa-harvest-units')
@Controller('api/semaspa/harvest-units')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class HarvestUnitsController {
  constructor(private readonly harvestUnitsService: HarvestUnitsService) {}

  @Get()
  @ApiOperation({ summary: 'List harvest units with pagination and filters' })
  @ApiOkResponse({ type: GetHarvestUnitsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(@Query() query: GetHarvestUnitsQueryDto): Promise<GetHarvestUnitsResponseDto> {
    return this.harvestUnitsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get harvest unit by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: HarvestUnitResponseDto })
  @ApiNotFoundResponse({ description: 'Harvest unit not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HarvestUnitDetailQueryDto,
  ): Promise<HarvestUnitResponseDto> {
    return this.harvestUnitsService.findOne(id, {
      withGeom: query.withGeom,
      withBbox: query.withBbox,
    });
  }
}
