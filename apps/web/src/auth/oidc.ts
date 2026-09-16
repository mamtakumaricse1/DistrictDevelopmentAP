import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

export const ISSUER_STORAGE_KEY = 'ddwmd.oidc.issuer';

const managers = new Map<string, UserManager>();

export function getWebClientId(): string {
  return import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ddwmd-web';
}

export function createUserManager(issuer: string): UserManager {
  const existing = managers.get(issuer);
  if (existing) {
    return existing;
  }
  const origin = window.location.origin;
  const manager = new UserManager({
    authority: issuer,
    client_id: getWebClientId(),
    redirect_uri: `${origin}/auth/callback`,
    silent_redirect_uri: `${origin}/auth/silent-renew`,
    post_logout_redirect_uri: `${origin}/login`,
    response_type: 'code',
    scope: 'openid profile email',
    automaticSilentRenew: true,
    includeIdTokenInSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  });
  managers.set(issuer, manager);
  return manager;
}

export function rememberIssuer(issuer: string): void {
  sessionStorage.setItem(ISSUER_STORAGE_KEY, issuer);
}

export function rememberedIssuer(): string | null {
  return sessionStorage.getItem(ISSUER_STORAGE_KEY);
}

export function clearRememberedIssuer(): void {
  sessionStorage.removeItem(ISSUER_STORAGE_KEY);
}
