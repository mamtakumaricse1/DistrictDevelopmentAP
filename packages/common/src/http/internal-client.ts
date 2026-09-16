export function parseServiceUrls(value: string | undefined, fallback: string): string[] {
  const source = value?.trim() ? value : fallback;
  return source
    .split(',')
    .map((part) => part.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function internalHttpTimeoutMs(): number {
  const parsed = Number(process.env.INTERNAL_HTTP_TIMEOUT_MS ?? 3000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.name === 'TimeoutError' || error.name === 'AbortError' || error.name === 'TypeError';
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(internalHttpTimeoutMs()),
  });
  if (!response.ok) {
    const error = new Error(`${init.method ?? 'GET'} ${url} failed (${response.status})`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

const roundRobin = new Map<string, number>();

function rotateOrigins(origins: string[]): string[] {
  if (origins.length <= 1) {
    return origins;
  }
  const key = origins.join(',');
  const n = roundRobin.get(key) ?? 0;
  roundRobin.set(key, n + 1);
  const start = n % origins.length;
  return [...origins.slice(start), ...origins.slice(0, start)];
}

async function withFailover<T>(
  baseUrl: string,
  path: string,
  retryOnServerError: boolean,
  send: (origin: string) => Promise<T>,
): Promise<T> {
  const origins = rotateOrigins(parseServiceUrls(baseUrl, baseUrl));
  let lastError: unknown;
  for (let attempt = 0; attempt < origins.length; attempt += 1) {
    const origin = origins[attempt];
    try {
      return await send(origin);
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number }).status;
      const retry = isRetryableError(error) || (retryOnServerError && typeof status === 'number' && isRetryableStatus(status));
      if (!retry || attempt === origins.length - 1) {
        throw error;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Internal request ${path} failed`);
}

export async function internalGet<T>(baseUrl: string, path: string, internalKey: string): Promise<T> {
  return withFailover(baseUrl, path, true, (origin) =>
    requestJson<T>(`${origin}${path}`, {
      headers: { Accept: 'application/json', 'x-internal-key': internalKey },
    }),
  );
}

export async function internalPut<T>(baseUrl: string, path: string, internalKey: string, body: unknown): Promise<T> {
  return withFailover(baseUrl, path, true, (origin) =>
    requestJson<T>(`${origin}${path}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-internal-key': internalKey,
      },
      body: JSON.stringify(body),
    }),
  );
}

export async function internalPost<T>(baseUrl: string, path: string, internalKey: string, body: unknown): Promise<T> {
  const origin = rotateOrigins(parseServiceUrls(baseUrl, baseUrl))[0];
  return requestJson<T>(`${origin}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-internal-key': internalKey,
    },
    body: JSON.stringify(body),
  });
}

export async function bearerGet<T>(baseUrl: string, path: string, accessToken: string): Promise<T> {
  return withFailover(baseUrl, path, true, (origin) =>
    requestJson<T>(`${origin}${path}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    }),
  );
}
