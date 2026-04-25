import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuditEventType } from '../../../application/auth/ports/audit-event.port';

export const AUTH_ERROR_STATUS = {
  unauthenticated: 401,
  forbidden: 403,
} as const;

export const AUTH_ERROR_CODE = {
  unauthenticated: 'AUTH_UNAUTHENTICATED',
  forbidden: 'AUTH_FORBIDDEN',
} as const;

export const AUTH_AUDIT_EVENT_TYPE = {
  unauthenticated: 'AUTHN_DENIED',
  forbidden: 'AUTHZ_DENIED',
} as const satisfies Record<'unauthenticated' | 'forbidden', AuditEventType>;

export type AuthErrorStatusCode =
  (typeof AUTH_ERROR_STATUS)[keyof typeof AUTH_ERROR_STATUS];

export type AuthCanonicalCode =
  (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];

export type AuthExceptionDescriptor = {
  statusCode: AuthErrorStatusCode;
  canonicalCode: AuthCanonicalCode;
  auditEventType: AuditEventType;
};

export const resolveAuthExceptionDescriptor = (
  exception: UnauthorizedException | ForbiddenException,
): AuthExceptionDescriptor => {
  if (exception instanceof UnauthorizedException) {
    return {
      statusCode: AUTH_ERROR_STATUS.unauthenticated,
      canonicalCode: AUTH_ERROR_CODE.unauthenticated,
      auditEventType: AUTH_AUDIT_EVENT_TYPE.unauthenticated,
    };
  }

  return {
    statusCode: AUTH_ERROR_STATUS.forbidden,
    canonicalCode: AUTH_ERROR_CODE.forbidden,
    auditEventType: AUTH_AUDIT_EVENT_TYPE.forbidden,
  };
};

export type AuthErrorResponsePayload = {
  statusCode: AuthErrorStatusCode;
  code: AuthCanonicalCode;
  message: string;
  path: string;
  timestamp: string;
};

export const buildAuthErrorResponsePayload = (
  statusCode: AuthErrorStatusCode,
  canonicalCode: AuthCanonicalCode,
  message: string,
  path: string,
): AuthErrorResponsePayload => {
  return {
    statusCode,
    code: canonicalCode,
    message,
    path,
    timestamp: new Date().toISOString(),
  };
};
