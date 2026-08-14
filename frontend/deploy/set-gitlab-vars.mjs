#!/usr/bin/env node
/**
 * Reads a .env file and writes entries as GitLab group CI/CD variables.
 *
 * Requires: Node >= 18 (native fetch)
 *
 * Usage:
 *   node deploy/set-gitlab-vars.mjs [--env <file>] [--group <group>] [--token <token>] [--environment <scope>] [--prefix <prefix>]
 *   node deploy/set-gitlab-vars.mjs --clear-all [--group <group>] [--token <token>] [--environment <scope>] [--prefix <prefix>] [--yes]
 *
 * Example:
 *   node deploy/set-gitlab-vars.mjs --env .env --group mapbiomas/alertas --environment staging --prefix STG_
 *   node deploy/set-gitlab-vars.mjs --clear-all --group mapbiomas/alertas --environment production --yes
 *   node deploy/set-gitlab-vars.mjs --clear-all -g mapbiomas/alertas -n staging --prefix STG_ --yes
 */

import { readFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';

// ── CLI arguments ─────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);

function getArg(flag) {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] ?? '' : undefined;
}

if (argv.includes('--help') || argv.includes('-h')) {
  console.log(`
Usage: node deploy/set-gitlab-vars.mjs [options]

Options:
  -e, --env          <file>     .env file to use           (default: .env.prod)
  -g, --group        <group>    GitLab group namespace     (e.g.: mapbiomas/alertas)
  -t, --token        <token>    Personal Access Token      (or env GITLAB_TOKEN)
  -n, --environment  <scope>    Environment scope          (default: *)
  -p, --prefix       <prefix>   Prepended to each key on upsert, or filter keys starting with this prefix on --clear-all (or env GITLAB_VAR_PREFIX); e.g. STG_
  -c, --clear-all               Delete group variables (respects --environment; with --prefix, only keys starting with the prefix)
  -y, --yes                     Skip safety confirmation for --clear-all
  -h, --help                    Show this help

Examples:
  node deploy/set-gitlab-vars.mjs --env deploy/docker-compose.staging.env -g mapbiomas/alertas -n staging --prefix STG_
  GITLAB_TOKEN=glpat-xxx node deploy/set-gitlab-vars.mjs -e .env.prod -g mapbiomas/alertas -n '*'
  node deploy/set-gitlab-vars.mjs --clear-all -g mapbiomas/alertas -n production
  node deploy/set-gitlab-vars.mjs --clear-all -g mapbiomas/alertas -n staging --prefix STG_ --yes
`.trim());
  process.exit(0);
}

// ── .env parser ───────────────────────────────────────────────────────────────
// Supports:
//   KEY=valor_simples
//   KEY='valor com espaços'
//   KEY='valor
//        multiline'          ← closes on the line ending with '
//   # comments and empty lines are ignored

function parseEnvFile(filePath) {
  const lines = readFileSync(filePath, 'utf8').split('\n');
  const vars = new Map();
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    const match = lines[i].match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)/s);
    if (!match) {
      i++;
      continue;
    }

    const key = match[1];
    let rest = match[2];
    let value;

    if (rest.startsWith("'")) {
      rest = rest.slice(1);
      const closeIdx = rest.indexOf("'");
      if (closeIdx !== -1) {
        value = rest.slice(0, closeIdx);
      } else {
        const parts = [rest];
        while (++i < lines.length) {
          const next = lines[i];
          if (next.endsWith("'")) {
            parts.push(next.slice(0, -1));
            break;
          }
          parts.push(next);
        }
        value = parts.join('\n');
      }
    } else if (rest.startsWith('"')) {
      rest = rest.slice(1);
      const closeIdx = rest.indexOf('"');
      if (closeIdx !== -1) {
        value = rest.slice(0, closeIdx);
      } else {
        const parts = [rest];
        while (++i < lines.length) {
          const next = lines[i];
          if (next.endsWith('"')) {
            parts.push(next.slice(0, -1));
            break;
          }
          parts.push(next);
        }
        value = parts.join('\n');
      }
    } else {
      value = rest.replace(/\s+#.*$/, '').trim();
    }

    vars.set(key, value);
    i++;
  }

  return vars;
}

