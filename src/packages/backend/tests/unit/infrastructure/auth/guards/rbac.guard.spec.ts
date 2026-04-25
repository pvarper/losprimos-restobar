import { describe, expect, it } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from '../../../../../src/infrastructure/auth/guards/rbac.guard';
import { Public } from '../../../../../src/infrastructure/auth/decorators/public.decorator';
import { Roles } from '../../../../../src/infrastructure/auth/decorators/roles.decorator';

class RbacFixtureController {
  @Public()
  publicEndpoint(): void {
    return;
  }

  @Roles('admin', 'cajero')
  billingEndpoint(): void {
    return;
  }

  defaultProtectedEndpoint(): void {
    return;
  }
}

type UserContext = {
  roles: string[];
};

const createExecutionContext = (
  handler: () => void,
  user?: UserContext,
): ExecutionContext => {
  return {
    getClass: () => RbacFixtureController,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
};

describe('RbacGuard', () => {
  const reflector = new Reflector();
  const guard = new RbacGuard(reflector);
  const fixture = new RbacFixtureController();

  it('deny-by-default: should reject non public endpoint without explicit roles metadata', async () => {
    const context = createExecutionContext(fixture.defaultProtectedEndpoint);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access when endpoint is annotated with @Public()', async () => {
    const context = createExecutionContext(fixture.publicEndpoint);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('roles intersection: should reject when user has no required role', async () => {
    const context = createExecutionContext(fixture.billingEndpoint, {
      roles: ['mozo'],
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('roles intersection: should allow when user has at least one required role', async () => {
    const context = createExecutionContext(fixture.billingEndpoint, {
      roles: ['admin'],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('roles intersection: should allow when user satisfies all required roles', async () => {
    const context = createExecutionContext(fixture.billingEndpoint, {
      roles: ['admin', 'cajero', 'mozo'],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
