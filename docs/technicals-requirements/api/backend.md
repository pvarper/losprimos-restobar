# Backend Integration Guide (Normativo)

> **Tipo de documento:** Normativo.  
> Define cómo integrarse al backend del MVP y cómo gobernar contratos API durante la implementación incremental por features.

---

## 1) Propósito y alcance

Este documento fija reglas de integración para consumidores del backend (frontend interno, herramientas operativas, tests e integraciones futuras), sin duplicar la especificación funcional.

Fuentes normativas:
- [`PRD.md`](../../PRD.md)
- [`PROPOSAL.md`](../../sdd/PROPOSAL.md)
- [`SPEC.md`](../../sdd/SPEC.md)
- [`DESIGN.md`](../../sdd/DESIGN.md)
- [`TASKS.md`](../../sdd/TASKS.md)
- OpenAPI vivo: [`backend-openapi.yaml`](./backend-openapi.yaml)

---

## 2) URL base y versionado

- **Base URL local por defecto:** `http://localhost:3000`
- **Prefijo de API obligatorio:** `/api/v1`
- **Versionado:** toda API expuesta en MVP MUST vivir bajo `/api/v1/...`
- **Estilo de comunicación FE↔BE:** API REST sobre HTTP.
- **Runtime objetivo de backend:** NestJS con adapter Fastify.

Ejemplo:
- `GET http://localhost:3000/api/v1/auth/health`

---

## 3) Autenticación y autorización

- **Contrato FE↔BE:** API Key (`X-API-Key: <api_key>`).
- **Implementación técnica:** validación de API Key activa + evaluación RBAC en backend.
- **Sesión interna:** stateful server-side para usuarios internos, separada del contrato FE↔BE.
- **Sin contrato por access token en esta fase**.

Referencia normativa detallada:
- [`auth-and-consumption.md`](./auth-and-consumption.md)
- [`SPEC.md`](../../sdd/SPEC.md) (RF-AUTH-08..15, NFR-04/NFR-06/NFR-12)

---

## 4) Contrato de errores

Los consumidores MUST manejar errores por HTTP + `code` semántico canónico.

Mínimos obligatorios:
- `401 AUTH_UNAUTHENTICATED`
- `403 AUTH_FORBIDDEN`
- `409 STOCK_CONFLICT | CONCURRENCY_CONFLICT | CLOSURE_BLOCKED`
- `422 STATE_INVALID`

Referencia normativa detallada:
- [`canonical-errors.md`](./canonical-errors.md)
- [`SPEC.md`](../../sdd/SPEC.md) §2.1.1

---

## 5) Reglas de consumo e integración

1. Todo consumidor MUST incluir `X-API-Key` en endpoints protegidos.
2. Toda operación crítica SHOULD incluir `correlation_id` para trazabilidad extremo a extremo.
3. Ante `401`, el cliente debe tratar API Key como ausente/inválida/inactiva y detener operación protegida hasta corregir credencial.
4. Ante `401` por sesión interna expirada/revocada, el cliente debe reautenticar usuario según flujo interno.
5. Ante `403`, el cliente no debe reintentar automáticamente la misma acción sin cambio de permisos.
6. Ante `409/422`, el cliente MUST reconciliar estado con backend antes de reintento.

Referencia:
- [`traceability-rules.md`](./traceability-rules.md)
- [`caches-freshness-observability.md`](./caches-freshness-observability.md)

---

## 6) OpenAPI como contrato vivo

- El archivo [`backend-openapi.yaml`](./backend-openapi.yaml) es la referencia técnica de endpoints definidos/objetivo.
- Cada feature implementado MUST actualizar OpenAPI en el mismo PR.
- No se considera cerrada una API si no está reflejada en OpenAPI con:
  - path/method,
  - request/response schemas,
  - códigos de respuesta,
  - requisitos de seguridad.

---

## 7) Gobernanza de cambios

1. Cambios funcionales: actualizar primero [`SPEC.md`](../../sdd/SPEC.md)/[`DESIGN.md`](../../sdd/DESIGN.md).
2. Cambios de contrato API implementado: actualizar `backend-openapi.yaml` en el mismo PR.
3. Cambios de guía de consumo: actualizar este `backend.md`.
