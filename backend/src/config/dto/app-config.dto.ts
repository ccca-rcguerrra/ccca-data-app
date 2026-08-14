import { ApiProperty } from '@nestjs/swagger';

export class AppConfigDto {
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
