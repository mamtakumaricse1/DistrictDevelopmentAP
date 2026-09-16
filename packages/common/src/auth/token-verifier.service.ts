import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, decodeJwt, jwtVerify, JWTPayload } from 'jose';
import { IssuerRegistryService } from './issuer-registry.service';
import { VerifiedAccessToken } from './types/auth-context';

type JwksVerifier = ReturnType<typeof createRemoteJWKSet>;

@Injectable()
export class TokenVerifierService {
  private readonly jwksCache = new Map<string, JwksVerifier>();

  constructor(
    private readonly issuers: IssuerRegistryService,
    private readonly config: ConfigService,
  ) {}

  async verify(token: string): Promise<VerifiedAccessToken> {
    let decoded: JWTPayload;
    try {
      decoded = decodeJwt(token);
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }

    if (typeof decoded.iss !== 'string' || !decoded.iss) {
      throw new UnauthorizedException('Token issuer is missing.');
    }

    const resolved = await this.issuers.resolve(decoded.iss);
    if (!resolved) {
      throw new UnauthorizedException('Token issuer is not registered for this application.');
    }

    const jwks = this.jwksFor(resolved.issuer);
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: resolved.issuer,
        clockTolerance: 30,
      });
      if (!this.audienceOk(payload)) {
        throw new UnauthorizedException('Token audience is not accepted.');
      }
      if (typeof payload.sub !== 'string' || !payload.sub) {
        throw new UnauthorizedException('Token subject is missing.');
      }
      return {
        sub: payload.sub,
        iss: resolved.issuer,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        azp: typeof payload.azp === 'string' ? payload.azp : undefined,
        aud: payload.aud,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Access token could not be validated.');
    }
  }

  private jwksFor(issuer: string): JwksVerifier {
    const cached = this.jwksCache.get(issuer);
    if (cached) {
      return cached;
    }
    const jwks = createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`));
    this.jwksCache.set(issuer, jwks);
    return jwks;
  }

  private audienceOk(payload: JWTPayload): boolean {
    const apiAudience = this.config.get<string>('KEYCLOAK_API_AUDIENCE') ?? 'ddwmd-api';
    const webClient = this.config.get<string>('KEYCLOAK_WEB_CLIENT_ID') ?? 'ddwmd-web';
    const aud = payload.aud;
    const list = Array.isArray(aud) ? aud : aud ? [aud] : [];
    if (list.includes(apiAudience)) {
      return true;
    }
    return payload.azp === webClient;
  }
}
