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
import { AutefVolumeBalancesService } from './services/autef-volume-balances.service';
import { GetAutefVolumeBalancesQueryDto } from './dto/get-autef-volume-balances-query.dto';
import { AutefVolumeBalanceResponseDto } from './dto/autef-volume-balance-response.dto';
import { GetAutefVolumeBalancesResponseDto } from '../shared/paginated-responses.dto';

@ApiTags('semaspa-autef-volume-balances')
@Controller('api/semaspa/autef-volume-balances')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AutefVolumeBalancesController {
  constructor(private readonly volumeBalancesService: AutefVolumeBalancesService) {}

  @Get()
  @ApiOperation({
    summary: 'List AUTEF volume balances (authorized vs moved)',
    description: 'Primary endpoint for over-extraction detection. movedRatio is a 0-1 scale.',
  })
  @ApiOkResponse({ type: GetAutefVolumeBalancesResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(
    @Query() query: GetAutefVolumeBalancesQueryDto,
  ): Promise<GetAutefVolumeBalancesResponseDto> {
    return this.volumeBalancesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get volume balance by ID' })
  @ApiParam({ name: 'id', example: 'a1b2c3d4e5f6' })
  @ApiOkResponse({ type: AutefVolumeBalanceResponseDto })
  @ApiNotFoundResponse({ description: 'Volume balance not found' })
  findOne(@Param('id') id: string): Promise<AutefVolumeBalanceResponseDto> {
    return this.volumeBalancesService.findOne(id);
  }
}
