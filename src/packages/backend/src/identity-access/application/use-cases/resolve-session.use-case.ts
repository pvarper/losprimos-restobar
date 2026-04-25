import { InternalSession } from '../../domain/entities/internal-session.entity';
import { SessionRepositoryPort } from '../ports/session-repository.port';

export type ResolveSessionAction = 'create' | 'resolve' | 'revoke';

export interface ResolveSessionCommand {
  action: ResolveSessionAction;
  sessionId: string;
  userId: string;
  roleIds: string[];
  now: Date;
}

export class ResolveSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly ttlInMilliseconds: number,
  ) {}

  async execute(command: ResolveSessionCommand): Promise<InternalSession | null> {
    if (command.action === 'create') {
      const session = InternalSession.create({
        id: command.sessionId,
        userId: command.userId,
        roleIds: command.roleIds,
        createdAt: command.now,
        ttlInMilliseconds: this.ttlInMilliseconds,
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

      const revokedSession = session.revoke(command.now);
      await this.sessionRepository.save(revokedSession);

      return revokedSession;
    }

    if (session.isRevoked()) {
      return null;
    }

    if (session.isExpired(command.now)) {
      await this.sessionRepository.deleteById(command.sessionId);

      return null;
    }

    return session;
  }
}
