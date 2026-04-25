# TASKS — Plan de implementación MVP (Issue-first, interactivo)

**Versión:** 1.0  
**Fecha:** 2026-04-23  
**Estado:** Fase tasks autorizada (sin feature en ejecución)  
**Referencia:** PRD.md v2.2, PROPOSAL.md v3.1, SPEC.md v2.2, DESIGN.md v1.0

---

## 0. Cronología y control de fase

- 2026-04-22: cierre de fase de design documental.
- 2026-04-23: autorización explícita del usuario para iniciar fase tasks.
- Estado operativo actual: **sin feature iniciado** hasta cumplir gate por issue/feature.

---

## 1. Objetivo

Descomponer los features MVP priorizados en GitHub issues en tareas ejecutables, manteniendo gobernanza estricta:

- Implementación **feature-by-feature**.
- Flujo obligatorio por feature: **issue -> branch -> commits -> PR**.
- **No pasar al siguiente feature sin autorización explícita del usuario**.
- **No iniciar Feature #1 ni cualquier implementación hasta autorización explícita del usuario.**

---

## 2. Backlog fuente (MVP / priority:high)

- **#1** `feat(auth): API Key + RBAC multirol + sesión interna`
- **#2** `feat(ops): Turno único activo + día operativo + reglas de cierre`
- **#3** `feat(salon): Mesas y comandas colaborativas con concurrencia segura`
- **#4** `feat(kds): Cocina en tiempo real con trazabilidad de estados`
- **#5** `feat(billing): Cobros parciales, reversos compensatorios y cierre operativo`
- **#6** `feat(comercial): Promociones/combos + stock operativo + reportes MVP`

Todos los issues deben ser creados con labels: `enhancement`, `mvp`, `priority:high`, `status:needs-review`.

---

## 3. Reglas de ejecución (obligatorias)

1. No iniciar implementación de un issue sin `status:approved`.
2. Crear rama por feature con formato: `feat/<descripcion-corta>`.
3. Commits con Conventional Commits, sin atribuciones AI.
4. Abrir PR enlazando issue (`Closes #N`) y con tipo correcto.
5. Ejecutar pruebas y cobertura según baseline del proyecto.
6. Esperar autorización del usuario antes de comenzar el siguiente feature.
7. Cada feature MVP se cierra como **vertical slice backend + web** en la misma entrega (no se considera cerrado con backend-only).
8. No romper la estructura objetivo del monorepo definida en `src/apps/web`, `src/packages/backend`, `src/packages/data-access`, `src/packages/shared-utils`.
9. No crear módulos/rutas fuera de esos directorios objetivo durante implementación MVP.
10. Si una implementación requiere excepción de estructura/ubicación, **MUST** pedirse autorización explícita del usuario **ANTES** de implementar, documentando razones técnicas y trade-offs.

---

## 4. Orden propuesto de ejecución

1. Issue #1 (`feat(auth): API Key + RBAC multirol + sesión interna`)
2. Issue #2 (Turnos/Día operativo)
3. Issue #3 (Mesas/Comandas)
4. Issue #4 (KDS tiempo real)
5. Issue #5 (Billing/Reversos)
6. Issue #6 (Comercial: promos/stock/reportes)

Justificación: respeta dependencias funcionales y reduce retrabajo (seguridad -> operación base -> flujo operativo -> cierre comercial/reporting).

---

## 5. Desglose de tasks por feature

### 5.0 Matriz de trazabilidad TASKS -> SPEC (RF/GWT)

| Feature (Issue) | RF principales (SPEC) | Escenarios/GWT de referencia (SPEC) |
|---|---|---|
| #1 `feat(auth): API Key + RBAC multirol + sesión interna` | RF-AUTH-01..RF-AUTH-17 | Escenarios de authn/authz 401/403, API Key y sesión interna server-side (sección RF-AUTH) |
| #2 Turnos/Día operativo | RF-TUR-01..RF-TUR-06, RF-DIA-01..RF-DIA-05 | Escenarios de apertura/cierre y cruce de medianoche |
| #3 Mesas/Comandas | RF-MES-01..RF-MES-23 | Escenarios de comanda única, colaboración y concurrencia |
| #4 KDS Realtime | RF-KDS-* (operación de cocina en tiempo real) | Escenarios de transición de estados y sincronización en vivo |
| #5 Billing/Reversos | RF-BIL-* + RF-TUR-05/RF-DIA-01 | Escenarios de pagos parciales, reversos y bloqueos de cierre |
| #6 Comercial/Stock/Reportes | RF-MNU-01..RF-MNU-05, RF-PRM-*, RF-STK-*, RF-REP-01..RF-REP-05 | Escenarios de catálogo (categorías/subcategorías), pricing/stock y reportes MVP con filtros |

