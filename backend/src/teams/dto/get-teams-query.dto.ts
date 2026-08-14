import { IsOptional, IsInt, Min, Max, IsString, IsArray, IsNumberString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetTeamsQueryDto {
    @ApiProperty({
        description: 'Page number',
        example: 1,
        type: Number,
        minimum: 1,
        default: 1,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        example: 10,
        type: Number,
        minimum: 1,
        maximum: 1000,
        default: 10,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(1000)
    limit?: number = 10;

    @ApiProperty({
        description: 'Search text to filter by team name (partial match, case-insensitive)',
        example: 'Alpha',
        type: String,
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'Filter by user IDs (exact match). Can be a single ID or array of IDs',
        example: [1, 2],
        type: [Number],
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return undefined;
        if (Array.isArray(value)) {
            return value;
        }
        return [value];
    })
    @IsArray()
    @IsNumberString({}, { each: true })
    users?: number[];
}





