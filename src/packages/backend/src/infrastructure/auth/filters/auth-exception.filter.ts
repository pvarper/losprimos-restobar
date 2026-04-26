import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuditEvent,
  AuditEventPort,
} from '../../../application/auth/ports/audit-event.port';
import {
  AuthErrorResponsePayload,
  buildAuthErrorResponsePayload,
  resolveAuthExceptionDescriptor,
} from '../constants/auth-error.constants';
import { IDENTITY_ACCESS_TOKENS } from '../../../identity-access/identity-access.tokens';

type HttpResponse = {
  status?(code: number): HttpResponse;
  code?(code: number): HttpResponse;
  json(payload: AuthErrorResponsePayload): void;
  send?(payload: AuthErrorResponsePayload): void;
};

type HttpRequest = {
  url?: string;
};

type ForbiddenPayloadDetails = {
  message?: string;
  required?: string[];
  actual?: string[];
  requiredRoles?: string[];
  actualRoles?: string[];
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

@Catch(UnauthorizedException, ForbiddenException)
export class AuthExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(IDENTITY_ACCESS_TOKENS.auditEventPort)
    private readonly auditEventPort: AuditEventPort,
  ) {}

  async catch(
    exception: UnauthorizedException | ForbiddenException,
    host: ArgumentsHost,
  ): Promise<void> {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequest>();
    const response = http.getResponse<HttpResponse>();
    const path = request.url ?? '';
    const { statusCode, canonicalCode, auditEventType } =
      resolveAuthExceptionDescriptor(exception);
    let reason = exception.message;
    let requiredRoles: string[] | undefined;
    let actualRoles: string[] | undefined;

    if (exception instanceof ForbiddenException && exception.message.startsWith('{')) {
      try {
        const parsed = JSON.parse(exception.message) as ForbiddenPayloadDetails;
        reason = parsed.message ?? reason;
        requiredRoles = isStringArray(parsed.requiredRoles)
          ? parsed.requiredRoles
          : isStringArray(parsed.required)
            ? parsed.required
            : undefined;
        actualRoles = isStringArray(parsed.actualRoles)
          ? parsed.actualRoles
          : isStringArray(parsed.actual)
            ? parsed.actual
            : undefined;
      } catch (e) {
        // Fallback
      }
    }

    const auditPayload: AuditEvent = {
      type: auditEventType,
      statusCode,
      canonicalCode,
      path,
      reason,
    };

    if (requiredRoles !== undefined) {
      auditPayload.requiredRoles = requiredRoles;
    }
    
    if (actualRoles !== undefined) {
      auditPayload.actualRoles = actualRoles;
    }

    await this.auditEventPort.record(auditPayload);

    const payload = buildAuthErrorResponsePayload(statusCode, canonicalCode, reason, path);

    const withStatus = response.status?.(statusCode) ?? response.code?.(statusCode);

    if (withStatus?.json) {
      withStatus.json(payload);
      return;
    }

    response.send?.(payload);
  }
}
