# DESIGN — Arquitectura técnica MVP operativo

**Versión:** 1.0  
**Fecha:** 2026-04-22  
**Estado:** Aprobación interna  
**Referencia:** PRD.md v2.2, PROPOSAL.md v3.1, SPEC.md v2.2

---

## 1. Resumen Ejecutivo

Este documento define la arquitectura técnica del MVP operativo de Los Primos Restobar, alineada con PRD v2.2, PROPOSAL v3.1 y SPEC v2.2.

El objetivo es asegurar una implementación consistente, testeable y auditable de los flujos críticos: autenticación/autorización, operación de turnos y día operativo, gestión colaborativa de comandas, KDS en tiempo real, cobro/reversos e informes operativos.

El alcance técnico cubre Auth/RBAC multirol, Turnos, Mesas/Comandas, Cocina, Billing, Promociones/Combos, Stock operativo y Reportes MVP. Quedan fuera de alcance las capacidades V2 (insumos/costos, integraciones de pago externas, facturación fiscal, offline avanzado y analítica extendida).

Criterio de éxito técnico del design: que cada regla no negociable del SPEC tenga representación explícita en arquitectura, contratos y estrategia de validación.

---

## 2. Contexto y Drivers

El sistema reemplaza operación en papel por un flujo digital interno para salón, cocina, caja y administración.

### Drivers de negocio
- Reducir errores de comunicación salón↔cocina.
- Evitar cierres operativos inconsistentes (turno/día con pendientes).
- Garantizar control sobre promociones, stock operativo y cobros.
- Obtener visibilidad operativa mínima en reportes MVP.
- Reducir tiempos de espera de clientes en mesa sin atención.
- Agilizar la entrega de pedidos listos desde cocina hacia mesa.

### Drivers técnicos
- Reglas de estado determinísticas (mesa/comanda/pago/turno).
- Concurrencia segura en operaciones críticas.
- Auditoría completa (quién, qué, cuándo, contexto, before/after).
- Contrato FE↔BE por API Key.
- Consistencia de tiempo real entre actores.

### Restricciones explícitas
- API Key FE↔BE (`X-API-Key`) como mecanismo de autenticación de cliente.
- Sin contrato por access token en esta fase.
- Zona horaria oficial: `America/La_Paz`.
- Día operativo anclado a fecha de inicio de turno.
- Integraciones de pago externas/fiscales fuera de MVP (V2).

---

## 3. Alcance del Design

### 3.1 In Scope técnico (MVP)
1. Auth y RBAC multirol (deny-by-default).
2. Turnos y día operativo (incluye cruce de medianoche).
3. Mesas y comandas colaborativas.
4. KDS en tiempo real.
5. Billing y reversos.
6. Promociones y pricing.
7. Stock operativo.
8. Reportes MVP.
9. Auditoría y observabilidad.

### 3.2 Out of Scope técnico (V2)
- Insumos/costos.
- Integraciones de pago externas.
- Facturación fiscal.
- Offline/PWA avanzada.
- Analítica extendida de rentabilidad.

### 3.3 Entregables de esta fase
- Arquitectura lógica por dominios.
- Modelo de estados e invariantes.
- Contratos API críticos.
- Estrategia de concurrencia/consistencia.
- Diseño de auditoría/trazabilidad.
- Plan de implementación por lotes.

### 3.4 ABM operativos del MVP
1. ABM de usuarios internos (CRUD + asignación multirol).
2. ABM de turnos (apertura/cierre + alta/baja dinámica de mozos).
3. ABM de mesas (CRUD + capacidad > 0 + reasignación).
4. ABM de menú/categorías/platos.
5. ABM de promociones (individuales y combos).
6. ABM de stock operativo (configuración, distribución, ajuste, consulta).

---

## 4. Arquitectura Lógica (Bounded Contexts)

1. **Identity & Access**
2. **Shift & Operational Day**
3. **Table & Order**
4. **Kitchen Operations (KDS)**
5. **Billing & Settlement**
6. **Pricing & Promotions**
7. **Operational Stock**
8. **Reporting**
9. **Audit & Traceability**

Relaciones clave:
- Identity & Access gobierna permisos del resto.
- Shift & Operational Day condiciona operación de mesas/comandas/kds/billing/stock.
- Table & Order publica eventos para KDS, Billing, Stock, Audit.
- Reporting consume consolidados de todos los contextos.

