import { User, type IdTokenClaims } from 'oidc-client-ts';
import { createUserManager, getWebClientId } from './oidc';

export type LoginTarget = {
  kind: string;
  realm: string;
  code: string;
  issuer: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  session_state?: string;
};

export function orderLoginOptions<T extends LoginTarget>(options: T[], username: string): T[] {
  const needle = username.trim().toLowerCase();
  const rank = (option: T) => {
    const realm = option.realm.toLowerCase();
    const code = option.code.toLowerCase();
    if (needle.includes(realm) || needle.includes(code)) {
      return 0;
    }
    return option.kind === 'district' ? 1 : 2;
  };
  return [...options].sort((left, right) => rank(left) - rank(right));
}

function decodeJwtPayload(token: string): IdTokenClaims {
  const part = token.split('.')[1] ?? '';
  const padded = part.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    Array.from(atob(padded), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
  );
  return JSON.parse(json) as IdTokenClaims;
}

async function requestToken(issuer: string, body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(`${issuer.replace(/\/$/, '')}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    throw new Error('rejected');
  }
  return (await response.json()) as TokenResponse;
}

function userFromTokens(tokens: TokenResponse, previous?: User): User {
  const profile = tokens.id_token ? decodeJwtPayload(tokens.id_token) : previous?.profile;
  if (!profile) {
    throw new Error('rejected');
  }
  return new User({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? previous?.refresh_token,
    id_token: tokens.id_token ?? previous?.id_token,
    token_type: tokens.token_type || 'Bearer',
    scope: tokens.scope ?? previous?.scope,
    session_state: tokens.session_state ?? previous?.session_state ?? null,
    profile,
    expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
  });
}

export async function signInWithPassword(username: string, password: string, options: LoginTarget[]): Promise<{ issuer: string; user: User }> {
  const ordered = orderLoginOptions(options, username);
  for (const option of ordered) {
    try {
      const tokens = await requestToken(
        option.issuer,
        new URLSearchParams({
          grant_type: 'password',
          client_id: getWebClientId(),
          username,
          password,
          scope: 'openid profile email',
        }),
      );
      const user = userFromTokens(tokens);
      await createUserManager(option.issuer).storeUser(user);
      return { issuer: option.issuer, user };
    } catch {
      // Try the next account store. The screen never names them.
    }
  }
  throw new Error('The username or password is not correct.');
}

export async function refreshStoredSession(issuer: string): Promise<User | null> {
  const manager = createUserManager(issuer);
  const current = await manager.getUser();
  if (!current?.access_token) {
    return null;
  }
  if (!current.expired) {
    return current;
  }
  if (!current.refresh_token) {
    return current;
  }
  const tokens = await requestToken(
    issuer,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: getWebClientId(),
      refresh_token: current.refresh_token,
    }),
  );
  const user = userFromTokens(tokens, current);
  await manager.storeUser(user);
  return user;
}
