import { User, UserManager } from 'oidc-client-ts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAccessTokenProvider } from '../services/api/client';
import { fetchMe, type MeResponse } from '../services/api/auth';
import {
  clearRememberedIssuer,
  createUserManager,
  rememberIssuer,
  rememberedIssuer,
} from './oidc';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  accessToken: string | null;
  profile: MeResponse | null;
  error: string | null;
  login: (issuer: string) => Promise<void>;
  completeCallback: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthReactContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyUser = useCallback(async (user: User | null) => {
    if (!user || user.expired || !user.access_token) {
      setAccessTokenProvider(() => null);
      setAccessToken(null);
      setProfile(null);
      setStatus('anonymous');
      return;
    }
    const token = user.access_token;
    setAccessTokenProvider(async () => {
      const issuer = rememberedIssuer();
      if (!issuer) {
        return token;
      }
      const manager = createUserManager(issuer);
      let current = await manager.getUser();
      if (!current?.access_token || current.expired) {
        try {
          current = await manager.signinSilent();
        } catch {
          return token;
        }
      }
      return current?.access_token ?? token;
    });
    setAccessToken(token);
    try {
      const me = await fetchMe();
      setProfile(me);
      setStatus('authenticated');
      setError(null);
    } catch (err) {
      setAccessTokenProvider(() => null);
      setAccessToken(null);
      setProfile(null);
      setStatus('anonymous');
      setError(err instanceof Error ? err.message : 'Could not load the application user.');
    }
  }, []);

  useEffect(() => {
    const issuer = rememberedIssuer();
    if (!issuer) {
      setStatus('anonymous');
      return;
    }
    const manager: UserManager = createUserManager(issuer);
    void manager.getUser().then((user) => applyUser(user));
    const onRenew = (user: User) => {
      void applyUser(user);
    };
    const onExpiring = () => {
      void manager.signinSilent().then((renewed) => {
        if (renewed) {
          void applyUser(renewed);
        }
      });
    };
    manager.events.addUserLoaded(onRenew);
    manager.events.addAccessTokenExpiring(onExpiring);
    return () => {
      manager.events.removeUserLoaded(onRenew);
      manager.events.removeAccessTokenExpiring(onExpiring);
    };
  }, [applyUser]);

  const login = useCallback(async (issuer: string) => {
    rememberIssuer(issuer);
    await createUserManager(issuer).signinRedirect();
  }, []);

  const completeCallback = useCallback(async () => {
    const issuer = rememberedIssuer();
    if (!issuer) {
      throw new Error('No district or system realm was selected for login.');
    }
    const user = await createUserManager(issuer).signinRedirectCallback();
    await applyUser(user);
  }, [applyUser]);

  const logout = useCallback(async () => {
    const issuer = rememberedIssuer();
    setAccessTokenProvider(() => null);
    setAccessToken(null);
    setProfile(null);
    setStatus('anonymous');
    if (issuer) {
      const manager = createUserManager(issuer);
      clearRememberedIssuer();
      await manager.signoutRedirect();
      return;
    }
    clearRememberedIssuer();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      accessToken,
      profile,
      error,
      login,
      completeCallback,
      logout,
      hasPermission: (permission: string) => Boolean(profile?.permissions.includes(permission)),
    }),
    [status, accessToken, profile, error, login, completeCallback, logout],
  );

  return <AuthReactContext.Provider value={value}>{children}</AuthReactContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthReactContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