Nota: la implementación debe enlazar evidencia de pruebas por feature contra los RF/GWT listados arriba.

## 5.1 Issue #1 — `feat(auth): API Key + RBAC multirol + sesión interna`

### Alcance técnico
- Contrato FE↔BE por API Key (`X-API-Key`).
- Sesión interna server-side (sin token FE↔BE).
- RBAC multirol deny-by-default.
- Errores canónicos 401/403 con auditoría separada authn/authz.
- Backend NestJS sobre Fastify.
- Fuera de alcance: JWT/OAuth/refresh token para cliente FE.

### Tasks
- [x] **Fase 1 — Slice API Key (TDD):** RED `src/packages/backend/tests/unit/**/api-key-auth.guard.spec.ts` (falta/inválida/inactiva => 401, sin Bearer/JWT), GREEN `api-key-auth.guard.ts` + contrato de validación, REFACTOR de mapeo de contexto autenticado.
- [x] **Fase 2 — Slice sesión interna (TDD):** RED `src/packages/backend/tests/unit/**/resolve-session.use-case.spec.ts` (crear/expirar/revocar), GREEN `internal-session.entity.ts` + `session-repository.port.ts` + `session-repository.adapter.ts` + `resolve-session.use-case.ts`, REFACTOR de TTL/reloj y nomenclatura.
- [x] **Fase 3 — Slice RBAC multirol (TDD):** RED `src/packages/backend/tests/unit/**/rbac.guard.spec.ts` (deny-by-default, `@Public()`, intersección de roles), GREEN `public.decorator.ts` + `roles.decorator.ts` + `rbac.guard.ts`, REFACTOR helper de metadata/roles requeridos.
- [x] **Fase 4 — Slice errores/auditoría (TDD):** RED `src/packages/backend/tests/unit/**/auth-exception.filter.spec.ts` + tests de auditoría separada 401/403, GREEN `auth-exception.filter.ts` + `audit-event.port.ts` + adapter inicial, REFACTOR de códigos canónicos y payload de error.
- [x] **Fase 5 — Slice integración de módulo (TDD):** RED tests de integración Nest (`identity-access.module.int.spec.ts`) para matriz 401/403 y sesión vigente/expirada/revocada, GREEN wiring global de guards/filtro en `AppModule`/`main.ts`, REFACTOR de providers/tokens DI en `IdentityAccessModule`.
- [x] **Fase 6 — Slice contrato/documentación (TDD):** RED e2e (`auth-contract.e2e.spec.ts`) validando endpoints públicos/protegidos y ausencia de token en respuesta, GREEN actualización de `backend-openapi.yaml` + `auth-and-consumption.md`, REFACTOR de ejemplos/terminología API Key-only.
- [x] **Fase 7 — Slice web auth (TDD):** RED tests web del flujo de autenticación por API Key (ingreso/configuración de credencial de consumo y guardado en estado de sesión de la app), GREEN implementación de pantalla/flujo en `src/apps/web/` para consumir endpoints públicos/protegidos, REFACTOR de estados/mensajes UX.
- [x] **Fase 8 — Slice web manejo de errores canónicos (TDD):** RED tests web para respuestas `401/403` desde endpoints protegidos, GREEN manejo explícito en UI (mensaje visible + acción de recuperación/reintento según caso), REFACTOR de mapeo de errores FE↔BE.
- [x] **Fase 9 — Slice e2e full flow UI→API→respuesta visible (TDD):** RED e2e full-stack en `src/apps/web/` validando navegación/acción UI, llamada a API protegida con `X-API-Key` y rendering de respuesta/estado visible para usuario final, GREEN implementación mínima para pasar, REFACTOR de estabilidad y datos de prueba.

