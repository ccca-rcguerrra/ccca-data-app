import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedAdminUser1730000000009 implements MigrationInterface {
  name = 'SeedAdminUser1730000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordHash = await bcrypt.hash('1q2w3e4r', 10);

    await queryRunner.query(
      `INSERT INTO public_app.users (name, email, password, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      ['Admin', 'rcguerra82@gmail.com', passwordHash, 1],
    );

    await queryRunner.query(
      `INSERT INTO public_app.user_roles (user_id, role, granted_at)
       VALUES ($1, $2, NOW())`,
      [1, 'admin'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM public_app.user_roles WHERE user_id = 1`);
    await queryRunner.query(`DELETE FROM public_app.users WHERE id = 1`);
  }
}
