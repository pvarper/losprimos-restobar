import {
  ArgumentsHost,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditEventPort } from '../../../../../src/application/auth/ports/audit-event.port';
import { AuthExceptionFilter } from '../../../../../src/infrastructure/auth/filters/auth-exception.filter';

type JsonPayload = {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
};

type MockHttpResponse = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const buildArgumentsHost = (
  response: MockHttpResponse,
  requestPath: string,
): ArgumentsHost => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url: requestPath }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
};

describe('AuthExceptionFilter', () => {
  let auditEventPortMock: vi.Mocked<AuditEventPort>;
  let filter: AuthExceptionFilter;
  let response: MockHttpResponse;

  beforeEach(() => {
    auditEventPortMock = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    response = {
      status: vi.fn(),
      json: vi.fn(),
    };
    response.status.mockReturnValue(response);

    filter = new AuthExceptionFilter(auditEventPortMock);
  });

  it('should map UnauthorizedException to 401 canonical payload and audit authn denial', async () => {
    const exception = new UnauthorizedException('Missing API Key');
    const host = buildArgumentsHost(response, '/api/v1/orders');

    await filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 401,
      code: 'AUTH_UNAUTHENTICATED',
      message: 'Missing API Key',
      path: '/api/v1/orders',
      timestamp: expect.any(String),
    } satisfies JsonPayload);
    expect(auditEventPortMock.record).toHaveBeenCalledWith({
      type: 'AUTHN_DENIED',
      statusCode: 401,
      canonicalCode: 'AUTH_UNAUTHENTICATED',
      path: '/api/v1/orders',
      reason: 'Missing API Key',
    });
  });

  it('should map ForbiddenException to 403 canonical payload and audit authz denial', async () => {
    const exception = new ForbiddenException('Insufficient role permissions');
    const host = buildArgumentsHost(response, '/api/v1/billing');

    await filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 403,
      code: 'AUTH_FORBIDDEN',
      message: 'Insufficient role permissions',
      path: '/api/v1/billing',
      timestamp: expect.any(String),
    } satisfies JsonPayload);
    expect(auditEventPortMock.record).toHaveBeenCalledWith({
      type: 'AUTHZ_DENIED',
      statusCode: 403,
      canonicalCode: 'AUTH_FORBIDDEN',
      path: '/api/v1/billing',
      reason: 'Insufficient role permissions',
    });
  });
});
