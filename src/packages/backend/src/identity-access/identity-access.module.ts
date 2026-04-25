import { Module, Provider } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResolveSessionUseCase } from './application/use-cases/resolve-session.use-case';
import { AuditEventAdapter } from '../infrastructure/auth/adapters/audit-event.adapter';
import { AuthExceptionFilter } from '../infrastructure/auth/filters/auth-exception.filter';
import { ApiKeyAuthGuard } from '../infrastructure/auth/guards/api-key-auth.guard';
import { InternalSessionGuard } from '../infrastructure/auth/guards/internal-session.guard';
import { RbacGuard } from '../infrastructure/auth/guards/rbac.guard';
import { SessionRepositoryPort } from './application/ports/session-repository.port';
import { ClockPort } from './application/ports/clock.port';
import { InMemoryApiKeyValidatorAdapter } from './infrastructure/adapters/in-memory-api-key-validator.adapter';
import { SessionRepositoryAdapter } from './infrastructure/adapters/session-repository.adapter';
import { SystemClockAdapter } from './infrastructure/adapters/system-clock.adapter';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { IdentityAccessController } from './infrastructure/controllers/identity-access.controller';
import { InternalSession } from './domain/entities/internal-session.entity';
import { IDENTITY_ACCESS_TOKENS } from './identity-access.tokens';

const createSeededSessionRepository = (): SessionRepositoryPort => {
  const repository = new SessionRepositoryAdapter();
  const now = new Date();

  void repository.save(
    InternalSession.rehydrate({
      id: 'session-vigente',
      userId: 'user-admin-cajero',
      roleIds: ['admin', 'cajero'],
      createdAt: new Date(now.getTime() - 1000),
      expiresAt: new Date(now.getTime() + 1000 * 60),
      revokedAt: null,
    }),
  );

  void repository.save(
    InternalSession.rehydrate({
      id: 'session-expirada',
      userId: 'user-admin-cajero',
      roleIds: ['admin', 'cajero'],
      createdAt: new Date(now.getTime() - 1000 * 60),
      expiresAt: new Date(now.getTime() - 1000),
      revokedAt: null,
    }),
  );

  void repository.save(
    InternalSession.rehydrate({
      id: 'session-revocada',
      userId: 'user-admin-cajero',
      roleIds: ['admin', 'cajero'],
      createdAt: new Date(now.getTime() - 1000 * 60),
      expiresAt: new Date(now.getTime() + 1000 * 60),
      revokedAt: new Date(now.getTime() - 1000),
    }),
  );

  return repository;
};

const identityAccessProviders: Provider[] = [
  {
    provide: IDENTITY_ACCESS_TOKENS.validateApiKeyPort,
    useClass: InMemoryApiKeyValidatorAdapter,
  },
  {
    provide: IDENTITY_ACCESS_TOKENS.auditEventPort,
    useClass: AuditEventAdapter,
  },
  {
    provide: IDENTITY_ACCESS_TOKENS.sessionRepositoryPort,
    useFactory: createSeededSessionRepository,
  },
  {
    provide: IDENTITY_ACCESS_TOKENS.clockPort,
    useClass: SystemClockAdapter,
  },
  {
    provide: IDENTITY_ACCESS_TOKENS.resolveSessionUseCase,
    inject: [IDENTITY_ACCESS_TOKENS.sessionRepositoryPort, IDENTITY_ACCESS_TOKENS.clockPort],
    useFactory: (
      sessionRepositoryPort: SessionRepositoryPort,
      clockPort: ClockPort,
    ): ResolveSessionUseCase => {
      return new ResolveSessionUseCase(sessionRepositoryPort, clockPort);
    },
  },
  ApiKeyAuthGuard,
  InternalSessionGuard,
  {
    provide: RbacGuard,
    inject: [Reflector],
    useFactory: (reflector: Reflector): RbacGuard => {
      return new RbacGuard(reflector);
    },
  },
  AuthExceptionFilter,
];

@Module({
  controllers: [IdentityAccessController, AuthController],
  providers: identityAccessProviders,
  exports: [ApiKeyAuthGuard, InternalSessionGuard, RbacGuard, AuthExceptionFilter],
})
export class IdentityAccessModule {}
