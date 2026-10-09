import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneralStatisticsTotalsDto {
  @ApiProperty({ example: 48210 })
  autefs: number;

  @ApiProperty({ example: 132845 })
  gfs: number;

  @ApiProperty({ example: 6302 })
  autefsSemGf: number;

  @ApiProperty({ example: 86.9 })
  coveragePct: number;
}

export class GeneralStatisticsYearItemDto {
  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ example: 9310 })
  autefs: number;

  @ApiProperty({ example: 27890 })
  gfs: number;

  @ApiProperty({ example: 1180 })
  autefsSemGf: number;
}

export class GeneralStatisticsSummaryResponseDto {
  @ApiProperty({ example: '2026-09-23T14:02:00.000Z' })
  generatedAt: string;

  @ApiProperty({ type: GeneralStatisticsTotalsDto })
  totals: GeneralStatisticsTotalsDto;

  @ApiProperty({ type: [GeneralStatisticsYearItemDto] })
  byYear: GeneralStatisticsYearItemDto[];
}

export class GeneralStatisticsMonthItemDto {
  @ApiProperty({ example: 1 })
  month: number;

  @ApiProperty({ example: 420 })
  autefs: number;

  @ApiProperty({ example: 1180 })
  gfs: number;

  @ApiProperty({ example: 60 })
  autefsSemGf: number;
}

export class GeneralStatisticsByMonthResponseDto {
  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ type: [GeneralStatisticsMonthItemDto] })
  months: GeneralStatisticsMonthItemDto[];
}

export class GetStatisticsByMonthQueryDto {
  @ApiProperty({ example: 2024, description: 'Year to break down by month' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year: number;
}
