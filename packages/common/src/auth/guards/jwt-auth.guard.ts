import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { USER_DIRECTORY } from '../tokens';
import { TokenVerifierService } from '../token-verifier.service';
import type { AuthContext, VerifiedAccessToken } from '../types/auth-context';

export type UserDirectory = {
  map(token: VerifiedAccessToken, rawAccessToken: string): Promise<AuthContext>;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenVerifierService,
    @Inject(USER_DIRECTORY) private readonly users: UserDirectory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token.');
    }
    const token = header.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    const verified = await this.tokens.verify(token);
    request.auth = await this.users.map(verified, token);
    return true;
  }
}
