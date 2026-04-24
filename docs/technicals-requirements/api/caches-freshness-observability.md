# Caches, Freshness & Observability (Normativo)

> **Tipo de documento:** Normativo.  
> Este documento define reglas obligatorias para consumo API en MVP sobre frescura, cache, invalidación y observabilidad mínima.

---

## 1) Alcance normativo

Aplica a endpoints REST bajo `/api/v1/...` y a flujos en tiempo real que impacten estado operativo visible.

Referencias base:
- [`SPEC.md`](../../sdd/SPEC.md) — NFR-05, NFR-08, NFR-10, NFR-11, matriz de errores y escenarios.
- [`DESIGN.md`](../../sdd/DESIGN.md) — §7 (contratos API), §10 (tiempo real), §14 (observabilidad), §9 (códigos canónicos).

---

## 2) Política de frescura y cache (obligatoria)

1. **Datos operativos mutables (MVP core):** respuestas de operación de mesas/comandas/KDS/billing/stock/cierre **MUST** tratarse como no cacheables por defecto.
2. **Clientes de frontend:** estado operativo crítico **MUST** refrescarse por eventos en tiempo real y reconciliación por snapshot al reconectar.
3. **Intermediarios HTTP (proxy/CDN/gateway):** para endpoints operativos mutables **MUST NOT** servir respuesta stale.
4. **Solo lectura estable (si se habilita):** cualquier caché permitida **MUST** declarar explícitamente TTL y ownership de invalidación.
5. **Conflicto frescura vs latencia:** prevalece frescura/consistencia operativa sobre optimización de cache.

Rationale normativo: consistencia cliente↔backend y convergencia entre actores operativos.

---

## 3) Reglas de invalidación (obligatorias)

1. Todo evento que cambie estado operativo (`order.*`, `kds.*`, `payment.*`, `stock.*`, `table.status.changed`, `closure.*`) **MUST** disparar invalidación/reconciliación del estado derivado afectado.
2. Ante reconexión de canal realtime, el cliente **MUST** ejecutar snapshot + replay/ordenación por timestamp-versión backend.
3. Si hay colisión de concurrencia (`CONCURRENCY_CONFLICT`) o conflicto de estado/stock/cierre (`409/422` canónicos), el consumidor **MUST** descartar estado local obsoleto y reconciliar con estado backend.
4. Cualquier política de cache por endpoint **MUST** documentar trigger de invalidación y ventana máxima de staleness permitida.

Referencias:
- [`DESIGN.md`](../../sdd/DESIGN.md) §10 (reconciliación realtime), §9 (conflictos/códigos).
- [`SPEC.md`](../../sdd/SPEC.md) NFR-05, NFR-10 y escenarios de colisión/401/403/409/422.

---

## 4) Observabilidad mínima (obligatoria, MVP)

1. **Logging estructurado día 1**: operaciones críticas **MUST** registrar evento estructurado.
2. **Correlation ID end-to-end**: toda operación crítica **MUST** portar `correlation_id` en request/respuesta/logs/auditoría.
3. **Métricas mínimas**: el sistema **MUST** medir al menos p95 de latencia, throughput operativo y disponibilidad objetivo.
4. **Audit log transversal**: decisiones de authz/authn y mutaciones críticas **MUST** quedar auditadas con actor, acción, contexto y timestamp.
5. **Errores canónicos**: respuestas 401/403/409/422 **MUST** incluir code semántico canónico y trazabilidad correlacionable.

Referencias:
- [`DESIGN.md`](../../sdd/DESIGN.md) §14 (observabilidad), §11 (seguridad), §9 (códigos canónicos).
- [`SPEC.md`](../../sdd/SPEC.md) NFR-08, NFR-11, RF-AUTH-14, §2.1.1 mini-matriz de errores.

---

## 5) Cumplimiento

- Cualquier excepción a estas reglas **MUST** documentarse explícitamente y aprobarse antes de implementación.
- Si se modifica contrato de frescura/cache/observabilidad, se actualiza primero [`SPEC.md`](../../sdd/SPEC.md) y/o [`DESIGN.md`](../../sdd/DESIGN.md), y luego este documento.
