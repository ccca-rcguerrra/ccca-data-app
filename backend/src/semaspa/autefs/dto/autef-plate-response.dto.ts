import { ApiProperty } from '@nestjs/swagger';

export class AutefPlateResponseDto {
  @ApiProperty({ example: 'ABC1D23' })
  plate: string;

  @ApiProperty({ example: 4 })
  distinctGfCount: number;
}
