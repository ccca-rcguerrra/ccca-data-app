import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppConfigService } from './app-config.service';
import { GetAppConfigResponseDto } from './dto/get-app-config-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('app-config')
@Controller('api/app-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Get app configuration',
    description:
      'Returns the resolved per-initiative configuration (alert classes, territory filters, maps). Fetched once by the frontend at boot.',
  })
  @ApiOkResponse({
    description: 'System configuration returned successfully',
    type: GetAppConfigResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired JWT token',
  })
  getAppConfig(): GetAppConfigResponseDto {
    return new GetAppConfigResponseDto(
      this.appConfigService.getAppConfig(),
    );
  }
}
