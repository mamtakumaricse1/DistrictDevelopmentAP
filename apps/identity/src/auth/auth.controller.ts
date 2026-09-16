import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService, LoginOption, MeResponse } from './auth.service';
import { CurrentUser } from '@ddwmd/common';
import { Public } from '@ddwmd/common';
import { AuthContext } from '@ddwmd/common';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get('login-options')
  @ApiOperation({ summary: 'District and system Keycloak realms available for login' })
  @ApiOkResponse({ description: 'OIDC issuers for the login picker' })
  loginOptions(): Promise<LoginOption[]> {
    return this.auth.loginOptions();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mapped application user and authorization context' })
  me(@CurrentUser() user: AuthContext): MeResponse {
    return this.auth.me(user);
  }
}
