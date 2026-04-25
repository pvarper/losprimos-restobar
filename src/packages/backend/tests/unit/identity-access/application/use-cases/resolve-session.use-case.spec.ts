import { beforeEach, describe, expect, it } from 'vitest';
import { ResolveSessionUseCase } from '../../../../../src/identity-access/application/use-cases/resolve-session.use-case';
import { SessionRepositoryAdapter } from '../../../../../src/identity-access/infrastructure/adapters/session-repository.adapter';

describe('ResolveSessionUseCase', () => {
  let sessionRepository: SessionRepositoryAdapter;
  let useCase: ResolveSessionUseCase;

  beforeEach(() => {
    sessionRepository = new SessionRepositoryAdapter();
    useCase = new ResolveSessionUseCase(sessionRepository, 1_000);
  });

  it('should create an internal session when action is create', async () => {
    const now = new Date('2026-04-24T10:00:00.000Z');

    const session = await useCase.execute({
      action: 'create',
      sessionId: 'session-1',
      userId: 'user-1',
      roleIds: ['admin'],
      now,
    });

    expect(session).not.toBeNull();
    expect(session?.id).toBe('session-1');
    expect(session?.isRevoked()).toBe(false);
  });

  it('should return null when an existing session is expired', async () => {
    const now = new Date('2026-04-24T10:00:00.000Z');

    await useCase.execute({
      action: 'create',
      sessionId: 'session-expired',
      userId: 'user-1',
      roleIds: ['mozo'],
      now,
    });

    const expiredSession = await useCase.execute({
      action: 'resolve',
      sessionId: 'session-expired',
      userId: 'user-1',
      roleIds: ['mozo'],
      now: new Date('2026-04-24T10:00:01.100Z'),
    });

    expect(expiredSession).toBeNull();
  });

  it('should revoke an active session and then deny resolve', async () => {
    const now = new Date('2026-04-24T10:00:00.000Z');

    await useCase.execute({
      action: 'create',
      sessionId: 'session-revoked',
      userId: 'user-2',
      roleIds: ['cajero'],
      now,
    });

    const revokedSession = await useCase.execute({
      action: 'revoke',
      sessionId: 'session-revoked',
      userId: 'user-2',
      roleIds: ['cajero'],
      now: new Date('2026-04-24T10:00:00.200Z'),
    });

    const resolvedAfterRevoke = await useCase.execute({
      action: 'resolve',
      sessionId: 'session-revoked',
      userId: 'user-2',
      roleIds: ['cajero'],
      now: new Date('2026-04-24T10:00:00.300Z'),
    });

    expect(revokedSession).not.toBeNull();
    expect(revokedSession?.isRevoked()).toBe(true);
    expect(resolvedAfterRevoke).toBeNull();
  });
});
