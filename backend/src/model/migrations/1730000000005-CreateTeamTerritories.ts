import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTeamTerritories1730000000005 implements MigrationInterface {
  name = 'CreateTeamTerritories1730000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'team_territories',
        schema: 'public_app',
        columns: [
          {
            name: 'team_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'territory_id',
            type: 'int',
            isPrimary: true,
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

    await queryRunner.createForeignKey(
      'public_app.team_territories',
      new TableForeignKey({
        name: 'FK_team_territories_team',
        columnNames: ['team_id'],
        referencedSchema: 'public_app',
        referencedTableName: 'teams',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public_app.team_territories');
  }
}
