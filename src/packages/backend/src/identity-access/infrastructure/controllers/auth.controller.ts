import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator';
import { Public } from '../../../infrastructure/auth/decorators/public.decorator';
import { ApiKeyAuthenticatedContext } from '../../../infrastructure/auth/guards/api-key-auth-context.mapper';

type AuthenticatedRequest = {
  user: ApiKeyAuthenticatedContext;
};

type AuthMeResponse = {
  principalId: string;
  roles: string[];
  authMethod: 'api-key';
};

@Controller('auth')
export class AuthController {
  @Public()
  @Get('health')
  health(): { ok: true } {
    return { ok: true };
  }

  @Roles('admin', 'cajero')
  @Get('me')
  me(@Req() request: AuthenticatedRequest): AuthMeResponse {
    const { user } = request;

    return {
      principalId: user.clientId,
      roles: user.roles,
      authMethod: user.authMethod,
    };
  }
}
