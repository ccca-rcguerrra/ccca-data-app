import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StatisticsService } from './services/statistics.service';
import {
  GeneralStatisticsByMonthResponseDto,
  GeneralStatisticsSummaryResponseDto,
  GetStatisticsByMonthQueryDto,
} from './dto/statistics.dto';

@ApiTags('semaspa-statistics')
@Controller('api/semaspa/statistics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'General statistics for the indicator center',
    description:
      'Returns totals (AUTEFs, forest guides, AUTEFs without a forest guide) and a yearly series.',
  })
  @ApiOkResponse({ type: GeneralStatisticsSummaryResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  getSummary(): Promise<GeneralStatisticsSummaryResponseDto> {
    return this.statisticsService.getSummary();
  }

  @Get('by-month')
  @ApiOperation({
    summary: 'Monthly breakdown for a given year',
    description:
      'Returns AUTEF and forest guide counts, including AUTEFs without a forest guide, per month.',
  })
  @ApiOkResponse({ type: GeneralStatisticsByMonthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  getByMonth(
    @Query() query: GetStatisticsByMonthQueryDto,
  ): Promise<GeneralStatisticsByMonthResponseDto> {
    return this.statisticsService.getByMonth(query.year);
  }
}
