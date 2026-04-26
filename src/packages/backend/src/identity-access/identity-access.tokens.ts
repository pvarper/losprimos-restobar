export const IDENTITY_ACCESS_TOKENS = {
  validateApiKeyPort: Symbol('IDENTITY_ACCESS_VALIDATE_API_KEY_PORT'),
  auditEventPort: Symbol('IDENTITY_ACCESS_AUDIT_EVENT_PORT'),
  sessionRepositoryPort: Symbol('IDENTITY_ACCESS_SESSION_REPOSITORY_PORT'),
  clockPort: Symbol('IDENTITY_ACCESS_CLOCK_PORT'),
  resolveSessionUseCase: Symbol('IDENTITY_ACCESS_RESOLVE_SESSION_USE_CASE'),
} as const;
