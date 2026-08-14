# Entity + Migration Rules

## Entity Template

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'items', schema: 'public' })
export class Item {
  @ApiProperty({ description: 'Unique ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Name', example: 'Example' })
  @Column({ type: 'varchar', length: 500 })
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Owner user ID' })
  @Column({ name: 'user_id', type: 'int4' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

## Column Reference

| Type | Use for |
|------|---------|
| `int` / `int4` | IDs, counters |
| `varchar(length)` | Strings with max length |
| `text` | Long text content |
| `boolean` | True/false flags |
| `timestamp` | Date/time columns |
| `numeric(precision, scale)` | Decimal numbers (area, coordinates) |
| `jsonb` | JSON data with query support |
| `int4[]` (isArray: true) | PostgreSQL arrays |
| `geometry(MultiPolygon, srid)` | Spatial columns (add via migration SQL) |

## Registration Checklist

After creating an entity, you MUST:

1. **Add to `model.module.ts`**
   ```typescript
   import { Item } from './entities/item.entity';

   const features = [
     // ... existing
     Item,
   ];
   ```

2. **Add to `model/index.ts`** (barrel export)
   ```typescript
   export { Item } from './entities/item.entity';
   ```

## Migration Template

Generate with TypeORM CLI, then edit to use QueryRunner API:

```bash
pnpm typeorm migration:generate -- -d src/model/typeorm.datasource.ts --pretty src/model/migrations/<Timestamp>-CreateItems
```

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateItems1740000000000 implements MigrationInterface {
  name = 'CreateItems1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'items',
        schema: 'public',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar', length: '500' },
          { name: 'user_id', type: 'int4' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('public.items', new TableIndex({
      name: 'IDX_items_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createForeignKey('public.items', new TableForeignKey({
      name: 'FK_items_user',
      columnNames: ['user_id'],
      referencedSchema: 'public',
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public.items');
  }
}
```

## Rules

- **Schema is always `public`** — all tables in public schema
- **Use QueryRunner API** — `createTable`, `createIndex`, `createForeignKey` — never raw SQL
- **Exception: PostGIS geometry** — geometry columns need `ALTER TABLE ... ADD COLUMN geom geometry(...)` raw SQL
- **Exception: Extensions** — `CREATE EXTENSION IF NOT EXISTS postgis` raw SQL
- **Naming**: indexes `IDX_<table>_<column>`, FKs `FK_<table>_<ref>`
- **Soft delete**: use `@DeleteDateColumn()` for `deleted_at`
- **Composite PKs**: multiple `@PrimaryColumn()` decorators
- **Arrays**: `type: 'int4', isArray: true`
- **JSONB**: `type: 'jsonb', default: '\'{}\'::jsonb'`
- **No FK on user_roles**: `createForeignKeyConstraints: false` (by design)
