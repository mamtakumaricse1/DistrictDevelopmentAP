const DEFAULT_BASE = '/api/v1';

type TokenProvider = () => string | null | Promise<string | null>;

let tokenProvider: TokenProvider = () => null;

export function setAccessTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown[];

  constructor(message: string, status: number, code: string, details: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  anonymous?: boolean;
};

async function resolveAccessToken(): Promise<string | null> {
  return tokenProvider();
}

async function parseError(response: Response): Promise<ApiError> {
  let code = 'REQUEST_ERROR';
  let message = `Request failed (${response.status})`;
  let details: unknown[] = [];
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string; details?: unknown[] } };
    code = body.error?.code ?? code;
    message = body.error?.message ?? message;
    details = body.error?.details ?? [];
  } catch {
    // keep defaults
  }
  return new ApiError(message, response.status, code, details);
}

async function request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = await resolveAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (!options?.anonymous) {
    throw new ApiError('Missing access token.', 401, 'UNAUTHORIZED');
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>('GET', path, undefined, options);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>('PATCH', path, body);
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = await resolveAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    throw new ApiError('Missing access token.', 401, 'UNAUTHORIZED');
  }
  const response = await fetch(`${getApiBaseUrl()}${path}`, { method: 'POST', headers, body: form });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as T;
}

export async function apiDownload(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = await resolveAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    throw new ApiError('Missing access token.', 401, 'UNAUTHORIZED');
  }
  const response = await fetch(`${getApiBaseUrl()}${path}`, { headers });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.blob();
}