### DoD
- [ ] Cumple criterios de issue #1.
- [ ] Coverage y CI en verde.
- [ ] Evidencia de demo web funcional del flujo auth (público/protegido + manejo `401/403`) disponible en PR.
- [ ] E2E de punta a punta (UI→API→respuesta visible) en verde y enlazado como evidencia.
- [ ] No viola la estructura monorepo objetivo; cualquier excepción de ubicación/arquitectura tiene autorización explícita del usuario previa a la implementación, con razones técnicas y trade-offs documentados.
- [ ] PR enlazado y aprobado.

---

## 5.2 Issue #2 — Turnos y día operativo

### Alcance técnico
- Turno único activo global.
- Día operativo anclado al inicio de turno (`America/La_Paz`).
- Bloqueos de cierre por pendientes.

### Tasks
- [ ] Implementar modelo `Shift` y `OperationalDay`.
- [ ] Reglas de apertura/cierre de turno con invariantes.
- [ ] Reglas de cierre de día operativo con precondiciones.
- [ ] Implementar códigos canónicos de bloqueo (`CLOSURE_BLOCKED`).
- [ ] Auditoría de eventos de apertura/cierre/bloqueo.
- [ ] Implementar flujo web en `src/apps/web/` para apertura/cierre de turno y visualización del día operativo vigente.
- [ ] Tests unitarios de invariantes de turno/día.
- [ ] Tests integración de cruce de medianoche.
- [ ] Tests e2e full-stack `UI→API→persistencia→UI` de bloqueo/éxito en cierre de turno/día operativo.

### DoD
- [ ] Cumple criterios de issue #2.
- [ ] Coverage y CI en verde.
- [ ] Cumple estructura monorepo/hexagonal/clean code/SOLID: sin módulos dios, sin acoplamiento indebido y respetando `application/domain/infrastructure` cuando aplique.
- [ ] PR enlazado y aprobado.

---

## 5.3 Issue #3 — Mesas/comandas colaborativas

### Alcance técnico
- Una comanda abierta por mesa.
- Operación multi-mozo (turno activo).
- Concurrencia segura (`CONCURRENCY_CONFLICT`).
- Cambios post-envío solo por delta auditable.

### Tasks
- [ ] Implementar modelo y estados de mesa/comanda.
- [ ] Implementar regla de comanda única abierta por mesa.
- [ ] Validar permisos de mozo asignado al turno activo.
- [ ] Implementar control de colisión concurrente con 409 canónico.
- [ ] Implementar modificación por delta auditable (sin in-place).
- [ ] Auditoría de cambios con actor/timestamp/contexto.
- [ ] Implementar flujo web en `src/apps/web/` para operar mesas/comandas colaborativas y visualizar conflictos de concurrencia.
- [ ] Tests unitarios de reglas de estado.
- [ ] Tests integración de colisiones y revalidación.
- [ ] Tests e2e full-stack `UI→API→persistencia→UI` de flujo completo de mesa/comanda.

### DoD
- [ ] Cumple criterios de issue #3.
- [ ] Coverage y CI en verde.
- [ ] Cumple estructura monorepo/hexagonal/clean code/SOLID: sin módulos dios, sin acoplamiento indebido y respetando `application/domain/infrastructure` cuando aplique.
- [ ] PR enlazado y aprobado.

---

## 5.4 Issue #4 — KDS en tiempo real

### Alcance técnico
- Flujo cocina por estados en vivo.
- WebSockets (Socket.IO) con orden consistente y reconexión.

### Tasks
- [ ] Definir gateway realtime y canales de eventos KDS.
- [ ] Emitir eventos al cambiar estado de ítems.
- [ ] Garantizar orden por timestamp backend.
- [ ] Implementar snapshot + reconciliación en reconexión.
- [ ] Exponer autor visible por cambio de estado.
- [ ] Implementar flujo web en `src/apps/web/` para tablero KDS en vivo y reflejo de cambios de estado.
- [ ] Tests unitarios del gateway/event dispatcher.
- [ ] Tests integración de secuencia de estados.
- [ ] Tests e2e full-stack `UI→API→persistencia→UI` de sincronización salón-cocina.

