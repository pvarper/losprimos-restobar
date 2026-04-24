# MVP Domain Rules (Normativo)

> **Tipo de documento:** Normativo.  
> Consolida reglas técnicas operativas del MVP para implementación backend/API, evitando ambigüedad entre módulos.

---

## 1) Alcance

Aplica a los flujos MVP de:
- Turnos y día operativo
- Mesas/comandas colaborativas
- Cocina (KDS)
- Billing/cobros/reversos
- Catálogo/promociones/stock operativo
- Reportes operativos

Fuentes normativas:
- [`../../PRD.md`](../../PRD.md)
- [`../../sdd/PROPOSAL.md`](../../sdd/PROPOSAL.md)
- [`../../sdd/SPEC.md`](../../sdd/SPEC.md)
- [`../../sdd/DESIGN.md`](../../sdd/DESIGN.md)
- [`../../sdd/TASKS.md`](../../sdd/TASKS.md)

---

## 2) Reglas transversales obligatorias

1. Backend como fuente de verdad para authz, estados e invariantes.
2. Arquitectura backend objetivo: NestJS + Fastify + enfoque hexagonal (Ports & Adapters).
3. Contrato FE↔BE en MVP por `X-API-Key` (sin access token FE↔BE en esta fase).
4. Errores canónicos obligatorios por contrato: `401`, `403`, `409`, `422` con code semántico.
5. TDD estricto (red → green → refactor) como estándar de entrega por feature.
6. Auditoría obligatoria en acciones críticas con actor, acción, contexto, timestamp y `before/after` cuando aplique.

Referencias:
- [`../architecture.md`](../architecture.md)
- [`../api/auth-and-consumption.md`](../api/auth-and-consumption.md)
- [`../api/canonical-errors.md`](../api/canonical-errors.md)
- [`../testing/testing-standard.md`](../testing/testing-standard.md)
- [`../api/traceability-rules.md`](../api/traceability-rules.md)

---

## 3) Turnos y día operativo

1. Debe existir un único turno activo global.
2. El turno se modela por fecha-hora de inicio/fin y puede cruzar medianoche.
3. Día operativo en `America/La_Paz`: se ancla a la fecha de inicio del turno.
4. Solo mozos asignados al turno activo pueden abrir/operar comandas.
5. Administración puede dar alta/baja dinámica de mozos durante turno activo con auditoría.
6. Cierre de turno/día bloqueado si existe alguna mesa pendiente de pago.
7. Antes de cerrar turno/día se exige revalidación final en tiempo real.

---

## 4) Mesas y comandas colaborativas

1. Estados cerrados de mesa: `libre`, `ocupada`, `esperando_cuenta`.
2. Estados cerrados de comanda: `abierta`, `enviada`, `cerrada`.
3. Solo transiciones válidas según catálogo de estados (sin bypass por atajo operativo).
4. Una sola comanda abierta por mesa y bloqueo de nueva comanda con saldo pendiente previo.
5. Operación colaborativa concurrente permitida entre mozos activos del turno con RBAC.
6. Colisiones críticas se resuelven atómicamente con regla `first-confirm-first-apply`.
7. Operaciones rezagadas por colisión se rechazan con `409 CONCURRENCY_CONFLICT` + estado actualizado.
8. En `enviada` no hay edición in-place de ítems enviados; solo deltas auditables.
9. Capacidad de mesa obligatoriamente entera y mayor a 0; rechazo explícito de inválidos.
10. Asignación inicial de mozo al abrir comanda es obligatoria pero no exclusiva.
11. Reasignación de mesa por administración debe dejar auditoría de origen/destino.
12. Indicador de carga por mozo (mesas activas) y umbral configurable (default 4).

---

## 5) Cocina (KDS) y tiempo real

1. KDS en tiempo real para pedidos pendientes.
2. Cola ordenada por antigüedad de espera (estable/determinística).
3. KDS debe exponer notas por ítem.
4. Cualquier mozo activo del turno puede retirar pedido listo (no depende del mozo inicial).
5. Cada evento KDS debe incluir autor visible y timestamp backend.
6. Debe persistirse tiempo transcurrido final al pasar a `listo` y al retiro para reportes/auditoría.

---

## 6) Billing, pagos parciales y reversos

