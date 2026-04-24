# API Logging Strategy (Normativo)

> **Tipo de documento:** Normativo.  
> Define la estrategia mínima obligatoria de logging para API en MVP.

---

## 1) Alcance

Aplica a todos los endpoints REST bajo `/api/v1/...` y a eventos operativos críticos vinculados a flujos de auth, mesas/comandas, KDS, billing, stock y cierres.

Fuentes normativas:
- [`SPEC.md`](../../sdd/SPEC.md) — NFR-08 (logging estructurado), NFR-11 (auditabilidad), RF-AUTH-14.
- [`DESIGN.md`](../../sdd/DESIGN.md) — §14 observabilidad, §11 seguridad, §9 códigos canónicos.
- [`../api/traceability-rules.md`](../api/traceability-rules.md)
- [`../api/caches-freshness-observability.md`](../api/caches-freshness-observability.md)

---

## 2) Reglas obligatorias de logging

1. El logging de API **MUST** ser estructurado (JSON o equivalente parseable).
2. Toda operación crítica **MUST** incluir `correlation_id` para trazabilidad extremo a extremo.
3. Todo evento de seguridad (authn/authz) **MUST** registrar resultado (allow/deny) y code canónico cuando aplique.
4. Toda mutación operativa crítica **MUST** registrar actor, acción, entidad, contexto y timestamp.
5. Errores de contrato (`401/403/409/422`) **MUST** registrarse con HTTP status + `code` semántico canónico.

---

## 3) Campos mínimos obligatorios

Cada log de operación crítica debe contener, como mínimo:

- `timestamp`
- `level`
- `service` / `module`
- `correlation_id`
- `actor_user_id` (cuando exista)
- `action`
- `entity`
- `result` (success|deny|error)
- `http_status` (si aplica)
- `code` (si aplica)

Campos opcionales recomendados:
- `latency_ms`
- `route`
- `method`
- `context` (payload resumido/sanitizado)

---

## 4) Reglas de seguridad de logging

1. Logs **MUST NOT** exponer secretos (tokens completos, passwords, credenciales).
2. Identificadores sensibles **SHOULD** enmascararse cuando no sean necesarios para trazabilidad.
3. En errores de autenticación, se registra causa técnica controlada sin filtrar datos sensibles.

---

## 5) Integración con auditoría

- Logging operacional y auditoría no se reemplazan entre sí; ambos son obligatorios donde corresponda.
- Eventos de denegación `401/403` y mutaciones críticas deben ser correlacionables entre log técnico y registro de auditoría.

---

## 6) Criterio de cumplimiento

Un endpoint no se considera listo si:
- no emite logs estructurados en sus flujos críticos,
- no incluye `correlation_id` en operaciones críticas,
- o no registra códigos canónicos en errores contractuales.

Referencia de cierre: [`../api/definition-of-api-done.md`](../api/definition-of-api-done.md)
