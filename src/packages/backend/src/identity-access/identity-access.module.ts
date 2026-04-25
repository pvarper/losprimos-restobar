import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditEventPort } from '../application/auth/ports/audit-event.port';
import { ValidateApiKeyPort } from '../application/auth/ports/validate-api-key.port';
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
import { IdentityAccessController } from './infrastructure/controllers/identity-access.controller';
import { InternalSession } from './domain/entities/internal-session.entity';

const VALIDATE_API_KEY_PORT = 'VALIDATE_API_KEY_PORT';
const AUDIT_EVENT_PORT = 'AUDIT_EVENT_PORT';
const SESSION_REPOSITORY_PORT = 'SESSION_REPOSITORY_PORT';
const CLOCK_PORT = 'CLOCK_PORT';
const RESOLVE_SESSION_USE_CASE = 'RESOLVE_SESSION_USE_CASE';

@Module({
  controllers: [IdentityAccessController],
  providers: [
    {
      provide: VALIDATE_API_KEY_PORT,
      useClass: InMemoryApiKeyValidatorAdapter,
    },
    {
      provide: AUDIT_EVENT_PORT,
      useClass: AuditEventAdapter,
    },
    {
      provide: SESSION_REPOSITORY_PORT,
      useFactory: (): SessionRepositoryPort => {
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
      },
    },
    {
      provide: CLOCK_PORT,
      useClass: SystemClockAdapter,
    },
    {
      provide: RESOLVE_SESSION_USE_CASE,
      inject: [SESSION_REPOSITORY_PORT, CLOCK_PORT],
      useFactory: (
        sessionRepositoryPort: SessionRepositoryPort,
        clockPort: ClockPort,
      ): ResolveSessionUseCase => {
        return new ResolveSessionUseCase(sessionRepositoryPort, clockPort);
      },
    },
    {
      provide: ApiKeyAuthGuard,
      inject: [VALIDATE_API_KEY_PORT],
      useFactory: (validateApiKeyPort: ValidateApiKeyPort): ApiKeyAuthGuard => {
        return new ApiKeyAuthGuard(validateApiKeyPort);
      },
    },
    {
      provide: InternalSessionGuard,
      inject: [RESOLVE_SESSION_USE_CASE],
      useFactory: (resolveSessionUseCase: ResolveSessionUseCase): InternalSessionGuard => {
        return new InternalSessionGuard(resolveSessionUseCase);
      },
    },
    {
      provide: RbacGuard,
      inject: [Reflector],
      useFactory: (reflector: Reflector): RbacGuard => {
        return new RbacGuard(reflector);
      },
    },
    {
      provide: AuthExceptionFilter,
      inject: [AUDIT_EVENT_PORT],
      useFactory: (auditEventPort: AuditEventPort): AuthExceptionFilter => {
        return new AuthExceptionFilter(auditEventPort);
      },
    },
  ],
  exports: [ApiKeyAuthGuard, InternalSessionGuard, RbacGuard, AuthExceptionFilter],
})
export class IdentityAccessModule {}
