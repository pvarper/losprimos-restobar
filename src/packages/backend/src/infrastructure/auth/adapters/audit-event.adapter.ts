import { AuditEvent, AuditEventPort } from '../../../application/auth/ports/audit-event.port';

export class AuditEventAdapter implements AuditEventPort {
  async record(event: AuditEvent): Promise<void> {
    // Adapter inicial: placeholder para persistencia/transport de auditoría.
    void event;
  }
}
