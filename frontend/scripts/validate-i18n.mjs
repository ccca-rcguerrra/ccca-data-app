import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const localesDir = join(projectRoot, 'src', 'i18n', 'locales');
const baseLocale = 'pt-BR.json';

function readJson(fileName) {
  const filePath = join(localesDir, fileName);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }

  return Object.keys(value).flatMap((key) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(value[key], nextPrefix);
  });
}

const localeFiles = readdirSync(localesDir)
  .filter((fileName) => fileName.endsWith('.json'))
  .sort();

if (!localeFiles.includes(baseLocale)) {
  throw new Error(`Base locale not found: ${baseLocale}`);
}

const baseKeys = new Set(flattenKeys(readJson(baseLocale)));
let hasError = false;

for (const localeFile of localeFiles) {
  const localeKeys = new Set(flattenKeys(readJson(localeFile)));
  const missingKeys = [...baseKeys].filter((key) => !localeKeys.has(key));
  const extraKeys = [...localeKeys].filter((key) => !baseKeys.has(key));

  if (missingKeys.length || extraKeys.length) {
    hasError = true;
    console.error(`\n${localeFile}`);

    if (missingKeys.length) {
      console.error('  Missing keys:');
      for (const key of missingKeys) console.error(`    - ${key}`);
    }

    if (extraKeys.length) {
      console.error('  Extra keys:');
      for (const key of extraKeys) console.error(`    - ${key}`);
    }
  }
}

if (hasError) {
  process.exitCode = 1;
} else {
  console.log(`i18n keys are aligned across ${localeFiles.length} locales.`);
}
