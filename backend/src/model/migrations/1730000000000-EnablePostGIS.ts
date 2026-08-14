import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePostGIS1730000000000 implements MigrationInterface {
  name = 'EnablePostGIS1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS public_app');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Keep public_app: it also hosts dbt views. Only drop PostGIS if unused.
    await queryRunner.query('DROP EXTENSION IF EXISTS postgis');
  }
}
