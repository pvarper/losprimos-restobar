import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditEventPort } from '../../../application/auth/ports/audit-event.port';

type HttpResponse = {
  status(code: number): HttpResponse;
  json(payload: AuthErrorPayload): void;
};

type HttpRequest = {
  url?: string;
};

type AuthErrorPayload = {
  statusCode: 401 | 403;
  code: 'AUTH_UNAUTHENTICATED' | 'AUTH_FORBIDDEN';
  message: string;
  path: string;
  timestamp: string;
};

@Catch(UnauthorizedException, ForbiddenException)
export class AuthExceptionFilter implements ExceptionFilter {
  constructor(private readonly auditEventPort: AuditEventPort) {}

  async catch(
    exception: UnauthorizedException | ForbiddenException,
    host: ArgumentsHost,
  ): Promise<void> {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequest>();
    const response = http.getResponse<HttpResponse>();
    const path = request.url ?? '';

    const isUnauthorized = exception instanceof UnauthorizedException;
    const statusCode = isUnauthorized ? 401 : 403;
    const canonicalCode = isUnauthorized ? 'AUTH_UNAUTHENTICATED' : 'AUTH_FORBIDDEN';
    const eventType = isUnauthorized ? 'AUTHN_DENIED' : 'AUTHZ_DENIED';
    const message = exception.message;

    await this.auditEventPort.record({
      type: eventType,
      statusCode,
      canonicalCode,
      path,
      reason: message,
    });

    response.status(statusCode).json({
      statusCode,
      code: canonicalCode,
      message,
      path,
      timestamp: new Date().toISOString(),
    });
  }
}
