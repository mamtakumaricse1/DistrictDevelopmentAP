import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const CHANGLANG = '11111111-1111-1111-1111-111111111111';
const TIRAP = '22222222-2222-2222-2222-222222222222';
const CHANGLANG_PWD = '33333333-3333-3333-3333-333333333333';
const TIRAP_PWD = '55555555-5555-5555-5555-555555555555';

const PERMISSIONS: Array<{ code: string; name: string; module: string }> = [
  { code: 'district:manage', name: 'Manage districts', module: 'district' },
  { code: 'district:read', name: 'Read districts', module: 'district' },
  { code: 'user:manage', name: 'Manage users', module: 'user' },
  { code: 'role:manage', name: 'Manage roles', module: 'user' },
  { code: 'department:manage', name: 'Manage departments', module: 'department' },
  { code: 'agency:manage', name: 'Manage agencies', module: 'agency' },
  { code: 'master:manage', name: 'Manage master data', module: 'master' },
  { code: 'config:manage', name: 'Manage system settings', module: 'config' },
  { code: 'project:create', name: 'Create projects', module: 'project' },
  { code: 'project:update', name: 'Update projects', module: 'project' },
  { code: 'project:read', name: 'Read projects', module: 'project' },
  { code: 'project:delete', name: 'Delete or close projects', module: 'project' },
  { code: 'progress:submit', name: 'Submit progress', module: 'progress' },
  { code: 'progress:read', name: 'Read progress', module: 'progress' },
  { code: 'document:upload', name: 'Upload documents', module: 'document' },
  { code: 'dashboard:read', name: 'Read dashboard', module: 'dashboard' },
  { code: 'meeting:manage', name: 'Manage review meetings', module: 'meeting' },
  { code: 'action:manage', name: 'Manage action items', module: 'action' },
  { code: 'action:update', name: 'Update assigned actions', module: 'action' },
  { code: 'report:export', name: 'Export reports', module: 'report' },
  { code: 'audit:read', name: 'Read audit logs', module: 'audit' },
  { code: 'notification:read', name: 'Read own notifications', module: 'notification' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map((item) => item.code),
  DISTRICT_ADMIN: [
    'district:read',
    'user:manage',
    'department:manage',
    'agency:manage',
    'master:manage',
    'project:create',
    'project:update',
    'project:read',
    'project:delete',
    'progress:submit',
    'progress:read',
    'document:upload',
    'dashboard:read',
    'meeting:manage',
    'action:manage',
    'action:update',
    'report:export',
    'audit:read',
    'notification:read',
  ],
  DEPARTMENT_USER: [
    'district:read',
    'project:read',
    'project:update',
    'progress:submit',
    'progress:read',
    'document:upload',
    'dashboard:read',
    'action:update',
    'notification:read',
  ],
  VIEWER: [
    'district:read',
    'project:read',
    'progress:read',
    'dashboard:read',
    'report:export',
    'notification:read',
  ],
};

function issuerFor(realm: string): string {
  const base = (process.env.KEYCLOAK_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
  return `${base}/realms/${realm}`;
}

async function upsertUser(input: {
  issuer: string;
  email: string;
  displayName: string;
  roleCode: string;
  districtId: string | null;
  departmentId?: string;
}) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.upsert({
    where: { keycloakIssuer_email: { keycloakIssuer: input.issuer, email } },
    update: { displayName: input.displayName, isActive: true },
    create: {
      keycloakIssuer: input.issuer,
      keycloakSub: `pending:${input.issuer}:${email}`,
      email,
      displayName: input.displayName,
    },
  });
  const role = await prisma.role.findUniqueOrThrow({ where: { code: input.roleCode } });
  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, roleId: role.id, districtId: input.districtId },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: role.id, districtId: input.districtId },
    });
  }
  if (input.departmentId) {
    await prisma.userDepartment.upsert({
      where: { userId_departmentId: { userId: user.id, departmentId: input.departmentId } },
      update: {},
      create: { userId: user.id, departmentId: input.departmentId },
    });
  }
}

async function main(): Promise<void> {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name, module: permission.module },
      create: permission,
    });
  }

  const roles = [
    { code: 'SUPER_ADMIN', name: 'System Administrator', description: 'Cross-district technical administration' },
    { code: 'DISTRICT_ADMIN', name: 'District Administrator', description: 'Consolidated district monitoring' },
    { code: 'DEPARTMENT_USER', name: 'Department User', description: 'Department or agency officer' },
    { code: 'VIEWER', name: 'Viewer', description: 'Read-only access' },
  ];

  for (const role of roles) {
    const saved = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description, isSystem: true },
      create: { ...role, isSystem: true },
    });
    const codes = ROLE_PERMISSIONS[role.code];
    const permissions = await prisma.permission.findMany({ where: { code: { in: codes } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: saved.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: saved.id, permissionId: permission.id })),
    });
  }

  for (const district of [
    { id: CHANGLANG, code: 'CHANGLANG', realm: 'changlang' },
    { id: TIRAP, code: 'TIRAP', realm: 'tirap' },
  ]) {
    await prisma.registeredIssuer.upsert({
      where: { issuer: issuerFor(district.realm) },
      update: { realm: district.realm, districtId: district.id, districtCode: district.code, isActive: true },
      create: {
        issuer: issuerFor(district.realm),
        realm: district.realm,
        districtId: district.id,
        districtCode: district.code,
      },
    });
  }

  await upsertUser({
    issuer: issuerFor('system'),
    email: 'sys.admin@ddwmd.local',
    displayName: 'System Administrator',
    roleCode: 'SUPER_ADMIN',
    districtId: null,
  });
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'da.changlang@ddwmd.local',
    displayName: 'Changlang District Admin',
    roleCode: 'DISTRICT_ADMIN',
    districtId: CHANGLANG,
  });
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'pwd.changlang@ddwmd.local',
    displayName: 'Changlang PWD Officer',
    roleCode: 'DEPARTMENT_USER',
    districtId: CHANGLANG,
    departmentId: CHANGLANG_PWD,
  });
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'viewer.changlang@ddwmd.local',
    displayName: 'Changlang Viewer',
    roleCode: 'VIEWER',
    districtId: CHANGLANG,
  });
  await upsertUser({
    issuer: issuerFor('tirap'),
    email: 'da.tirap@ddwmd.local',
    displayName: 'Tirap District Admin',
    roleCode: 'DISTRICT_ADMIN',
    districtId: TIRAP,
  });
  await upsertUser({
    issuer: issuerFor('tirap'),
    email: 'pwd.tirap@ddwmd.local',
    displayName: 'Tirap PWD Officer',
    roleCode: 'DEPARTMENT_USER',
    districtId: TIRAP,
    departmentId: TIRAP_PWD,
  });

  console.log('Identity seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
