import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateIndicatorSavedFilters1730000000010
  implements MigrationInterface
{
  name = 'CreateIndicatorSavedFilters1730000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'indicator_saved_filters',
        schema: 'public_app',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int4',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '120',
          },
          {
            name: 'indicator_id',
            type: 'varchar',
            length: '80',
            isNullable: true,
          },
          {
            name: 'filters',
            type: 'jsonb',
            default: `'{}'::jsonb`,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'public_app.indicator_saved_filters',
      new TableIndex({
        name: 'IDX_indicator_saved_filters_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'public_app.indicator_saved_filters',
      new TableForeignKey({
        name: 'FK_indicator_saved_filters_user',
        columnNames: ['user_id'],
        referencedSchema: 'public_app',
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public_app.indicator_saved_filters');
  }
}
