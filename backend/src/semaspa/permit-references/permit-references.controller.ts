import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermitReferencesService } from './services/permit-references.service';
import { GetPermitReferencesQueryDto } from './dto/get-permit-references-query.dto';
import { GetPermitReferencesResponseDto } from '../shared/paginated-responses.dto';

@ApiTags('semaspa-permit-references')
@Controller('api/semaspa/permit-references')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PermitReferencesController {
  constructor(private readonly permitReferencesService: PermitReferencesService) {}

  @Get()
  @ApiOperation({
    summary: 'List forest-guide AUTEF references with parse/match status',
    description:
      'One row per declared reference. Counts are discrepancies, not legal conclusions.',
  })
  @ApiOkResponse({ type: GetPermitReferencesResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(
    @Query() query: GetPermitReferencesQueryDto,
  ): Promise<GetPermitReferencesResponseDto> {
    return this.permitReferencesService.findAll(query);
  }
}
