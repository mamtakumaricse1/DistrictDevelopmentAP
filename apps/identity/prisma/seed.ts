import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const CHANGLANG = '11111111-1111-1111-1111-111111111111';
const CHANGLANG_DEPTS: Record<string, string> = {
  PWD: '33333333-3333-3333-3333-333333333333',
  EDU: '33333333-3333-3333-3333-333333333334',
  HLT: '33333333-3333-3333-3333-333333333335',
  PHED: '33333333-3333-3333-3333-333333333336',
  RD: '33333333-3333-3333-3333-333333333337',
  RWD: '33333333-3333-3333-3333-333333333338',
  AGR: '33333333-3333-3333-3333-333333333339',
  SW: '33333333-3333-3333-3333-33333333333a',
  UD: '33333333-3333-3333-3333-33333333333b',
  FCS: '33333333-3333-3333-3333-33333333333c',
  TRN: '33333333-3333-3333-3333-33333333333d',
  PWR: '33333333-3333-3333-3333-33333333333e',
};

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
    'project:create',
    'project:read',
    'project:update',
    'progress:submit',
    'progress:read',
    'document:upload',
    'dashboard:read',
    'action:update',
    'report:export',
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
  ADC: [
    'district:read',
    'project:read',
    'progress:read',
    'dashboard:read',
    'meeting:manage',
    'action:manage',
    'action:update',
    'report:export',
    'notification:read',
  ],
  DIO: [
    'district:read',
    'user:manage',
    'department:manage',
    'agency:manage',
    'master:manage',
    'config:manage',
    'project:read',
    'progress:read',
    'dashboard:read',
    'report:export',
    'audit:read',
    'notification:read',
  ],
  BDO: [
    'district:read',
    'project:read',
    'progress:read',
    'progress:submit',
    'dashboard:read',
    'action:update',
    'notification:read',
  ],
  DATA_ENTRY: [
    'district:read',
    'project:read',
    'project:update',
    'progress:submit',
    'progress:read',
    'document:upload',
    'dashboard:read',
    'report:export',
    'notification:read',
  ],
  CITIZEN: [
    'district:read',
    'project:read',
    'progress:read',
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
    { code: 'DISTRICT_ADMIN', name: 'Deputy Commissioner (DC)', description: 'Full district access for the DC' },
    { code: 'DEPARTMENT_USER', name: 'Department HoD', description: 'Own department data only' },
    { code: 'VIEWER', name: 'Viewer', description: 'Read-only access' },
    { code: 'ADC', name: 'Additional Deputy Commissioner', description: 'Full monitoring and review, no user administration' },
    { code: 'DIO', name: 'District Informatics Officer', description: 'System administration and technical management for the district' },
    { code: 'BDO', name: 'Block Development Officer', description: 'Block-level monitoring and progress entry' },
    { code: 'DATA_ENTRY', name: 'Data Entry Operator', description: 'Department data entry only' },
    { code: 'CITIZEN', name: 'Citizen', description: 'Public read-only transparency view of the district' },
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

  await prisma.registeredIssuer.upsert({
    where: { issuer: issuerFor('changlang') },
    update: { realm: 'changlang', districtId: CHANGLANG, districtCode: 'CHANGLANG', isActive: true },
    create: {
      issuer: issuerFor('changlang'),
      realm: 'changlang',
      districtId: CHANGLANG,
      districtCode: 'CHANGLANG',
    },
  });
  await prisma.registeredIssuer.updateMany({
    where: { realm: 'tirap' },
    data: { isActive: false },
  });

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
    displayName: 'DC Changlang',
    roleCode: 'DISTRICT_ADMIN',
    districtId: CHANGLANG,
  });
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'adc.changlang@ddwmd.local',
    displayName: 'ADC Changlang',
    roleCode: 'ADC',
    districtId: CHANGLANG,
  });
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'dio.changlang@ddwmd.local',
    displayName: 'DIO Changlang',
    roleCode: 'DIO',
    districtId: CHANGLANG,
  });
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'bdo.changlang@ddwmd.local',
    displayName: 'BDO Changlang',
    roleCode: 'BDO',
    districtId: CHANGLANG,
  });
  const hods: Array<{ email: string; name: string; dept: string }> = [
    { email: 'pwd.changlang@ddwmd.local', name: 'Changlang PWD HoD', dept: 'PWD' },
    { email: 'rwd.changlang@ddwmd.local', name: 'Changlang RWD HoD', dept: 'RWD' },
    { email: 'phed.changlang@ddwmd.local', name: 'Changlang PHED HoD', dept: 'PHED' },
    { email: 'edu.changlang@ddwmd.local', name: 'Changlang Education HoD', dept: 'EDU' },
    { email: 'hlt.changlang@ddwmd.local', name: 'Changlang Health HoD', dept: 'HLT' },
    { email: 'rd.changlang@ddwmd.local', name: 'Changlang RD HoD', dept: 'RD' },
    { email: 'agr.changlang@ddwmd.local', name: 'Changlang Agriculture HoD', dept: 'AGR' },
    { email: 'sw.changlang@ddwmd.local', name: 'Changlang Social Welfare HoD', dept: 'SW' },
    { email: 'ud.changlang@ddwmd.local', name: 'Changlang UD HoD', dept: 'UD' },
    { email: 'fcs.changlang@ddwmd.local', name: 'Changlang FCS HoD', dept: 'FCS' },
    { email: 'trn.changlang@ddwmd.local', name: 'Changlang Transport HoD', dept: 'TRN' },
    { email: 'pwr.changlang@ddwmd.local', name: 'Changlang Power HoD', dept: 'PWR' },
  ];
  for (const hod of hods) {
    await upsertUser({
      issuer: issuerFor('changlang'),
      email: hod.email,
      displayName: hod.name,
      roleCode: 'DEPARTMENT_USER',
      districtId: CHANGLANG,
      departmentId: CHANGLANG_DEPTS[hod.dept],
    });
  }
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'data.pwd.changlang@ddwmd.local',
    displayName: 'PWD data entry — Changlang',
    roleCode: 'DATA_ENTRY',
    districtId: CHANGLANG,
    departmentId: CHANGLANG_DEPTS.PWD,
  });
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'viewer.changlang@ddwmd.local',
    displayName: 'Changlang Viewer',
    roleCode: 'VIEWER',
    districtId: CHANGLANG,
  });
  await upsertUser({
    issuer: issuerFor('changlang'),
    email: 'citizen.changlang@ddwmd.local',
    displayName: 'Citizen — Changlang',
    roleCode: 'CITIZEN',
    districtId: CHANGLANG,
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