Regla de dependencia: interacción solo por contratos explícitos (API/eventos).

---

## 5. Modelo de Dominio

### Entidades principales
User, Role, Permission, OperationalDay, Shift, Table, Order, OrderItem, Payment, PaymentReversal, Promotion, Combo, StockConfig, StockMovement, AuditEvent.

### Value Objects
Money (BOB, 2 decimales, half-up), OperationalDate, TimeWindow (`America/La_Paz`), catálogos de estado, ActorRef.

### Invariantes núcleo
1. Un turno activo global.
2. Día operativo por fecha inicio turno.
3. Una comanda abierta por mesa.
4. Solo mozos asignados al turno operan comandas.
5. Colaboración multi-mozo con trazabilidad.
6. No stock negativo.
7. No saldo negativo.
8. No cierre con pendientes.
9. Reverso compensatorio, sin borrado histórico.
10. Promo individual vs combo mutuamente excluyentes.
11. Precio congelado por ítem.
12. Reverso con saldo>0 fuerza `esperando_cuenta`.

### Estados y transiciones
- Mesa: `libre -> ocupada -> esperando_cuenta -> libre` (con bloqueos por deuda).
- Comanda: `abierta -> enviada -> cerrada` (post-envío por delta auditable).
- Turno: `abierto -> cerrado` (sin pendientes).
- Día operativo: `abierto -> cerrado` (turnos cerrados + sin pendientes).

---

## 6. Flujos Críticos

1. Apertura y operación colaborativa de comanda.
2. Envío a cocina y operación KDS.
3. Cobro parcial/total y cierre de mesa.
4. Reverso/anulación de cobro.
5. Cierre de turno y día operativo.
6. Pricing (promo individual vs combo).
7. Stock operativo por turno/día.
8. Seguridad/authorization runtime (401/403).

Casos de colisión: último stock, pago+reverso concurrentes, cierre con pendiente concurrente.

---

## 7. Contratos de Integración (API)

### Convenciones
- `/api/v1/...`
- JSON
- API Key (`X-API-Key`)
- Errores: 401, 403, 409, 422
- `correlation_id` obligatorio en operaciones críticas

### Dominios de endpoints
- Auth/Sesión/RBAC
- ABM Usuarios
- Turnos/Día operativo
- Mesas
- Comandas/Ítems
- KDS
- Billing/Reversos
- Menú/Promos/Combos
- Stock operativo
- Reportes MVP

### Eventos de tiempo real
`order.created`, `order.item.added`, `order.item.canceled`, `order.sent_to_kitchen`, `kds.item.started`, `kds.item.ready`, `kds.item.picked_up`, `table.status.changed`, `payment.recorded`, `payment.reversed`, `stock.changed`, `shift.waiter.assigned`, `shift.waiter.unassigned`, `closure.blocked`, `closure.allowed`.

---

## 8. Diseño de Datos y Persistencia

### Principios
- Fuente de verdad transaccional relacional.
- Integridad fuerte en pagos/stock/cierres/estados.
- Auditoría persistente e inmutable.
- Soft-delete en maestros; no borrado destructivo en movimientos.

### Reglas de integridad
- No saldo negativo, no stock negativo.
- Reverso siempre por inserción compensatoria.
- Cierres con revalidación en transacción de cierre.

### Auditoría
Campos mínimos: actor, acción, entidad, contexto, before/after, reason, correlation_id, timestamp, operational_day/shift_id.

---

## 9. Concurrencia y Consistencia

### Reglas
- Atómico por entidad objetivo.
- `first-confirm-first-apply`.
- Rechazo `409` con estado actualizado para colisión.
- Revalidación antes de confirmar.
- Auditoría de conflicto obligatoria.

### Códigos de error canónicos (alineados con SPEC §2.1.1)
- `STATE_INVALID` (`422`)
- `STOCK_CONFLICT` (`409`)
- `CONCURRENCY_CONFLICT` (`409`)
- `CLOSURE_BLOCKED` (`409`)
- `AUTH_UNAUTHENTICATED` (`401`)
- `AUTH_FORBIDDEN` (`403`)

---

## 10. Tiempo Real

### Garantías
- Autor visible en cada acción.
- Actualización sin refresh manual.
- Orden consistente por timestamp backend.
- KDS por antigüedad + timer en tiempo real.

