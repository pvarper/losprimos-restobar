import { SessionRepositoryPort } from '../../application/ports/session-repository.port';
import { InternalSession } from '../../domain/entities/internal-session.entity';

export class SessionRepositoryAdapter implements SessionRepositoryPort {
  private readonly sessions = new Map<string, InternalSession>();

  async save(session: InternalSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async findById(sessionId: string): Promise<InternalSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async deleteById(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
