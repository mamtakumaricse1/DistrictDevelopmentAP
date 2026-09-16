const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest);
    } else {
      copy(src, dest);
    }
  }
}

function rewrite(file, replacements) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text);
}

const api = path.join(root, 'apps', 'api', 'src');

copyDir(path.join(root, 'apps', 'api', 'prisma'), path.join(root, 'packages', 'database', 'prisma'));
copy(path.join(api, 'modules', 'prisma', 'prisma.service.ts'), path.join(root, 'packages', 'database', 'src', 'prisma.service.ts'));
copy(path.join(api, 'modules', 'prisma', 'prisma.module.ts'), path.join(root, 'packages', 'database', 'src', 'prisma.module.ts'));

const commonAuth = [
  'authz.service.ts',
  'authz.service.spec.ts',
  'issuer-registry.service.ts',
  'token-verifier.service.ts',
  'user-mapping.service.ts',
];
for (const file of commonAuth) {
  copy(path.join(api, 'modules', 'auth', file), path.join(root, 'packages', 'common', 'src', 'auth', file));
}
copy(path.join(api, 'modules', 'auth', 'types', 'auth-context.ts'), path.join(root, 'packages', 'common', 'src', 'auth', 'types', 'auth-context.ts'));
for (const file of ['public.decorator.ts', 'require-permissions.decorator.ts', 'current-user.decorator.ts']) {
  copy(path.join(api, 'modules', 'auth', 'decorators', file), path.join(root, 'packages', 'common', 'src', 'auth', 'decorators', file));
}
copy(path.join(api, 'modules', 'auth', 'guards', 'jwt-auth.guard.ts'), path.join(root, 'packages', 'common', 'src', 'auth', 'guards', 'jwt-auth.guard.ts'));
copy(path.join(api, 'modules', 'auth', 'guards', 'permissions.guard.ts'), path.join(root, 'packages', 'common', 'src', 'auth', 'guards', 'permissions.guard.ts'));
copy(path.join(api, 'common', 'filters', 'http-exception.filter.ts'), path.join(root, 'packages', 'common', 'src', 'http', 'http-exception.filter.ts'));
copy(path.join(api, 'common', 'interceptors', 'request-id.interceptor.ts'), path.join(root, 'packages', 'common', 'src', 'http', 'request-id.interceptor.ts'));
copy(path.join(api, 'common', 'dto', 'paginated.ts'), path.join(root, 'packages', 'common', 'src', 'http', 'paginated.ts'));
copy(path.join(api, 'common', 'types', 'express.d.ts'), path.join(root, 'packages', 'common', 'src', 'types', 'express.d.ts'));
for (const file of ['health.controller.ts', 'health.service.ts', 'health.module.ts', 'health.service.spec.ts', 'health.controller.spec.ts']) {
  copy(path.join(api, 'modules', 'health', file), path.join(root, 'packages', 'common', 'src', 'health', file));
}

rewrite(path.join(root, 'packages', 'common', 'src', 'auth', 'issuer-registry.service.ts'), [
  ["from '../prisma/prisma.service'", "from '@ddwmd/database'"],
]);
rewrite(path.join(root, 'packages', 'common', 'src', 'auth', 'user-mapping.service.ts'), [
  ["from '../prisma/prisma.service'", "from '@ddwmd/database'"],
]);
rewrite(path.join(root, 'packages', 'common', 'src', 'types', 'express.d.ts'), [
  ["from '../../modules/auth/types/auth-context'", "from '../auth/types/auth-context'"],
]);
rewrite(path.join(root, 'packages', 'common', 'src', 'health', 'health.service.ts'), [
  ["from '../prisma/prisma.service'", "from '@ddwmd/database'"],
]);
rewrite(path.join(root, 'packages', 'common', 'src', 'health', 'health.controller.ts'), [
  ["from '../auth/decorators/public.decorator'", "from '../auth/decorators/public.decorator'"],
]);
rewrite(path.join(root, 'packages', 'common', 'src', 'health', 'health.service.spec.ts'), [
  ["from '../prisma/prisma.service'", "from '@ddwmd/database'"],
]);

