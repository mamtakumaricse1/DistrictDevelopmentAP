import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthContext } from '../types/auth-context';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.auth) {
      throw new UnauthorizedException('Not authenticated.');
    }
    return request.auth;
  },
);
