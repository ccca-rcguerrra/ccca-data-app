import { ApiProperty } from '@nestjs/swagger';

export class InitiativePublicMetadataDto {
  @ApiProperty({ example: 'default', type: String })
  id: string;

  @ApiProperty({ example: 'Workspace', type: String })
  name: string;

  @ApiProperty({ example: 'Brazil', type: String })
  country: string;

  @ApiProperty({ example: 'BR', type: String })
  countryCode: string;

  @ApiProperty({ example: 'pt-BR', type: String })
  locale: string;

  @ApiProperty({ example: 'pt', type: String })
  defaultLanguage: string;
}

export class GetInitiativePublicMetadataResponseDto {
  @ApiProperty({ type: InitiativePublicMetadataDto })
  data: InitiativePublicMetadataDto;

  constructor(data: InitiativePublicMetadataDto) {
    this.data = data;
  }
}
