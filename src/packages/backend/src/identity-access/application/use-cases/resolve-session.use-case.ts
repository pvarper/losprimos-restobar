import { InternalSession } from '../../domain/entities/internal-session.entity';
import { ClockPort } from '../ports/clock.port';
import { SessionRepositoryPort } from '../ports/session-repository.port';

export interface CreateSessionCommand {
  action: 'create';
  sessionId: string;
  userId: string;
  roleIds: string[];
}

export interface ResolveExistingSessionCommand {
  action: 'resolve';
  sessionId: string;
}

export interface RevokeSessionCommand {
  action: 'revoke';
  sessionId: string;
}

export type ResolveSessionCommand =
  | CreateSessionCommand
  | ResolveExistingSessionCommand
  | RevokeSessionCommand;

export const DEFAULT_SESSION_TTL_IN_MILLISECONDS = 1_000 * 60 * 30;

export class ResolveSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly clock: ClockPort,
    private readonly sessionTtlInMilliseconds: number = DEFAULT_SESSION_TTL_IN_MILLISECONDS,
  ) {}

  async execute(command: ResolveSessionCommand): Promise<InternalSession | null> {
    const now = this.clock.now();

    if (command.action === 'create') {
      const session = InternalSession.create({
        id: command.sessionId,
        userId: command.userId,
        roleIds: command.roleIds,
        createdAt: now,
        ttlInMilliseconds: this.sessionTtlInMilliseconds,
      });
      await this.sessionRepository.save(session);

      return session;
    }

    const session = await this.sessionRepository.findById(command.sessionId);

    if (!session) {
      return null;
    }

    if (command.action === 'revoke') {
      if (session.isRevoked()) {
        return session;
      }

      const revokedSession = session.revoke(now);
      await this.sessionRepository.save(revokedSession);

      return revokedSession;
    }

    if (session.isRevoked()) {
      return null;
    }

    if (session.isExpired(now)) {
      await this.sessionRepository.deleteById(command.sessionId);

      return null;
    }

    return session;
  }
}
