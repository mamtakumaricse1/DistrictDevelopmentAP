import type { AuthContext } from '../auth/types/auth-context';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    auth?: AuthContext;
  }
}

export {};
