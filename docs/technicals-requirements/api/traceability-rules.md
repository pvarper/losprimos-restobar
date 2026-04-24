# Traceability Rules (Normativo)

> **Tipo de documento:** Normativo.  
> Define reglas obligatorias de trazabilidad técnica para API, eventos y ejecución operativa del MVP.

---

## 1) Alcance normativo

Aplica a:
- Endpoints REST `/api/v1/...`
- Eventos de tiempo real operativos
- Flujos críticos de auth, comandas, KDS, billing, stock y cierre operativo

Fuentes normativas:
- [`SPEC.md`](../../sdd/SPEC.md) — invariantes, RF/NFR, escenarios GWT, trazabilidad funcional.
- [`DESIGN.md`](../../sdd/DESIGN.md) — contratos API, eventos realtime, observabilidad y auditoría.
- [`TASKS.md`](../../sdd/TASKS.md) — trazabilidad de ejecución por feature hacia RF/GWT.

---

## 2) Reglas obligatorias de trazabilidad

1. Toda operación crítica **MUST** incluir `correlation_id` trazable extremo a extremo.
2. Toda acción protegida ejecutada o denegada **MUST** quedar auditada con actor, acción, contexto, timestamp y resultado.
3. Toda mutación de estado crítico **MUST** registrar entidad afectada y transición.
4. En cambios que impliquen conflicto de concurrencia o reglas de dominio, la respuesta **MUST** incluir HTTP + code semántico canónico.
5. En tiempo real, cada evento operacional **MUST** contener autor y referencia temporal de backend para reconciliación.
6. Todo PR de feature **MUST** enlazar issue origen y evidencia de pruebas asociada al alcance RF/GWT del feature.

---

## 3) Trazabilidad por capas

### 3.1 Contrato de consumo (API)
- Request/response de endpoints críticos **MUST** ser correlacionables con logs y auditoría.
- Errores `401/403/409/422` **MUST** usar codes canónicos definidos.

Referencia: [`canonical-errors.md`](./canonical-errors.md), [`auth-and-consumption.md`](./auth-and-consumption.md).

### 3.2 Observabilidad operacional
- Logs estructurados **MUST** exponer campos mínimos de trazabilidad.
- Métricas de latencia/throughput/disponibilidad **MUST** permitir seguimiento por feature y flujo crítico.

Referencia: [`caches-freshness-observability.md`](./caches-freshness-observability.md), [`DESIGN.md`](../../sdd/DESIGN.md).

### 3.3 Trazabilidad de implementación
- Cada feature ejecutado **MUST** mantener vínculo: Issue -> Branch -> Commits -> PR -> Evidencia de tests.
- No se permite avanzar al siguiente feature sin autorización explícita del usuario.

Referencia: [`TASKS.md`](../../sdd/TASKS.md), [`PROPOSAL.md`](../../sdd/PROPOSAL.md), [`SPEC.md`](../../sdd/SPEC.md).

---

## 4) Matriz mínima de vínculo obligatorio

Para cada feature MVP:
- Issue de origen (GitHub)
- RF/GWT objetivo (SPEC)
- Artefactos técnicos impactados (DESIGN/TASKS/código)
- Evidencia de validación (unit/integration/e2e/coverage)
- PR de cierre con enlace al issue

Esta matriz **MUST** poder reconstruirse durante auditoría sin ambigüedad.

---

## 5) Gobernanza de cambios

1. Si cambia el contrato de trazabilidad, primero actualizar [`SPEC.md`](../../sdd/SPEC.md) y/o [`DESIGN.md`](../../sdd/DESIGN.md).
2. Luego sincronizar este documento normativo.
3. Cambios de implementación sin trazabilidad mínima completa **MUST NOT** considerarse cerrados.