### DoD
- [ ] Cumple criterios de issue #4.
- [ ] Coverage y CI en verde.
- [ ] Cumple estructura monorepo/hexagonal/clean code/SOLID: sin módulos dios, sin acoplamiento indebido y respetando `application/domain/infrastructure` cuando aplique.
- [ ] PR enlazado y aprobado.

---

## 5.5 Issue #5 — Billing/reversos/cierre operativo

### Alcance técnico
- Cobros parciales/totales.
- Reverso compensatorio (sin borrado histórico).
- Bloqueos de cierre por saldo pendiente.

### Tasks
- [ ] Implementar modelo de pagos y reversos compensatorios.
- [ ] Aplicar invariantes de no saldo negativo.
- [ ] Forzar estado `esperando_cuenta` tras reverso con saldo > 0.
- [ ] Integrar bloqueos de cierre con códigos canónicos.
- [ ] Auditoría de reversos con motivo obligatorio.
- [ ] Implementar flujo web en `src/apps/web/` para cobros parciales/totales, reversos y estado de cuenta por mesa.
- [ ] Tests unitarios de reglas monetarias.
- [ ] Tests integración de pago/reverso/cierre.
- [ ] Tests e2e full-stack `UI→API→persistencia→UI` de escenarios de caja críticos.

### DoD
- [ ] Cumple criterios de issue #5.
- [ ] Coverage y CI en verde.
- [ ] Cumple estructura monorepo/hexagonal/clean code/SOLID: sin módulos dios, sin acoplamiento indebido y respetando `application/domain/infrastructure` cuando aplique.
- [ ] PR enlazado y aprobado.

---

## 5.6 Issue #6 — Promos/combos/stock/reportes

### Alcance técnico
- Reglas de pricing con exclusión mutua promo individual/combo.
- Precio congelado por ítem.
- Stock operativo sin negativos.
- Reportes MVP incluyendo `RF-REP-05`.
- Catálogo MVP obligatorio con categorías y subcategorías (sin jerarquías más profundas).

### Tasks
- [ ] Implementar motor de pricing determinístico con desempates.
- [ ] Implementar exclusión mutua individual/combo por ítem/contexto.
- [ ] Implementar congelamiento de precio por ítem al agregar.
- [ ] Implementar stock operativo (config, distribución, ajuste, consumo/restitución).
- [ ] Aplicar rechazo canónico por stock insuficiente (`STOCK_CONFLICT`).
- [ ] Implementar CRUD de categorías (alta/listado/edición/desactivación) y validaciones base de catálogo.
- [ ] Implementar CRUD de subcategorías y validación de vínculo obligatorio con categoría activa.
- [ ] Implementar validación de asignación de plato/producto a categoría + subcategoría (rechazo `422` cuando subcategoría sea inválida/inactiva o no corresponda a la categoría).
- [ ] Actualizar `backend-openapi.yaml` para contratos de categorías/subcategorías y validaciones `422`.
- [ ] Implementar reportes MVP obligatorios y filtros combinables.
- [ ] Implementar flujo web en `src/apps/web/` para operación comercial (promos/combos, stock y reportes MVP) consumiendo APIs del feature.
- [ ] Tests unitarios de pricing y stock.
- [ ] Tests unitarios de reglas de subcategorías y asignación categoría/subcategoría en plato.
- [ ] Tests integración de reportes.
- [ ] Tests de integración para CRUD/validaciones de subcategorías y asignación de plato.
- [ ] Tests e2e full-stack `UI→API→persistencia→UI` de escenarios comerciales críticos.
- [ ] Tests e2e de creación válida de subcategoría y rechazos `422` (sin categoría, subcategoría inválida/inactiva).

### DoD
- [ ] Cumple criterios de issue #6.
- [ ] Coverage y CI en verde.
- [ ] Cumple estructura monorepo/hexagonal/clean code/SOLID: sin módulos dios, sin acoplamiento indebido y respetando `application/domain/infrastructure` cuando aplique.
- [ ] PR enlazado y aprobado.

---

## 6. Gate de inicio

- [ ] Autorización explícita del usuario para habilitar fase tasks (global).
- [ ] Issue seleccionado con `status:approved`.
- [ ] Autorización explícita del usuario para iniciar ese feature.
- [ ] Rama creada para el feature.

**Regla inquebrantable:** no iniciar ni continuar con otro feature sin autorización explícita del usuario.