### Reconciliación
- Reintento de suscripción.
- Snapshot al reconectar.
- Aplicación de eventos por versión/timestamp.

---

## 11. Seguridad y Autorización

### Principios
- Backend source of truth.
- Deny-by-default.
- Contrato de autenticación FE↔BE por API Key.
- Auditoría de allow/deny.

### Contrato auth
- API Key en `X-API-Key` para endpoints protegidos.
- La API Key se valida en backend (activa/válida) y luego se aplica RBAC.
- `401` no autenticado/api key ausente o inválida.
- `403` autenticado sin permiso.

---

## 12. Reglas de Pricing y Stock

### Pricing
- Promo individual por tiempo/cupo, deshabilita base si aplica.
- Resolución determinística (menor precio + desempates).
- Combo con elección manual del cliente vía mozo.
- Exclusión mutua individual/combo por ítem/contexto.
- Congelamiento de precio por ítem.

### Stock operativo
- Configuración por turno/día, prioridad turno > día.
- Distribución automática + ajuste manual con restricciones.
- Consumo/restitución auditables.
- Imputación por día operativo.

---

## 13. Reportes y Criterios de Cómputo

### Reportes MVP obligatorios
1. Ventas por período (día/semana/mes).
2. Platos más pedidos.
3. Performance por mozo.
4. Estado de pago operativo.
5. Stock por producto (definido/vendido/saldo).

### Filtros combinables
turno, día calendario, mozo, categoría, estado de pago operativo, franja horaria.

### Regla calendario vs operativo
- Día operativo = fuente de verdad operativa.
- Día calendario = vista analítica.

---

## 14. Observabilidad

### Mínimos MVP
- Logs estructurados día 1.
- Métricas de p95/TPS/disponibilidad.
- Correlation ID end-to-end.
- Audit log transversal.

### Evolución
- V2: Grafana/Loki, dashboards y alertas avanzadas.

---

## 15. Validación y Pruebas de Diseño

### 15.1 Matriz NFR -> decisión de diseño -> verificación (bloqueante)

| NFR (SPEC) | Decisión de diseño que lo soporta | Verificación mínima obligatoria |
|---|---|---|
| NFR-01/NFR-03 (p95 <= 3s, 15 TPS) | Backend NestJS+Fastify, módulos por bounded context, contratos cerrados para reducir variabilidad operacional. | Evidencia de carga según `SPEC.md` 3.2 (p95 + TPS en la misma ventana). |
| NFR-02 (99.9% disponibilidad) | Stack objetivo con despliegue contenedorizado y operación instrumentada para seguimiento continuo. | Reporte mensual de disponibilidad (con exclusión de mantenimientos comunicados) según `SPEC.md` 3.2. |
| NFR-04/NFR-06/NFR-12 (API Key + RBAC + revocación) | Contrato FE↔BE por `X-API-Key`, deny-by-default, separación authn/authz y auditoría de decisiones. | Tests y evidencia de matriz 401/403 + invalidación efectiva tras revocación/rotación de credenciales. |
| NFR-05/NFR-10 (consistencia y tiempo real colaborativo) | Backend como fuente de verdad + propagación de eventos en tiempo real con autor visible y reconciliación de estado. | Evidencia e2e de sincronización multi-actor sin refresco manual + manejo de colisiones `409`. |
| NFR-08/NFR-11 (observabilidad/auditabilidad) | Logs estructurados, `correlation_id` end-to-end y auditoría before/after en mutaciones críticas. | Evidencia de trazabilidad completa por flujo crítico (evento + actor + contexto + before/after). |
| NFR-13 (responsividad por rol/dispositivo) | Frontend web por rol operativo con UX adaptada a contexto (mozo móvil/tablet, cocina monitor, caja/admin PC). | Evidencia de flujo funcional por rol en UI + e2e integrado `UI -> API -> persistencia -> UI`. |

Regla de enforcement:
- Si un PR/feature incumple evidencia mínima de esta matriz para los NFR afectados, **MUST** bloquearse su cierre.
- Referencias técnicas de control: `docs/technicals-requirements/operations/mvp-domain-rules.md`, `docs/technicals-requirements/api/caches-freshness-observability.md`, `docs/technicals-requirements/testing/testing-standard.md`.

### Estrategia
- Cobertura RF/NFR + invariantes + bordes críticos.
- Trazabilidad completa PRD→SPEC→Escenarios→Evidencia.

