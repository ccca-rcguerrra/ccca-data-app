import { registerAs } from '@nestjs/config';
import { readFileSync } from 'fs';
import { isAbsolute, join, resolve } from 'path';

const INITIATIVES_DIR = 'initiatives';

/**
 * Per-initiative AppConfig, loaded from a JSON file (served to the frontend via
 * GET /api/app-config).
 *
 * Resolution order:
 *   1. `MB_ALERTA_APP_CONFIG_PATH` — explicit path to a JSON file (absolute,
 *      or relative to the process CWD). Use it to mount a config outside the repo.
 *   2. `MB_ALERTA_APP_INITIATIVE` — picks `config/initiatives/app-config.<id>.json`
 *      (e.g. `bra` → `app-config.bra.json`, `per` → `app-config.per.json`).
 *   3. `config/initiatives/app-config.default.json` (Brazil — the default initiative).
 *
 * The alert class UNIVERSE still lives in CODE (AlertClass enum / ALERT_CLASSES);
 * the JSON carries the per-instance SELECTION, optional label overrides, and
 * territory/map config.
 * Bundled JSON files are copied to dist via nest-cli `assets`.
 *
 * See MULTI_INICIATIVA.md.
 */
const loadInitiativeConfig = () => {
  const configPath = process.env.APP_CONFIG_PATH?.trim();
  const initiative = (process.env.APP_INITIATIVE ?? 'default').toLowerCase();

  const candidates: string[] = [];
  if (configPath) {
    candidates.push(isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath));
  }

  // Search across build layouts. The compiled JS may live in `dist/config`
  // (docker/prod) or `dist/src/config` (some local builds), while nest-cli
  // assets are copied to `dist/src/config/initiatives`. Mirror
  // mail-template.util.ts so the JSON is found regardless of where it lands
  // relative to `__dirname`.
  const fileNames = [`app-config.${initiative}.json`, 'app-config.default.json'];
  const baseDirs = [
    join(__dirname, INITIATIVES_DIR),
    join(process.cwd(), 'dist', 'config', INITIATIVES_DIR),
    join(process.cwd(), 'dist', 'src', 'config', INITIATIVES_DIR),
    join(process.cwd(), 'src', 'config', INITIATIVES_DIR),
  ];
  for (const dir of baseDirs) {
    for (const fileName of fileNames) {
      candidates.push(join(dir, fileName));
    }
  }

  for (const file of candidates) {
    try {
      return JSON.parse(readFileSync(file, 'utf-8'));
    } catch {
      // file missing/invalid — try the next candidate
    }
  }

  throw new Error(
    `AppConfig: no JSON config found (path='${configPath ?? ''}', initiative='${initiative}')`,
  );
};

export default registerAs('appConfig', loadInitiativeConfig);
