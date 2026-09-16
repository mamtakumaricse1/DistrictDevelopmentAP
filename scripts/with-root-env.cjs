const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootEnv = path.join(__dirname, '..', '.env');
if (!fs.existsSync(rootEnv)) {
  console.error('Missing D:\\Dashboard\\.env — copy .env.example to .env first.');
  process.exit(1);
}

for (const raw of fs.readFileSync(rootEnv, 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) {
    continue;
  }
  const eq = line.indexOf('=');
  if (eq <= 0) {
    continue;
  }
  const key = line.slice(0, eq).trim();
  let value = line.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  process.exit(0);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
process.exit(result.status ?? 1);
