import { User, UserManager } from 'oidc-client-ts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAccessTokenProvider } from '../services/api/client';
import { fetchLoginOptions, fetchMe, type MeResponse } from '../services/api/auth';
import { refreshStoredSession, signInWithPassword } from './passwordLogin';
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
  loginWithPassword: (username: string, password: string) => Promise<void>;
  completeCallback: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isDepartmentScoped: boolean;
  isCitizen: boolean;
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
      try {
        const current = await refreshStoredSession(issuer);
        return current?.access_token ?? token;
      } catch {
        return token;
      }
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
      void refreshStoredSession(issuer)
        .then((renewed) => {
          if (renewed) {
            void applyUser(renewed);
          }
        })
        .catch(() => undefined);
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

  const loginWithPassword = useCallback(
    async (username: string, password: string) => {
      setError(null);
      try {
        const options = await fetchLoginOptions();
        const { issuer, user } = await signInWithPassword(username.trim(), password, options);
        rememberIssuer(issuer);
        await applyUser(user);
      } catch (err) {
        clearRememberedIssuer();
        const known = err instanceof Error ? err.message : '';
        const message =
          known === 'The username or password is not correct.'
            ? known
            : 'Could not sign in. Check the username and password, then try again.';
        setError(message);
        throw new Error(message);
      }
    },
    [applyUser],
  );

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
      loginWithPassword,
      completeCallback,
      logout,
      hasPermission: (permission: string) => Boolean(profile?.permissions.includes(permission)),
      isDepartmentScoped: Boolean(profile && !profile.isSuperAdmin && profile.departmentIds.length > 0),
      isCitizen: Boolean(profile?.roles.some((role) => role.code === 'CITIZEN')),
    }),
    [status, accessToken, profile, error, login, loginWithPassword, completeCallback, logout],
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
