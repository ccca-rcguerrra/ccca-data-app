import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateComments1730000000007 implements MigrationInterface {
  name = 'CreateComments1730000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comments',
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
            name: 'channel',
            type: 'varchar',
            length: '120',
          },
          {
            name: 'user_id',
            type: 'int4',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'mentioned_user_ids',
            type: 'int4',
            isArray: true,
            isNullable: true,
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
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'public_app.comments',
      new TableIndex({
        name: 'IDX_comments_channel',
        columnNames: ['channel'],
      }),
    );

    await queryRunner.createIndex(
      'public_app.comments',
      new TableIndex({
        name: 'IDX_comments_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'public_app.comments',
      new TableForeignKey({
        name: 'FK_comments_user',
        columnNames: ['user_id'],
        referencedSchema: 'public_app',
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public_app.comments');
  }
}