const identityModules = ['users', 'roles'];
for (const name of identityModules) {
  copyDir(path.join(api, 'modules', name), path.join(root, 'apps', 'identity', 'src', name));
}
copy(path.join(api, 'modules', 'auth', 'auth.controller.ts'), path.join(root, 'apps', 'identity', 'src', 'auth', 'auth.controller.ts'));
copy(path.join(api, 'modules', 'auth', 'auth.service.ts'), path.join(root, 'apps', 'identity', 'src', 'auth', 'auth.service.ts'));
copyDir(path.join(root, 'apps', 'api', 'test'), path.join(root, 'apps', 'identity', 'test'));

const orgModules = ['districts', 'departments', 'agencies', 'master-data', 'settings'];
for (const name of orgModules) {
  copyDir(path.join(api, 'modules', name), path.join(root, 'apps', 'organization', 'src', name));
}

copyDir(path.join(api, 'gateway'), path.join(root, 'apps', 'gateway', 'src', 'gateway'));
copy(path.join(api, 'gateway.app.module.ts'), path.join(root, 'apps', 'gateway', 'src', 'gateway.module.ts'));

const commonImportReplacements = [
  ["from '../prisma/prisma.service'", "from '@ddwmd/database'"],
  ["from '../../prisma/prisma.service'", "from '@ddwmd/database'"],
  ["from '../auth/authz.service'", "from '@ddwmd/common'"],
  ["from '../auth/types/auth-context'", "from '@ddwmd/common'"],
  ["from '../auth/decorators/current-user.decorator'", "from '@ddwmd/common'"],
  ["from '../auth/decorators/require-permissions.decorator'", "from '@ddwmd/common'"],
  ["from '../auth/decorators/public.decorator'", "from '@ddwmd/common'"],
  ["from './decorators/current-user.decorator'", "from '@ddwmd/common'"],
  ["from './decorators/public.decorator'", "from '@ddwmd/common'"],
  ["from './types/auth-context'", "from '@ddwmd/common'"],
  ["from '../prisma/prisma.service'", "from '@ddwmd/database'"],
];

function walk(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, fn);
    } else if (entry.name.endsWith('.ts')) {
      fn(full);
    }
  }
}

walk(path.join(root, 'apps', 'identity', 'src'), (file) => rewrite(file, commonImportReplacements));
walk(path.join(root, 'apps', 'organization', 'src'), (file) => rewrite(file, commonImportReplacements));
rewrite(path.join(root, 'apps', 'identity', 'src', 'auth', 'auth.service.ts'), [
  ["from '../prisma/prisma.service'", "from '@ddwmd/database'"],
  ["from './issuer-registry.service'", "from '@ddwmd/common'"],
]);
rewrite(path.join(root, 'apps', 'gateway', 'src', 'gateway', 'gateway-health.controller.ts'), [
  ["from '../modules/auth/decorators/public.decorator'", "from '@ddwmd/common'"],
]);
rewrite(path.join(root, 'apps', 'gateway', 'src', 'gateway.module.ts'), [
  ["from './common/filters/http-exception.filter'", "from '@ddwmd/common'"],
  ["from './common/interceptors/request-id.interceptor'", "from '@ddwmd/common'"],
  ["from './gateway/gateway-health.controller'", "from './gateway/gateway-health.controller'"],
  ['export class GatewayAppModule', 'export class GatewayModule'],
]);

rewrite(path.join(root, 'apps', 'identity', 'test', 'health.e2e-spec.ts'), [
  ["from '../src/app.module'", "from '../src/identity.module'"],
  ['AppModule', 'IdentityModule'],
  ["from '../src/modules/prisma/prisma.service'", "from '@ddwmd/database'"],
]);
rewrite(path.join(root, 'apps', 'identity', 'test', 'auth.e2e-spec.ts'), [
  ["from '../src/app.module'", "from '../src/identity.module'"],
  ['AppModule', 'IdentityModule'],
  ["from '../src/modules/auth/token-verifier.service'", "from '@ddwmd/common'"],
  ["from '../src/modules/auth/user-mapping.service'", "from '@ddwmd/common'"],
  ["from '../src/modules/auth/types/auth-context'", "from '@ddwmd/common'"],
  ["from '../src/modules/prisma/prisma.service'", "from '@ddwmd/database'"],
]);

console.log('Copied service sources.');
