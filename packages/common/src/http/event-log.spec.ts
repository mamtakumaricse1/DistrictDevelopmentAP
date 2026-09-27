import {
  actorFromRequest,
  entityIdFromPath,
  eventName,
  formatEventLog,
  isImportantRequest,
  shouldLogFailure,
  successStatus,
} from './event-log';

const PROJECT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

describe('event log', () => {
  it('treats writes, exports, and downloads as important', () => {
    expect(isImportantRequest('POST', '/api/v1/projects')).toBe(true);
    expect(isImportantRequest('PATCH', `/api/v1/projects/${PROJECT}`)).toBe(true);
    expect(isImportantRequest('PUT', '/api/v1/settings')).toBe(true);
    expect(isImportantRequest('GET', '/api/v1/reports/projects.csv')).toBe(true);
    expect(isImportantRequest('GET', '/api/v1/imports/templates/PWD')).toBe(true);
    expect(isImportantRequest('GET', `/api/v1/documents/${PROJECT}/file`)).toBe(true);
  });

  it('skips ordinary reads, health, and docs', () => {
    expect(isImportantRequest('GET', '/api/v1/projects')).toBe(false);
    expect(isImportantRequest('GET', '/api/v1/auth/me')).toBe(false);
    expect(isImportantRequest('GET', '/api/v1/health/ready')).toBe(false);
    expect(isImportantRequest('GET', '/docs')).toBe(false);
  });

  it('logs auth and server failures on any route', () => {
    expect(shouldLogFailure('GET', '/api/v1/projects', 401)).toBe(true);
    expect(shouldLogFailure('GET', '/api/v1/projects', 403)).toBe(true);
    expect(shouldLogFailure('GET', '/api/v1/health', 503)).toBe(true);
    expect(shouldLogFailure('GET', '/api/v1/projects', 404)).toBe(false);
    expect(shouldLogFailure('PATCH', `/api/v1/projects/${PROJECT}`, 404)).toBe(true);
  });

  it('names domain events without ids or query strings', () => {
    expect(eventName('POST', '/api/v1/projects')).toBe('projects.create');
    expect(eventName('PATCH', `/api/v1/projects/${PROJECT}?x=1`)).toBe('projects.update');
    expect(eventName('POST', `/api/v1/projects/${PROJECT}/documents`)).toBe('projects.documents.create');
    expect(eventName('POST', `/api/v1/schemes/${PROJECT}/kpis`)).toBe('schemes.kpis.create');
    expect(eventName('POST', `/api/v1/schemes/kpis/${PROJECT}/progress`)).toBe('schemes.kpis.progress.create');
    expect(eventName('POST', '/api/v1/imports/validate')).toBe('imports.validate');
    expect(eventName('POST', '/api/v1/imports/progress')).toBe('imports.progress.create');
    expect(eventName('POST', `/api/v1/notifications/${PROJECT}/read`)).toBe('notifications.read');
    expect(eventName('PUT', '/api/v1/settings')).toBe('settings.upsert');
    expect(eventName('PUT', '/api/v1/internal/issuers')).toBe('internal.issuers.upsert');
    expect(eventName('GET', '/api/v1/reports/projects.csv')).toBe('reports.projects.export');
    expect(eventName('GET', '/api/v1/imports/templates/department.csv')).toBe('imports.templates.department.export');
    expect(eventName('GET', '/api/v1/imports/templates/PWD')).toBe('imports.templates.pwd.export');
    expect(eventName('GET', `/api/v1/documents/${PROJECT}/file`)).toBe('documents.download');
  });

  it('keeps the last id and the signed-in actor', () => {
    expect(entityIdFromPath(`/api/v1/projects/${PROJECT}/documents`)).toBe(PROJECT);
    expect(
      actorFromRequest({
        originalUrl: '/api/v1/projects',
        auth: { userId: 'user-1' },
      }),
    ).toBe('user-1');
    expect(actorFromRequest({ originalUrl: '/api/v1/internal/issuers' })).toBe('internal');
    expect(actorFromRequest({ originalUrl: '/api/v1/projects' })).toBe('anonymous');
  });

  it('formats a single line and drops the query string', () => {
    expect(
      formatEventLog({
        event: 'projects.create',
        outcome: 'ok',
        status: 201,
        method: 'post',
        path: '/api/v1/projects?search=road',
        actor: 'user 1',
        requestId: 'req-1',
        durationMs: 12,
      }),
    ).toBe(
      'event=projects.create outcome=ok status=201 method=POST path=/api/v1/projects actor="user 1" requestId=req-1 durationMs=12',
    );
  });

  it('records Nest\'s default 201 for a successful POST', () => {
    expect(successStatus('POST', 200)).toBe(201);
    expect(successStatus('PATCH', 200)).toBe(200);
    expect(successStatus('POST', 204)).toBe(204);
  });
});