// ── Interactive prompt ────────────────────────────────────────────────────────

function ask(question, secret = false) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (secret) rl._writeToOutput = () => {};
    rl.question(question, (answer) => {
      if (secret) process.stdout.write('\n');
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ── Masked auto-detection ─────────────────────────────────────────────────────
// GitLab requires: min. 8 chars, no spaces/newlines/quotes/backslashes.
// Applies only to keys matching sensitive patterns.

const SENSITIVE_RE = /PASSWORD|SECRET|PRIVATE_KEY|CREDENTIALS/i;

// GitLab masked variables only allow: a-z A-Z 0-9 _ - . @ : /
// Any other char (e.g.: !, \n, spaces, quotes) prevents masking.
function shouldMask(key, value) {
  if (!SENSITIVE_RE.test(key)) return false;
  return value.length >= 8 && /^[a-zA-Z0-9_.@:/\-]+$/.test(value);
}

function normalizeEnvironmentScope(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return '*';
  if (
    normalized === '*' ||
    normalized === 'all' ||
    normalized === 'all (default)' ||
    normalized === 'default' ||
    normalized === 'all-default'
  ) {
    return '*';
  }
  return value.trim();
}

/** GitLab keys: prepend prefix only on upload (original key stays in .env). */
function keyWithPrefix(originalKey, prefix) {
  const p = String(prefix ?? '').trim();
  return p ? `${p}${originalKey}` : originalKey;
}

// ── GitLab API ────────────────────────────────────────────────────────────────

async function createVar(apiUrl, token, key, value, masked, environment) {
  process.stdout.write(`  ${key.padEnd(55)}`);

  // raw: true keeps values literal (GitLab won't expand "$" as a variable reference),
  // which is required for secrets containing "$" (e.g. DB passwords).
  const payload = JSON.stringify({ key, value, masked, raw: true, protected: false, environment_scope: environment });
  const headers = { 'PRIVATE-TOKEN': token, 'Content-Type': 'application/json' };

  let res = await fetch(apiUrl, { method: 'POST', headers, body: payload });
  let body = await res.json().catch(() => ({}));

  // Variable already exists → update via PUT (with scope filter to avoid ambiguity)
  if (res.status === 400 && JSON.stringify(body).includes('has already been taken')) {
    const putUrl = `${apiUrl}/${encodeURIComponent(key)}?filter[environment_scope]=${encodeURIComponent(environment)}`;
    res = await fetch(putUrl, { method: 'PUT', headers, body: payload });
    body = await res.json().catch(() => ({}));
    if (res.status === 200) {
      console.log(`↺  updated${masked ? '  (masked)' : ''}`);
      return;
    }
  }

  if (res.status === 201) {
    console.log(`✓${masked ? '  (masked)' : ''}`);
  } else {
    console.log(`✗  error ${res.status}`);
    console.error(`     ${JSON.stringify(body)}`);
  }
}

async function listAllVars(apiUrl, token, environment) {
  const headers = { 'PRIVATE-TOKEN': token };
  const allVars = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const listUrl = `${apiUrl}?per_page=${perPage}&page=${page}`;
    const res = await fetch(listUrl, { headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Failed to list variables (${res.status}): ${JSON.stringify(body)}`);
    }

    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      if (environment === '*' || item.environment_scope === environment) {
        allVars.push(item);
      }
    }

    if (items.length < perPage) break;
    page++;
  }

  return allVars;
}

async function deleteVar(apiUrl, token, key, environment) {
  process.stdout.write(`  ${key.padEnd(55)}`);
  const deleteUrl = `${apiUrl}/${encodeURIComponent(key)}?filter[environment_scope]=${encodeURIComponent(environment)}`;
  const headers = { 'PRIVATE-TOKEN': token };
  const res = await fetch(deleteUrl, { method: 'DELETE', headers });

  if (res.status === 204) {
    console.log('✓  deleted');
    return true;
  }

  const body = await res.json().catch(() => ({}));
  console.log(`✗  error ${res.status}`);
  console.error(`     ${JSON.stringify(body)}`);
  return false;
}

async function clearAllVars(apiUrl, token, environment, prefix = '') {
  const allInScope = await listAllVars(apiUrl, token, environment);
  if (allInScope.length === 0) {
    console.log('No variables found for deletion.');
    return;
  }

  const p = String(prefix ?? '').trim();
  const vars = p ? allInScope.filter((v) => v.key.startsWith(p)) : allInScope;

  if (p && vars.length === 0) {
    console.log(
      `No variables match key prefix "${p}" (${allInScope.length} in scope, skipped).`,
    );
    return;
  }

  if (p) {
    console.log(
      `Key prefix "${p}": ${vars.length} of ${allInScope.length} variable(s) in scope will be deleted.`,
    );
  } else {
    console.log(`Found ${vars.length} variable(s) to delete.`);
  }
  console.log('─'.repeat(70));

  let deleted = 0;
  for (const variable of vars) {
    const ok = await deleteVar(apiUrl, token, variable.key, variable.environment_scope);
    if (ok) deleted++;
  }

  console.log('─'.repeat(70));
  console.log(`Deletion finished: ${deleted}/${vars.length} variable(s) deleted.`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let envFile     = getArg('--env')         ?? getArg('-e');
  let group       = getArg('--group')       ?? getArg('-g');
  let token       = getArg('--token')       ?? getArg('-t') ?? process.env.GITLAB_TOKEN ?? '';
  let environment = getArg('--environment') ?? getArg('-n');
  let prefix =
    getArg('--prefix') ?? getArg('-p') ?? process.env.GITLAB_VAR_PREFIX ?? '';
  prefix = typeof prefix === 'string' ? prefix.trim() : '';
  const clearAll  = argv.includes('--clear-all') || argv.includes('-c');
  const skipCheck = argv.includes('--yes') || argv.includes('-y');

  if (!group) {
    group = await ask('GitLab group [mapbiomas/alertas]: ') || 'mapbiomas/alertas';
  }

  if (!token) {
    token = await ask('Personal Access Token: ', true);
  }
  if (!token) {
    console.error('❌  Token not provided.');
    process.exit(1);
  }

  if (!environment) {
    const input = await ask('Environment scope [*]: ');
    environment = normalizeEnvironmentScope(input || '*');
  } else {
    environment = normalizeEnvironmentScope(environment);
  }

  const apiUrl = `https://gitlab.com/api/v4/groups/${encodeURIComponent(group)}/variables`;

  console.log(`\nGroup      : ${group}`);
  console.log(`Environment: ${environment}`);
  console.log(`Mode       : ${clearAll ? 'clear-all' : 'upsert from env file'}`);
  if (prefix) {
    if (clearAll) {
      console.log(`Key prefix : ${prefix}  (only variables whose key starts with this prefix)`);
    } else {
      console.log(`Key prefix : ${prefix}  (example: MB_ALERTA_… → ${prefix}MB_ALERTA_…)`);
    }
  }

  if (clearAll) {
    if (prefix) {
      console.log(
        '⚠️  This operation will delete variables whose key starts with the prefix above (group + environment scope).',
      );
    } else {
      console.log('⚠️  This operation will delete all variables from the selected group and scope.');
    }
    if (!skipCheck) {
      const confirmation = await ask('Type DELETE to continue: ');
      if (confirmation !== 'DELETE') {
        console.log('Operation cancelled.');
        process.exit(0);
      }
    }
    await clearAllVars(apiUrl, token, environment, prefix);
    console.log('Done.');
    return;
  }

  if (!envFile) {
    envFile = await ask('.env file [.env.prod]: ') || '.env.prod';
  }
  if (!existsSync(envFile)) {
    console.error(`❌  File not found: ${envFile}`);
    process.exit(1);
  }

  const vars = parseEnvFile(envFile);
  console.log(`File       : ${envFile}`);
  console.log(`Total      : ${vars.size} variables`);
  console.log('─'.repeat(70));

  for (const [key, value] of vars) {
    const gitlabKey = keyWithPrefix(key, prefix);
    await createVar(apiUrl, token, gitlabKey, value, shouldMask(gitlabKey, value), environment);
  }

  console.log('─'.repeat(70));
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
