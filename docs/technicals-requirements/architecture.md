# Architecture Map (Descriptivo + Normativo)

> Este documento separa explícitamente:
> - **Estado actual implementado** (**Descriptivo**)  
> - **Arquitectura objetivo** (**Normativo**)  
> 
> Cualquier punto no definido en artefactos vigentes queda marcado como **Pendiente**.

---

## 1) Stack objetivo (Normativo)

Fuente normativa principal: [`../sdd/DESIGN.md`](../sdd/DESIGN.md) §21

- **Backend:** Node.js + TypeScript + NestJS (Fastify) + Arquitectura Hexagonal (Ports & Adapters).
- **Persistencia:** PostgreSQL + Prisma ORM.
- **Frontend:** Next.js + React (JavaScript/TypeScript).
- **Realtime:** WebSockets con Socket.IO.
- **Auth FE↔BE:** API Key (sin token en esta fase).
- **Cache/cola/eventos internos:** Redis (habilitado en MVP).
- **Entorno dev estándar:** Docker + Docker Compose.
- **Testing desde MVP:** unit + integración + e2e + coverage.
- **CI:** GitHub Actions (tests + coverage por PR).

Versiones objetivo vigentes:
- Node.js 24.x
- NestJS 11.x
- Prisma 7.x
- PostgreSQL 17.x
- Next.js 16.x
- React 19.x
- Socket.IO 4.8.x
- Redis 7.x

---

## 2) Estado actual del código (Descriptivo)

Estado observado en repo actual:

- No existe código de aplicación implementado en esta rama.
- El repositorio está en baseline documental (SDD + technical requirements).
- OpenAPI y guías técnicas representan **arquitectura/contrato objetivo**, no implementación ya disponible.

Referencias descriptivas:
- [`./api/backend-openapi.yaml`](./api/backend-openapi.yaml)

---

## 3) Arquitectura objetivo (Normativo)

Fuente normativa: [`../sdd/DESIGN.md`](../sdd/DESIGN.md) §4, §5, §6, §17, §21

Bounded Contexts objetivo:
1. Identity & Access
2. Shift & Operational Day
3. Table & Order
4. Kitchen Operations (KDS)
5. Billing & Settlement
6. Pricing & Promotions
7. Operational Stock
8. Reporting
9. Audit & Traceability

Regla de interacción:
- Integración por contratos explícitos (API/eventos), sin acoplamiento implícito entre contextos.

Estado de formalización C4:
- **Pendiente de implementación documental (non-blocking):** diagrama C4 formal (Context/Container/Component) aún no generado porque la rama está en baseline documental sin scaffold/código de módulos. La estructura normativa vigente para MVP se toma de bounded contexts + mapeo físico de §3.2. Siguiente paso: generar C4 en el primer PR de scaffold arquitectónico.

### 3.2 Mapeo físico final por bounded context (Normativo)

- `src/packages/backend/src/modules/identity-access/` -> Identity & Access
- `src/packages/backend/src/modules/shift-day/` -> Shift & Operational Day
- `src/packages/backend/src/modules/table-order/` -> Table & Order
- `src/packages/backend/src/modules/kitchen-ops/` -> Kitchen Operations (KDS)
- `src/packages/backend/src/modules/billing-settlement/` -> Billing & Settlement
- `src/packages/backend/src/modules/pricing-promotions/` -> Pricing & Promotions
- `src/packages/backend/src/modules/operational-stock/` -> Operational Stock
- `src/packages/backend/src/modules/reporting/` -> Reporting
- `src/packages/backend/src/modules/audit-traceability/` -> Audit & Traceability

Reglas:
- Cada bounded context **MUST** ser módulo aislado en `backend`.
- `data-access` **MUST** exponer repos/adaptadores de persistencia sin lógica de dominio.
- `shared-utils` **MUST** concentrar utilidades transversales sin acoplarse a reglas de negocio.

### 3.1 Estructura objetivo monorepo (Normativo)

```txt
src/
  apps/
    web/                    # frontend (Next.js/React)
  packages/
    backend/                # API NestJS
    data-access/            # Prisma, repos, adapters DB
    shared-utils/           # config, constants, logging, transport/*
      src/
        config/
        constants/
        logging/
        transport/
          errors/
          request/
          retry/
          types/
          url/
```

Responsabilidades por paquete:
- `src/apps/web/`: frontend (UI, rutas y estado de presentación). No aloja reglas de dominio críticas ni acceso directo a DB.
- `src/packages/backend/`: API NestJS/Fastify con arquitectura hexagonal (use-cases, puertos, adaptadores, controladores) y enforcement de invariantes.
- `src/packages/data-access/`: persistencia compartida (Prisma/schema, migraciones, repos/adaptadores DB) sin lógica de negocio.
- `src/packages/shared-utils/`: utilidades transversales agnósticas al dominio (`config`, `constants`, `logging`, `transport/*`).

Reglas de dependencias (enforcement):
1. `apps/*` puede depender de `packages/*`.
2. `packages/backend` puede depender de `packages/data-access` y `packages/shared-utils`.
3. `packages/data-access` puede depender de `packages/shared-utils`, pero no de `apps/*`.
4. `packages/shared-utils` no debe depender de módulos de dominio (`backend`, `data-access`).

Enforcement de aprobación (bloqueante):
- Cualquier violación de ubicación (fuera de `src/apps/web`, `src/packages/backend`, `src/packages/data-access`, `src/packages/shared-utils`) o de reglas de dependencias **MUST** bloquear aprobación de PR y cierre de feature.
- No se permite cierre condicional “se corrige después” para estas violaciones en MVP.

