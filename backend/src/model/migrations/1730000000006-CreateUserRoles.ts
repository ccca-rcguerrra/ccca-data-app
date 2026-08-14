import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUserRoles1730000000006 implements MigrationInterface {
  name = 'CreateUserRoles1730000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
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
            name: 'role',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'granted_by',
            type: 'int4',
            isNullable: true,
          },
          {
            name: 'granted_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'public_app.user_roles',
      new TableIndex({
        name: 'IDX_user_roles_user_id_role',
        columnNames: ['user_id', 'role'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public_app.user_roles');
  }
}
