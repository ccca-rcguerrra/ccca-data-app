import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateNotifications1730000000008 implements MigrationInterface {
  name = 'CreateNotifications1730000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
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
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'body',
            type: 'text',
          },
          {
            name: 'data',
            type: 'jsonb',
            default: `'{}'::jsonb`,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'public_app.notifications',
      new TableIndex({
        name: 'IDX_notifications_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'public_app.notifications',
      new TableIndex({
        name: 'IDX_notifications_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'public_app.notifications',
      new TableIndex({
        name: 'IDX_notifications_read_at',
        columnNames: ['read_at'],
      }),
    );

    await queryRunner.createForeignKey(
      'public_app.notifications',
      new TableForeignKey({
        name: 'FK_notifications_user',
        columnNames: ['user_id'],
        referencedSchema: 'public_app',
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public_app.notifications');
  }
}
