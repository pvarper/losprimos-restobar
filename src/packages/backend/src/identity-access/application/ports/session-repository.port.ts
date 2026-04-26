import { InternalSession } from '../../domain/entities/internal-session.entity';

export interface SessionRepositoryPort {
  save(session: InternalSession): Promise<void>;
  findById(sessionId: string): Promise<InternalSession | null>;
  deleteById(sessionId: string): Promise<void>;
}
