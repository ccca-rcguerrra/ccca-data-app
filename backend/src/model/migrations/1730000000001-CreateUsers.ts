import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsers1730000000001 implements MigrationInterface {
  name = 'CreateUsers1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
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
            name: 'name',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'photo',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'googleid',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'status',
            type: 'numeric',
            precision: 2,
            default: '1',
          },
          {
            name: 'institution',
            type: 'varchar',
            length: '500',
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
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public_app.users');
  }
}
