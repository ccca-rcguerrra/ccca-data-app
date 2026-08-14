import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTerritories1730000000002 implements MigrationInterface {
  name = 'CreateTerritories1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'territories',
        schema: 'public_app',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'version',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'source',
            type: 'varchar',
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: 'true',
          },
          {
            name: 'area_ha',
            type: 'numeric',
            precision: 14,
            scale: 5,
            isNullable: true,
          },
          {
            name: 'source_id_type',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'source_id_value',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'inserted_at',
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

    await queryRunner.query(
      'ALTER TABLE public_app.territories ADD COLUMN geom geometry(MultiPolygon, 4674)',
    );
    await queryRunner.query(
      'ALTER TABLE public_app.territories ADD COLUMN old_geom geometry(MultiPolygon, 4674)',
    );

    await queryRunner.query(
      'CREATE INDEX IDX_territories_geom ON public_app.territories USING GIST (geom)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public_app.territories');
  }
}
