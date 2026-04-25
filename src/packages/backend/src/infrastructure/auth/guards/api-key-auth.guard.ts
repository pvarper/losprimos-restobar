import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  ValidateApiKeyPort,
} from '../../../application/auth/ports/validate-api-key.port';
import {
  ApiKeyAuthenticatedContext,
  toApiKeyAuthenticatedContext,
} from './api-key-auth-context.mapper';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly validateApiKeyPort: ValidateApiKeyPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
