const { spawn, spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

const common = spawnSync('npm', ['run', 'build', '-w', '@ddwmd/common'], {
  stdio: 'inherit',
  shell: true,
  cwd: root,
});
if (common.status !== 0) {
  process.exit(common.status ?? 1);
}

const services = [
  ['@ddwmd/identity', 'Identity :3001'],
  ['@ddwmd/organization', 'Organization :3002'],
  ['@ddwmd/works', 'Works :3003'],
  ['@ddwmd/governance', 'Governance :3004'],
  ['@ddwmd/notify', 'Notify :3005'],
  ['@ddwmd/gateway', 'Gateway :3000'],
];

for (const [workspace, label] of services) {
  const child = spawn('npm', ['run', 'start:dev', '-w', workspace], {
    stdio: 'inherit',
    shell: true,
    cwd: root,
  });
  child.on('exit', (code) => {
    console.error(`${label} exited with code ${code}`);
  });
}
