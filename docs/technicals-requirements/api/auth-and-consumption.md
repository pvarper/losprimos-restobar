# Auth & Consumption Contract (API)

> Documento índice (sin duplicar detalle).  
> La definición normativa vive en [`PRD.md`](../../PRD.md), [`PROPOSAL.md`](../../sdd/PROPOSAL.md), [`SPEC.md`](../../sdd/SPEC.md) y [`DESIGN.md`](../../sdd/DESIGN.md).

---

## 1) Tipo de autenticación (vigente)

- **Contrato FE↔BE:** API Key en header `X-API-Key`.
- **Implementación técnica declarada:** validación de API Key activa + evaluación RBAC en backend.
- **Sesión interna de usuario:** stateful y server-side para operación interna, separada del contrato FE↔BE.
- **Reglas clave asociadas:**
  - Cada request protegida debe enviar API Key válida.
  - La API Key puede activarse/desactivarse/rotarse por gestión administrativa.
  - Si la sesión interna server-side está expirada/revocada, la operación protegida se rechaza con 401.
  - Endpoint público explícito: `/api/v1/auth/health` (bypass por `@Public()`).
  - Endpoints protegidos usan deny-by-default RBAC si no tienen metadata explícita.
  - `/api/v1/auth/me` devuelve contexto de identidad sin token (sin JWT/Bearer/refresh/sessionId).
  - Respuestas canónicas: `401 AUTH_UNAUTHENTICATED` / `403 AUTH_FORBIDDEN`.

### Fuente de verdad
- [`SPEC.md`](../../sdd/SPEC.md) → §2.1 (RF-AUTH), §2.1.1 (mini-matriz de errores), §3 (NFR de seguridad/consistencia).
- [`DESIGN.md`](../../sdd/DESIGN.md) → §7 (convenciones API), §11 (contrato auth), §21.5 (seguridad y acceso).
- [`PROPOSAL.md`](../../sdd/PROPOSAL.md) → capacidades MVP de Auth y contrato 401/403.
- [`PRD.md`](../../PRD.md) → contrato FE↔BE por API Key + 401/403 auditados.

---

## 2) Rate limit

- **Estado actual:** **No definido como requisito explícito** en los artefactos vigentes.
- **Implicación:** no existe política contractual cerrada (por ejemplo, por IP/usuario/ruta) para esta fase.

### Referencia
- [`SPEC.md`](../../sdd/SPEC.md) §3 define NFR de performance/capacidad/disponibilidad, pero no fija una política formal de rate limiting.

---

## 3) Contrato de consumo API (mínimo vigente)

- **Base path:** `/api/v1/...`
- **Formato:** JSON
- **Auth header:** `X-API-Key: <api_key>` en endpoints protegidos
- **Errores canónicos relevantes para auth/consumo protegido:**
  - `401 AUTH_UNAUTHENTICATED`
  - `403 AUTH_FORBIDDEN`

### Matriz mínima vigente (auth)

| Caso | Endpoint | Resultado |
|---|---|---|
| Público sin API Key | `GET /api/v1/auth/health` | `200` |
| Protegido sin API Key | `GET /api/v1/auth/me` | `401 AUTH_UNAUTHENTICATED` |
| API Key válida + contexto interno no autorizado por RBAC | endpoint protegido con roles requeridos | `403 AUTH_FORBIDDEN` |
| API Key válida + sesión interna expirada/revocada | endpoints protegidos | `401 AUTH_UNAUTHENTICATED` |
| API Key válida + contexto autorizado por RBAC | endpoint protegido con roles requeridos | `200` |
- **Códigos adicionales de contrato general (dominio):** `409`, `422` con codes semánticos definidos en SPEC/DESIGN.

### Respuesta tokenless esperada (`GET /api/v1/auth/me`)

```json
{
  "principalId": "internal-admin-cajero",
  "roles": ["admin", "cajero"],
  "authMethod": "api-key"
}
```

Regla contractual: la respuesta no debe incluir `token`, `accessToken`, `sessionId` ni cabeceras de sesión/bearer para el cliente.

### Fuente de verdad
- [`DESIGN.md`](../../sdd/DESIGN.md) → §7 (Convenciones de API), §9 (códigos canónicos), §11 (seguridad/autorización).
- [`SPEC.md`](../../sdd/SPEC.md) → §2.1.1 (mini-matriz de errores), escenarios de 401/403 en sección de Auth.

---

## 4) Regla de mantenimiento

Si cambia cualquiera de estos puntos, primero se actualiza la fuente normativa ([`SPEC.md`](../../sdd/SPEC.md) y/o [`DESIGN.md`](../../sdd/DESIGN.md)) y luego este archivo índice.
