import { UUID_LIKE_PATTERN } from './uuid-like';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const TAIL_VERBS: Record<string, string> = {
  read: 'read',
  validate: 'validate',
  file: 'download',
};

export type EventOutcome = 'ok' | 'error';

export type EventLogFields = {
  event: string;
  outcome: EventOutcome;
  status: number;
  method: string;
  path: string;
  actor: string;
  requestId?: string;
  entityId?: string;
  durationMs?: number;
};

type RequestLike = {
  method?: string;
  originalUrl?: string;
  url?: string;
  path?: string;
  auth?: { userId?: string };
  requestId?: string;
};

/** State changes, exports, and file downloads. Health and docs are omitted. */
export function isImportantRequest(method: string, path: string): boolean {
  const pathname = pathnameOf(path);
  if (!pathname || pathname.includes('/health') || pathname.includes('/docs')) {
    return false;
  }
  if (MUTATING.has(method.toUpperCase())) {
    return true;
  }
  return pathname.endsWith('.csv') || pathname.includes('/templates/') || /\/documents\/[^/]+\/file$/.test(pathname);
}

/** Auth failures and server errors always. Other failures only on important routes. */
export function shouldLogFailure(method: string, path: string, status: number): boolean {
  if (status === 401 || status === 403 || status >= 500) {
    return true;
  }
  return isImportantRequest(method, path);
}

export function eventName(method: string, path: string): string {
  const pathname = pathnameOf(path).replace(/^\/api\/v1\/?/, '').replace(/^\//, '');
  const parts: string[] = [];
  for (const segment of pathname.split('/').filter(Boolean)) {
    if (UUID_LIKE_PATTERN.test(segment)) {
      continue;
    }
    if (segment.toLowerCase().endsWith('.csv')) {
      parts.push(segment.slice(0, -4).toLowerCase(), 'export');
      continue;
    }
    parts.push(segment.toLowerCase());
  }
  if (parts.length === 0) {
    parts.push('request');
  }
  const tail = parts[parts.length - 1];
  if (tail === 'export') {
    return parts.join('.');
  }
  const mapped = TAIL_VERBS[tail];
  if (mapped) {
    parts[parts.length - 1] = mapped;
    return parts.join('.');
  }
  if (method.toUpperCase() === 'GET' && parts.includes('templates')) {
    parts.push('export');
    return parts.join('.');
  }
  parts.push(verbFor(method));
  return parts.join('.');
}

export function entityIdFromPath(path: string): string | undefined {
  const segments = pathnameOf(path).split('/').filter(Boolean);
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    if (UUID_LIKE_PATTERN.test(segments[index])) {
      return segments[index];
    }
  }
  return undefined;
}

export function requestPath(request: RequestLike): string {
  return pathnameOf(request.originalUrl ?? request.url ?? request.path ?? '');
}

export function actorFromRequest(request: RequestLike): string {
  if (request.auth?.userId) {
    return request.auth.userId;
  }
  if (requestPath(request).includes('/internal/')) {
    return 'internal';
  }
  return 'anonymous';
}

/** Nest assigns 201 to a successful POST after the interceptor runs. */
export function successStatus(method: string, statusCode: number): number {
  if (statusCode >= 200 && statusCode !== 200) {
    return statusCode;
  }
  return method.toUpperCase() === 'POST' ? 201 : statusCode || 200;
}

export function formatEventLog(fields: EventLogFields): string {
  const parts = [
    pair('event', fields.event),
    pair('outcome', fields.outcome),
    pair('status', String(fields.status)),
    pair('method', fields.method.toUpperCase()),
    pair('path', pathnameOf(fields.path)),
    pair('actor', fields.actor),
    fields.entityId ? pair('entityId', fields.entityId) : '',
    fields.requestId ? pair('requestId', fields.requestId) : '',
    fields.durationMs !== undefined ? pair('durationMs', String(fields.durationMs)) : '',
  ];
  return parts.filter(Boolean).join(' ');
}

function verbFor(method: string): string {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'PUT':
      return 'upsert';
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

function pathnameOf(path: string): string {
  return path.split('?')[0] ?? '';
}

function pair(key: string, value: string): string {
  const text = value.replace(/[\r\n]/g, ' ');
  if (/[\s"]/.test(text)) {
    return `${key}="${text.replace(/"/g, '\\"')}"`;
  }
  return `${key}=${text}`;
}
