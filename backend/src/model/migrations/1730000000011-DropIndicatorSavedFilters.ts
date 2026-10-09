import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropIndicatorSavedFilters1730000000011
  implements MigrationInterface
{
  name = 'DropIndicatorSavedFilters1730000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('public_app.indicator_saved_filters', true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE public_app.indicator_saved_filters (
        id SERIAL PRIMARY KEY,
        user_id int4 NOT NULL,
        name varchar(120) NOT NULL,
        indicator_id varchar(80),
        filters jsonb DEFAULT '{}'::jsonb,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);
  }
}
