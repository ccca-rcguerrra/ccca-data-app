# Module Rules

How to create a new NestJS module from scratch.

## Step-by-Step

### 1. Create folder structure

```
src/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── dto/
│   ├── create-<domain>.dto.ts
│   ├── update-<domain>.dto.ts
│   ├── get-<domain>-query.dto.ts
│   └── get-<domain>-response.dto.ts
└── services/
    └── <domain>.service.ts
```

### 2. Create the Server Module

```typescript
import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';
import { DomainController } from './domain.controller';
import { DomainService } from './services/domain.service';

@Module({
  imports: [ModelModule],
  controllers: [DomainController],
  providers: [DomainService],
  exports: [DomainService],
})
export class DomainModule {}
```

### 3. Register in `app.module.ts`

```typescript
import { DomainModule } from './domain/domain.module';

@Module({
  imports: [
    // ... existing imports
    DomainModule,
  ],
})
export class AppModule {}
```

### 4. Create the Controller

```typescript
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DomainService } from './services/domain.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { GetDomainQueryDto } from './dto/get-domain-query.dto';
import { GetDomainResponseDto } from './dto/get-domain-response.dto';

@ApiTags('domain')
@Controller('api/domain')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get()
  @ApiOperation({ summary: 'List all items' })
  @ApiOkResponse({ type: GetDomainResponseDto })
  async findAll(@Query() query: GetDomainQueryDto) {
    return this.domainService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create item' })
  @ApiOkResponse({ type: GetDomainResponseDto })
  async create(@Body() dto: CreateDomainDto) {
    return this.domainService.create(dto);
  }
}
```

### 5. Create the Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainEntity } from '../../model/entities/domain.entity';

@Injectable()
export class DomainService {
  constructor(
    @InjectRepository(DomainEntity)
    private readonly repository: Repository<DomainEntity>,
  ) {}

  async findAll(query: GetDomainQueryDto) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, page, limit, total };
  }
}
```

## Module with Bull Queue

If the domain needs a queue, also create:

```typescript
import { BullModule } from '@nestjs/bull';
import { QUEUES } from '../queues/queue.constants';

@Module({
  imports: [
    ModelModule,
    BullModule.registerQueue({ name: QUEUES.DOMAIN }),
  ],
  controllers: [DomainController],
  providers: [DomainService, DomainProducer, DomainProcessor],
  exports: [DomainService],
})
export class DomainModule {}
```

## Rules

- Controller uses `@UseGuards(JwtAuthGuard)` at class level (unless it has public routes)
- Public routes use `@Public()` decorator (import from `auth/decorators/public.decorator`)
- Route prefix is always plural: `/api/users`, `/api/teams`
- Service receives `@InjectRepository(Entity)` for TypeORM access
- `exports` the service so other modules can inject it
