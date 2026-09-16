import { createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UserDirectory } from './guards/jwt-auth.guard';
import type { AuthContext, VerifiedAccessToken } from './types/auth-context';
import { bearerGet } from '../http/internal-client';
import { TtlCache } from '../http/ttl-cache';

@Injectable()
export class RemoteUserDirectory implements UserDirectory {
  private readonly cache = new TtlCache<AuthContext>();

  constructor(private readonly config: ConfigService) {}

  async map(_token: VerifiedAccessToken, rawAccessToken: string): Promise<AuthContext> {
    const ttlMs = Number(this.config.get<string>('AUTH_CACHE_TTL_MS') ?? 15000);
    const cacheKey = createHash('sha256').update(rawAccessToken).digest('hex');
    const cached = ttlMs > 0 ? this.cache.get(cacheKey) : undefined;
    if (cached) {
      return cached;
    }

    const identityUrl = this.config.get<string>('IDENTITY_URL') ?? 'http://127.0.0.1:3001';
    try {
      const mapped = await bearerGet<AuthContext>(identityUrl, '/api/v1/auth/me', rawAccessToken);
      if (ttlMs > 0) {
        this.cache.set(cacheKey, mapped, ttlMs);
      }
      return mapped;
    } catch {
      throw new UnauthorizedException('Identity service could not map this access token.');
    }
  }
}
