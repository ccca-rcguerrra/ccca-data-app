import { ApiProperty } from '@nestjs/swagger';

export class AutefRelatedResponseDto {
  @ApiProperty({ example: 497 })
  autefId: number;

  @ApiProperty({ nullable: true, example: '12345' })
  number: string | null;

  @ApiProperty({ nullable: true, example: 'Paragominas' })
  city: string | null;

  @ApiProperty({ example: 'PROPRIETARIO' })
  sharedRole: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6' })
  personId: string;
}
