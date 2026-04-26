export const AUTH_HTTP_STATUS = {
  unauthenticated: 401,
  forbidden: 403,
} as const;

export const AUTH_CANONICAL_ERROR_CODE = {
  unauthenticated: 'AUTH_UNAUTHENTICATED',
  forbidden: 'AUTH_FORBIDDEN',
} as const;

export type AuthHttpStatus =
  (typeof AUTH_HTTP_STATUS)[keyof typeof AUTH_HTTP_STATUS];

export type AuthCanonicalErrorCode =
  (typeof AUTH_CANONICAL_ERROR_CODE)[keyof typeof AUTH_CANONICAL_ERROR_CODE];

export type AuthCanonicalErrorKind = keyof typeof AUTH_CANONICAL_ERROR_CODE;

const AUTH_CANONICAL_CODE_SET: ReadonlySet<AuthCanonicalErrorCode> = new Set(
  Object.values(AUTH_CANONICAL_ERROR_CODE),
);

const isRecordValue = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isAuthCanonicalErrorCode = (
  value: unknown,
): value is AuthCanonicalErrorCode => {
  return typeof value === 'string' && AUTH_CANONICAL_CODE_SET.has(value as AuthCanonicalErrorCode);
};

const resolveAuthErrorByStatus = (status: number): AuthCanonicalErrorKind | null => {
  if (status === AUTH_HTTP_STATUS.unauthenticated) {
    return 'unauthenticated';
  }

  if (status === AUTH_HTTP_STATUS.forbidden) {
    return 'forbidden';
  }

  return null;
};

const resolveAuthErrorByCode = (payload: unknown): AuthCanonicalErrorKind | null => {
  if (!isRecordValue(payload)) {
    return null;
  }

  const payloadCode = payload['code'];

  if (!isAuthCanonicalErrorCode(payloadCode)) {
    return null;
  }

  if (payloadCode === AUTH_CANONICAL_ERROR_CODE.unauthenticated) {
    return 'unauthenticated';
  }

  if (payloadCode === AUTH_CANONICAL_ERROR_CODE.forbidden) {
    return 'forbidden';
  }

  return null;
};

export const resolveAuthCanonicalErrorKind = (
  status: number,
  payload: unknown,
): AuthCanonicalErrorKind | null => {
  return resolveAuthErrorByStatus(status) ?? resolveAuthErrorByCode(payload);
};
