import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ValidateApiKeyPort,
} from '../../../application/auth/ports/validate-api-key.port';
import {
  ApiKeyAuthenticatedContext,
  toApiKeyAuthenticatedContext,
} from './api-key-auth-context.mapper';
import { PUBLIC_ROUTE_KEY } from '../decorators/public.decorator';
import { IDENTITY_ACCESS_TOKENS } from '../../../identity-access/identity-access.tokens';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_ACCESS_TOKENS.validateApiKeyPort)
    private readonly validateApiKeyPort: ValidateApiKeyPort,
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: ApiKeyAuthenticatedContext;
    }>();
    const apiKeyHeader = request.headers['x-api-key'];

    if (typeof apiKeyHeader !== 'string' || apiKeyHeader.trim().length === 0) {
      throw new UnauthorizedException('Missing API Key');
    }

    const apiKey = apiKeyHeader.trim();

    const payload = await this.validateApiKeyPort.validate(apiKey);

    if (!payload || payload.status !== 'active') {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Mapeo de contexto autenticado
    request.user = toApiKeyAuthenticatedContext(payload);

    return true;
  }
}
