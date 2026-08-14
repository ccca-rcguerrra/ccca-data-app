import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppConfigService } from './app-config.service';
import { GetInitiativePublicMetadataResponseDto } from './dto/initiative-public-metadata.dto';
import { Public } from '../auth/decorators/public.decorator';

/** Public identity metadata needed before authentication, e.g. on the login page. */
@ApiTags('initiative')
@Controller('api/initiative')
export class InitiativePublicMetadataController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get public initiative identity metadata' })
  @ApiOkResponse({ type: GetInitiativePublicMetadataResponseDto })
  getPublicMetadata(): GetInitiativePublicMetadataResponseDto {
    return new GetInitiativePublicMetadataResponseDto(
      this.appConfigService.getPublicMetadata(),
    );
  }
}
