export type AuditEventType = 'AUTHN_DENIED' | 'AUTHZ_DENIED';

export interface AuditEvent {
  type: AuditEventType;
  statusCode: 401 | 403;
  canonicalCode: 'AUTH_UNAUTHENTICATED' | 'AUTH_FORBIDDEN';
  path: string;
  reason: string;
  requiredRoles?: string[];
  actualRoles?: string[];
}

export interface AuditEventPort {
  record(event: AuditEvent): Promise<void>;
}