### Evidencia mínima
- evidencia funcional de flujos críticos,
- evidencia de conflictos 409,
- exactitud monetaria,
- evidencia de reportes MVP,
- evidencia NFR (SPEC 3.2),
- evidencia de trazabilidad con correlation_id.

---

## 16. Riesgos Técnicos y Mitigaciones

Top riesgos cubiertos:
- colisiones concurrentes,
- desalineación FE/BE en auth,
- drift de reglas,
- errores de pricing,
- reversos mal aplicados,
- imputación temporal incorrecta,
- pérdida de trazabilidad,
- scope creep de V2.

Mitigación principal: invariantes explícitos, contratos cerrados, auditoría obligatoria y validación por evidencia.

---

## 17. Plan de Implementación (por lotes)

1. Fundaciones (Auth/RBAC/Turnos).
2. Salón + KDS.
3. Billing + Reversos + Cierres.
4. Pricing + Stock + Reportes.
5. Hardening + NFR + aceptación.

Gate entre lotes: RF/GWT/NFR/evidencia mínima cumplidos.

---

## 18. Decisiones Arquitectónicas (ADR breve)

- Separación sesión/token.
- Concurrencia atómica con 409.
- Reverso compensatorio.
- Día operativo como verdad operativa.
- Exclusión mutua individual/combo.
- Stock operativo separado de insumos/costos.
- Eventos tiempo real con autor visible.
- PRD/PROPOSAL/SPEC como tríada de gobernanza.

---

## 19. Checklist de Salida de Design

### 19.1 Criterios obligatorios de completitud
- [x] Alcance MVP técnico definido y alineado con PRD/PROPOSAL/SPEC.
- [x] Frontera V2 explícita (sin scope creep).
- [x] Bounded contexts definidos y dependencias claras.
- [x] Modelo de dominio con entidades, estados e invariantes cerrados.
- [x] Flujos críticos modelados end-to-end.
- [x] Contratos API críticos definidos (incluyendo errores y auth).
- [x] Reglas de concurrencia/consistencia explícitas y testeables.
- [x] Reglas de pricing/stock cerradas y auditables.
- [x] Reglas de cierre operativo y reversos cerradas.
- [x] Reportes MVP y criterios de cómputo cerrados.
- [x] Observabilidad mínima definida (logs/métricas/correlation_id).
- [x] Estrategia de validación de diseño definida (RF/NFR/GWT/evidencia).
- [x] Riesgos técnicos con mitigaciones documentadas.
- [x] Plan de implementación por lotes definido.

### 19.2 Criterios de trazabilidad
- [x] Trazabilidad PRD → SPEC → Escenarios confirmada.
- [x] Open Questions MVP resueltas o marcadas non-blocking/V2.
- [x] Decisiones arquitectónicas (ADR) registradas.
- [x] Dependencias explícitas para siguiente fase.

### 19.3 Criterios de gobernanza
- [x] Versiones y referencias cruzadas consistentes.
- [x] Terminología canónica unificada (día operativo, estado pago, etc.).
- [x] Documento listo para handoff sin ambigüedad operativa.

### 19.4 Gate de autorización
- [x] **Autorización explícita del usuario para cerrar fase de design documental.**
- [x] **Autorización explícita del usuario para pasar a fase de tasks.**

---

## 20. Estado de Fase y Próximo Gate

**Estado actual:** Fase de **design documental cerrada** y fase **tasks habilitada por autorización explícita del usuario**.  
**Gate activo:** bloqueado el inicio de implementación de features hasta aprobar issue (`status:approved`) y autorización explícita por feature.

**Condición de avance:** seleccionar issue aprobado + autorización explícita del usuario para ese feature.

---

## 21. Tecnologías de Implementación (Baseline MVP)

Esta sección define el stack tecnológico oficial para implementar el MVP.  
La selección aquí documentada es vinculante para la fase de tasks y ejecución, salvo nueva aprobación explícita del usuario.

### 21.1 Backend
- **Runtime/Lenguaje:** Node.js + TypeScript.
- **Framework:** NestJS (HTTP adapter: Fastify).
- **Estilo arquitectónico:** Arquitectura Hexagonal (Ports & Adapters).
  - Regla: el dominio no depende de frameworks.
  - Regla: puertos en capa de aplicación/dominio y adaptadores en infraestructura.