Proceso de excepción (obligatorio):
1. Abrir request de cambio de arquitectura con: justificación técnica, impacto esperado, alternativas evaluadas y trade-offs.
2. Incluir alcance de la excepción (módulos/rutas afectadas) y plan de reversión/mitigación.
3. Obtener aprobación explícita del usuario **ANTES** de implementar la excepción.

---

## 4) Principios de arquitectura (Normativo)

1. **Backend como fuente de verdad** para reglas de negocio y autorización.
2. **Deny-by-default** en seguridad.
3. **Consistencia operativa sobre optimización prematura**.
4. **Concurrencia controlada** con conflictos canónicos (`409`/`422` + code semántico).
5. **Auditoría obligatoria** en acciones/mutaciones críticas.
6. **Contrato FE↔BE por API Key** con RBAC y auditoría en backend.
7. **Evolución incremental por feature** con contrato vivo (OpenAPI + tests + trazabilidad).

Referencias:
- [`../sdd/SPEC.md`](../sdd/SPEC.md)
- [`../sdd/DESIGN.md`](../sdd/DESIGN.md)

---

## 5) Responsabilidades por app (Normativo)

## 5.1 Frontend
- Consumir APIs versionadas bajo `/api/v1`.
- Enviar API Key en header normativo (ver `auth-and-consumption.md`) en rutas protegidas.
- Manejar `401/403/409/422` por contrato canónico.
- Reconciliar estado ante conflictos y eventos realtime.

## 5.2 Backend
- Exponer contratos HTTP/eventos según especificación.
- Enforzar reglas de dominio, seguridad y concurrencia.
- Emitir códigos canónicos y trazabilidad mínima.
- Persistir auditoría en acciones críticas.

## 5.3 Definiciones diferidas fuera de MVP
- **BFF/gateway específico:** diferido a V2 por alcance de producto; no se define ni implementa en MVP actual (referencia: `../PRD.md` funcionalidades V2 y `../sdd/PROPOSAL.md` §4 Out of Scope). Siguiente paso: abrir change de arquitectura cuando se apruebe V2.
- **Separación formal por apps frontend independientes (web admin / kitchen UI / waiter UI):** diferida a V2; en MVP se asume una app web interna con módulos por dominio y autorización RBAC desde backend. Siguiente paso: decisión de partición de frontends en change explícito de V2.

---

## 6) Convenciones de implementación: type/interface (Normativo)

1. Contratos externos (HTTP/events) **MUST** tener esquema explícito y trazable (OpenAPI o equivalente).
2. DTOs de entrada/salida **MUST** validarse en borde de aplicación.
3. Interfaces de puertos **MUST** vivir desacopladas de adaptadores concretos.
4. Tipos de dominio **SHOULD** ser explícitos y evitar estructuras anónimas en reglas críticas.
5. Códigos canónicos de error **MUST** modelarse como valores controlados (no strings arbitrarios dispersos).

Convención de naming exacta:
- `*.port.ts` -> contratos de puertos de aplicación/dominio
- `*.adapter.ts` -> implementación de puertos en infraestructura
- `*.dto.ts` -> contratos de entrada/salida en borde HTTP
- `*.entity.ts` -> entidades de dominio
- `*.use-case.ts` -> casos de uso de aplicación
- `*.controller.ts` -> adaptador HTTP de entrada

Guía de carpetas por módulo hexagonal (`src/packages/backend/src/modules/<bounded-context>/`):

```txt
application/
  use-cases/
  ports/
domain/
  entities/
  value-objects/
infrastructure/
  adapters/
  persistence/
  http/
```

Reglas:
- Dominio y aplicación **MUST NOT** depender de infraestructura.
- `controller` y `adapter` son puntos de borde; la lógica vive en `use-cases`/`domain`.

---

## 7) Flujo de datos objetivo (Normativo)

Flujo base:
1. Cliente invoca endpoint `/api/v1/...` con contexto de autenticación.
2. Backend valida authn/authz y reglas de entrada.
3. Caso de uso aplica reglas de dominio e invariantes.
4. Persistencia transaccional guarda estado/auditoría.
5. Backend responde contrato HTTP canónico.
6. Si aplica, backend emite eventos realtime y consumidores reconcilian estado.

Reglas clave de flujo:
- En conflictos/colisiones, cliente MUST reconciliar con estado backend.
- Toda mutación crítica MUST ser trazable por `correlation_id`.

Referencias:
- [`./api/auth-and-consumption.md`](./api/auth-and-consumption.md)
- [`./api/canonical-errors.md`](./api/canonical-errors.md)
- [`./api/caches-freshness-observability.md`](./api/caches-freshness-observability.md)
- [`./api/traceability-rules.md`](./api/traceability-rules.md)

---

## 8) Referencias

- Producto/alcance:
  - [`../PRD.md`](../PRD.md)
  - [`../open-questions.md`](../open-questions.md)
- SDD:
  - [`../sdd/PROPOSAL.md`](../sdd/PROPOSAL.md)
  - [`../sdd/SPEC.md`](../sdd/SPEC.md)
  - [`../sdd/DESIGN.md`](../sdd/DESIGN.md)
  - [`../sdd/TASKS.md`](../sdd/TASKS.md)
- Técnicos normativos:
  - [`./api/README.md`](./api/README.md)
  - [`./operations/README.md`](./operations/README.md)
  - [`./logging/README.md`](./logging/README.md)
  - [`./testing/README.md`](./testing/README.md)
  - [`./database/README.md`](./database/README.md)
  - [`./local-runtime.md`](./local-runtime.md)
