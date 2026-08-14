import { existsSync } from 'fs';
import { join } from 'path';

const RESET_PASSWORD_TEMPLATE = 'reset-password.ejs';

/**
 * Resolves the mail templates directory across build layouts:
 * - local/dev: dist/src/mail/templates
 * - docker/prod: dist/mail/mail.module.js with assets at dist/src/mail/templates
 */
export function resolveMailTemplatesDir(moduleDirname: string): string {
  const candidates = [
    join(moduleDirname, 'templates'),
    join(process.cwd(), 'dist', 'src', 'mail', 'templates'),
    join(process.cwd(), 'dist', 'mail', 'templates'),
    join(process.cwd(), 'src', 'mail', 'templates'),
  ];

  for (const dir of candidates) {
    if (existsSync(join(dir, RESET_PASSWORD_TEMPLATE))) {
      return dir;
    }
  }

  return join(moduleDirname, 'templates');
}
