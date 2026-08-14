# API Design Rules

## DTO Pattern

### Create DTO (input validation)

```typescript
import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name', example: 'Example' })
  @IsString()
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
```

### Query DTO (pagination + filters)

```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetItemsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

### Response DTO (wrapping)

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class ItemResponseDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Item name', example: 'Example' })
  name: string;

  constructor(entity: ItemEntity) {
    this.id = entity.id;
    this.name = entity.name;
  }
}

export class GetItemsResponseDto {
  @ApiProperty({ type: [ItemResponseDto] })
  data: ItemResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;

  constructor(data: ItemResponseDto[], page: number, limit: number, total: number) {
    this.data = data;
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page * limit < total;
    this.hasPrev = page > 1;
  }
}
```

## Validation Rules

The global `ValidationPipe` enforces:
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — throws on unknown properties
- `transform: true` — auto-casts query params to DTO types

## HTTP Methods Convention

| Method | Purpose | Example |
|--------|---------|---------|
| `GET /api/resource` | List (paginated) | `GET /api/users?page=1&limit=20` |
| `GET /api/resource/:id` | Get one | `GET /api/users/42` |
| `POST /api/resource` | Create | `POST /api/users` with body |
| `PATCH /api/resource/:id` | Update partial | `PATCH /api/users/42` |
| `DELETE /api/resource/:id` | Delete | `DELETE /api/users/42` |

## Swagger Annotations

Every controller method must have:
- `@ApiOperation({ summary: '...' })` — one-line description
- `@ApiOkResponse({ type: ResponseDto, description: '...' })` — success response
- Error responses: `@ApiNotFoundResponse()`, `@ApiBadRequestResponse()`, `@ApiUnauthorizedResponse()`
