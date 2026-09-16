import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('INTERNAL_API_KEY') ?? 'dev-internal-key';
    const provided = context.switchToHttp().getRequest<{ header: (name: string) => string | undefined }>().header(
      'x-internal-key',
    );
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Internal service key is missing or invalid.');
    }
    return true;
  }
}
