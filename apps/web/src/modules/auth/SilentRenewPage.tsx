import { useEffect } from 'react';
import { createUserManager, rememberedIssuer } from '../../auth/oidc';

export function SilentRenewPage() {
  useEffect(() => {
    const issuer = rememberedIssuer();
    if (!issuer) {
      return;
    }
    void createUserManager(issuer).signinSilentCallback();
  }, []);
  return null;
}