### 21.2 Persistencia
- **Base de datos transaccional:** PostgreSQL.
- **ORM:** Prisma.

### 21.3 Frontend
- **Framework UI:** Next.js + React.
- **Lenguaje:** JavaScript/TypeScript.

### 21.4 Tiempo real
- **Protocolo/tecnología:** WebSockets con Socket.IO.
- Uso previsto: sincronización de comandas/estados/KDS/eventos operativos en vivo.

### 21.5 Seguridad y acceso
- **Contrato FE↔BE:** API Key (`X-API-Key: <api_key>`).
- **Implementación backend objetivo (NestJS):** validación de API Key + RBAC deny-by-default.
- **Compatibilidad declarada:** contrato único FE↔BE por API Key para fase actual.

### 21.6 Cache y mensajería interna
- **Redis:** habilitado en MVP para cache y soporte de colas/eventos internos según necesidad de implementación.

### 21.7 Entorno de desarrollo
- **Contenerización estándar:** Docker + Docker Compose.
- Alcance mínimo esperado: backend, frontend, PostgreSQL, Redis.

### 21.8 Calidad y pruebas
- **Estrategia obligatoria desde MVP:** unit + integración + e2e.
-- **Framework Test:** Vitest.
- **Cobertura:** obligatoria (coverage report).

### 21.9 Integración continua
- **CI desde MVP:** GitHub Actions.
- **Gate mínimo por PR:** ejecución automática de tests + cobertura.

### 21.10 Versionado y compatibilidad

| Componente | Versión objetivo (MVP) |
|---|---|
| Node.js | 24.x |
| NestJS | 11.x |
| Prisma | 7.x |
| PostgreSQL | 17.x |
| Next.js | 16.x |
| React | 19.x |
| Socket.IO | 4.8.x |
| Redis | 7.x |
| Vitest | 4.x |

Criterio de cierre del punto 21 cumplido: versiones objetivo fijadas para readiness pre-tasks.

### 21.11 Estructura objetivo monorepo

```txt
src/
  apps/
    web/
  packages/
    backend/
    data-access/
    shared-utils/
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

#### Responsabilidades por módulo

- `src/apps/web/`
  - Contiene la aplicación frontend (UI, rutas, estado de presentación, integración con API backend).
  - No debe contener lógica de negocio crítica ni acceso directo a base de datos.

- `src/packages/backend/`
  - Contiene la aplicación backend (NestJS + Fastify) con arquitectura hexagonal.
  - Debe incluir casos de uso, puertos, adaptadores, controladores y políticas de dominio del MVP.
  - Es la fuente de verdad de estados operativos, reglas de autorización e invariantes de negocio.

- `src/packages/data-access/`
  - Contiene persistencia y acceso a datos compartido (Prisma/schema, repositorios/adaptadores DB, migraciones, seeds).
  - No debe exponer reglas de negocio de aplicación; solo contratos e infraestructura de datos.

- `src/packages/shared-utils/`
  - Contiene utilidades transversales reutilizables entre apps/packages.
  - Debe alojar componentes agnósticos al dominio (config, constantes, logging, utilidades de transporte HTTP y tipos compartidos).

- `src/packages/shared-utils/src/config/`
  - Convenciones y helpers de configuración compartida (lectura/normalización de env, defaults seguros).

- `src/packages/shared-utils/src/constants/`
  - Constantes técnicas compartidas y códigos normalizados de uso común.

- `src/packages/shared-utils/src/logging/`
  - Facades/helpers de logging estructurado y correlación para frontend/backend según necesidad.

- `src/packages/shared-utils/src/transport/`
  - Utilidades de transporte de red compartidas:
    - `errors/`: tipado/mapeo de errores de transporte.
    - `request/`: wrappers de request/headers/reintentos.
    - `retry/`: políticas de retry/backoff.
    - `types/`: tipos de transporte compartidos.
    - `url/`: normalización y composición de URLs.

#### Regla de dependencias (enforcement)

1. `apps/*` puede depender de `packages/*`.
2. `packages/backend` puede depender de `packages/data-access` y `packages/shared-utils`.
3. `packages/data-access` puede depender de `packages/shared-utils`, pero no de `apps/*` ni de UI.
4. `packages/shared-utils` no debe depender de módulos de dominio (`backend`, `data-access`) para mantener reutilización.
