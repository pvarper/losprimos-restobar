import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditEventPort } from '../../../application/auth/ports/audit-event.port';
import {
  AuthErrorResponsePayload,
  buildAuthErrorResponsePayload,
  resolveAuthExceptionDescriptor,
} from '../constants/auth-error.constants';

type HttpResponse = {
  status?(code: number): HttpResponse;
  code?(code: number): HttpResponse;
  json(payload: AuthErrorResponsePayload): void;
  send?(payload: AuthErrorResponsePayload): void;
};

type HttpRequest = {
  url?: string;
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
    const { statusCode, canonicalCode, auditEventType } =
      resolveAuthExceptionDescriptor(exception);
    const message = exception.message;

    await this.auditEventPort.record({
      type: auditEventType,
      statusCode,
      canonicalCode,
      path,
      reason: message,
    });

    const payload = buildAuthErrorResponsePayload(statusCode, canonicalCode, message, path);

    const withStatus = response.status?.(statusCode) ?? response.code?.(statusCode);

    if (withStatus?.json) {
      withStatus.json(payload);
      return;
    }

    response.send?.(payload);
  }
}
