import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../../../../../src/infrastructure/auth/guards/api-key-auth.guard';
import {
  ActiveApiKeyPayload,
  InactiveApiKeyPayload,
  ValidateApiKeyPort,
} from '../../../../../src/application/auth/ports/validate-api-key.port';

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;
  let validateApiKeyPortMock: vi.Mocked<ValidateApiKeyPort>;

  beforeEach(() => {
    validateApiKeyPortMock = {
      validate: vi.fn(),
    };
    guard = new ApiKeyAuthGuard(validateApiKeyPortMock);
  });

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw UnauthorizedException when X-API-Key header is missing', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Missing API Key');
    expect(validateApiKeyPortMock.validate).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when API Key is invalid or inactive', async () => {
    const context = createMockContext({ 'x-api-key': 'invalid-key' });
    validateApiKeyPortMock.validate.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid API Key');
    expect(validateApiKeyPortMock.validate).toHaveBeenCalledWith('invalid-key');
  });

  it('should throw UnauthorizedException when X-API-Key header is blank', async () => {
    const context = createMockContext({ 'x-api-key': '   ' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(validateApiKeyPortMock.validate).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when X-API-Key header has multiple values', async () => {
    const context = createMockContext({
      'x-api-key': ['k1', 'k2'] as unknown as string,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(validateApiKeyPortMock.validate).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when API Key exists but is inactive', async () => {
    const context = createMockContext({ 'x-api-key': 'inactive-key' });
    const inactivePayload: InactiveApiKeyPayload = {
      clientId: 'internal-app',
      roles: ['admin'],
      status: 'inactive',
    };
    validateApiKeyPortMock.validate.mockResolvedValue(inactivePayload);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when Authorization header is used instead of X-API-Key', async () => {
    const context = createMockContext({ 'authorization': 'Bearer some-token' });
    
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should attach authenticated payload to request and return true when API Key is valid', async () => {
    const mockRequest = { headers: { 'x-api-key': 'valid-key' }, user: undefined };
    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const mockPayload: ActiveApiKeyPayload = {
      clientId: 'internal-app',
      roles: ['admin'],
      status: 'active',
    };
    validateApiKeyPortMock.validate.mockResolvedValue(mockPayload);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockRequest.user).toEqual({
      authMethod: 'api-key',
      clientId: 'internal-app',
      roles: ['admin'],
    });
  });
});