1. Estado de pago operativo: `pendiente`, `parcial`, `pagado`.
2. Pagos parciales permitidos con imputación FIFO por fecha-hora de ítems/comandas de la mesa.
3. Ticket interno debe exponer trazabilidad de imputación (qué cubrió cada pago y saldo resultante).
4. Reverso/anulación en MVP se implementa como asiento compensatorio enlazado al pago original.
5. Motivo de reverso obligatorio y auditoría reforzada de saldos/estados before/after.
6. Si reverso deja saldo `> 0`, estado de mesa debe ser `esperando_cuenta`.
7. Si reverso deja saldo `= 0`, el estado debe mantenerse consistente con cierre (`libre` cuando corresponda).
8. Prohibido saldo negativo.
9. Prohibido reversar en día operativo ya cerrado.

---

## 7) Catálogo, promociones y stock operativo

### 7.1 Catálogo MVP obligatorio

1. MVP incluye CRUD de categorías.
2. MVP incluye CRUD de subcategorías.
3. Toda subcategoría debe pertenecer a una categoría activa.
4. Todo plato/producto debe asignarse obligatoriamente a categoría + subcategoría válidas.
5. Rechazos de validación de catálogo deben responder `422` con code semántico de contrato.

### 7.2 Pricing/promociones

1. Promoción individual por plato: precio fijo promocional o % descuento.
2. Vigencia por tiempo (`desde`/`hasta`) y/o cupo, evaluada en `America/La_Paz`.
3. Si hay múltiples promociones individuales aplicables: menor precio final, desempate por `created_at` más antiguo y luego menor `id`.
4. Bajo promoción individual vigente/aplicable, precio base queda deshabilitado para ese plato.
5. Combos con elección manual del cliente vía mozo.
6. Exclusión mutua por ítem/contexto entre promoción individual y combo.
7. Precio final del ítem queda congelado al agregar (no se recalcula luego).
8. Debe existir trazabilidad comercial de elegibilidad, opción elegida y precio final aplicado.

### 7.3 Stock operativo

1. Cupos por plato configurables por turno y/o día.
2. Prioridad determinística: configuración por turno prevalece sobre día.
3. Consumo de stock al agregar ítem y bloqueo por agotamiento.
4. Restitución de stock (1 unidad) al anular/eliminar ítem de comanda abierta.
5. En combos se consume stock de cada componente.
6. El stock operativo diario no puede superar stock real v1 del producto.
7. Distribución inicial por turnos habilitados y ajuste manual con restricciones (no superar tope ni quedar bajo vendido).

---

## 8) Estándar monetario MVP

1. Moneda oficial única: **BOB**.
2. Precisión obligatoria: **2 decimales**.
3. Política de redondeo: **half-up a 2 decimales**.
4. Redondeo en total de línea; subtotales/totales por suma de líneas ya redondeadas.
5. Coherencia obligatoria de montos entre comanda, ticket y reportes.

---

## 9) Reportes MVP obligatorios

Reportes mínimos:
1. Ventas por período (día/semana/mes).
2. Platos más pedidos.
3. Performance por mozo.
4. Estado de pago operativo.
5. Stock por producto (definido/vendido/saldo).

Filtros combinables mínimos:
- turno, día calendario, mozo, categoría, estado de pago operativo, franja horaria.

Regla operativa/calendario:
- Día operativo es la fuente de verdad para cierre, stock y atribución por turno.

---

## 10) Protocolo NFR de aceptación

1. p95 de latencia: `<= 3s`.
2. Capacidad objetivo: `15 TPS`.
3. Disponibilidad objetivo: `99.9%` (ventana mensual).
4. Evidencia mínima: reporte exportable de carga + reporte de disponibilidad + versión/entorno evaluados.

Referencia de fuente única:
- [`../../sdd/SPEC.md`](../../sdd/SPEC.md) §3.2

---

## 11) Gobernanza de cambios

1. Cambios funcionales primero en PRD/SDD (`PROPOSAL`, `SPEC`, `DESIGN`, `TASKS`).
2. Luego sincronización obligatoria de `technicals-requirements/**`.
3. Si cambia contrato API, actualizar también `backend-openapi.yaml` en el mismo ciclo del feature.
