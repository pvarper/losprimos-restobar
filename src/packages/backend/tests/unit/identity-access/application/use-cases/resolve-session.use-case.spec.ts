import { beforeEach, describe, expect, it } from 'vitest';
import { ResolveSessionUseCase } from '../../../../../src/identity-access/application/use-cases/resolve-session.use-case';
import { ClockPort } from '../../../../../src/identity-access/application/ports/clock.port';
import { SessionRepositoryAdapter } from '../../../../../src/identity-access/infrastructure/adapters/session-repository.adapter';

class FixedClock implements ClockPort {
  private currentDate: Date;

  constructor(initialDate: Date) {
    this.currentDate = initialDate;
  }

  now(): Date {
    return this.currentDate;
  }

  set(date: Date): void {
    this.currentDate = date;
  }
}

describe('ResolveSessionUseCase', () => {
  let sessionRepository: SessionRepositoryAdapter;
  let clock: FixedClock;
  let useCase: ResolveSessionUseCase;

  beforeEach(() => {
    sessionRepository = new SessionRepositoryAdapter();
    clock = new FixedClock(new Date('2026-04-24T10:00:00.000Z'));
    useCase = new ResolveSessionUseCase(sessionRepository, clock, 1_000);
  });

  it('should create an internal session when action is create', async () => {
    const session = await useCase.execute({
      action: 'create',
      sessionId: 'session-1',
      userId: 'user-1',
      roleIds: ['admin'],
    });

    expect(session).not.toBeNull();
    expect(session?.id).toBe('session-1');
    expect(session?.isRevoked()).toBe(false);
  });

  it('should return null when an existing session is expired', async () => {
    await useCase.execute({
      action: 'create',
      sessionId: 'session-expired',
      userId: 'user-1',
      roleIds: ['mozo'],
    });

    clock.set(new Date('2026-04-24T10:00:01.100Z'));

    const expiredSession = await useCase.execute({
      action: 'resolve',
      sessionId: 'session-expired',
    });

    expect(expiredSession).toBeNull();
  });

  it('should revoke an active session and then deny resolve', async () => {
    await useCase.execute({
      action: 'create',
      sessionId: 'session-revoked',
      userId: 'user-2',
      roleIds: ['cajero'],
    });

    clock.set(new Date('2026-04-24T10:00:00.200Z'));

    const revokedSession = await useCase.execute({
      action: 'revoke',
      sessionId: 'session-revoked',
    });

    clock.set(new Date('2026-04-24T10:00:00.300Z'));

    const resolvedAfterRevoke = await useCase.execute({
      action: 'resolve',
      sessionId: 'session-revoked',
    });

    expect(revokedSession).not.toBeNull();
    expect(revokedSession?.isRevoked()).toBe(true);
    expect(resolvedAfterRevoke).toBeNull();
  });
});
