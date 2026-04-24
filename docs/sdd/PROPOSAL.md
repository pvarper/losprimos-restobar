# PROPOSAL — Alineación propose/spec para MVP operativo

**Versión:** 3.1  
**Fecha:** 2026-04-21  
**Estado:** Aprobación interna  
**Referencia:** PRD.md v2.2, SPEC.md v2.2

**Gate de gobernanza:** no avanzar a fase tasks sin autorización explícita del usuario.

---

## 1. Intent

Alinear la fase de **propuesta de producto/cambio** con una definición clara de valor de negocio (qué/por qué), separando este documento del diseño técnico detallado.

## 2. Objetivo

Definir el alcance y los criterios de éxito del MVP para que el restaurante pueda operar pedidos, cocina, cobro y reportes operativos con reglas de turno consistentes, control de pendientes de cobro para caja, experiencia multiusuario estable y requerimientos no funcionales medibles.

## 3. In Scope

- Operación interna por roles: mozo, cocina, caja y administración.
- CRUD básico de usuarios internos con asignación multirol (N:N usuario-rol) para administración operativa.
- Modelo RBAC flexible en MVP: relación N:N usuario-rol, permisos por vista/acción, permisos efectivos por unión de roles y política deny by default.
- CRUD básico de menú/categorías/subcategorías/platos para administración operativa del catálogo, con subcategoría obligatoriamente ligada a categoría activa y asignación de platos a categoría + subcategoría.
- Flujo MVP completo: abrir pedido → enviar a cocina → actualizar estados → cobrar → cerrar mesa.
- Capacidad de promociones en MVP: promoción individual por plato (vigencia por tiempo y/o cupo) y promociones combo.
- Regla comercial de promoción individual (MVP): cuando está vigente/aplicable, deshabilita precio base del plato y el mozo no puede seleccionarlo.
- Regla total de prioridad de promociones individuales (MVP): ante múltiples promociones aplicables para un plato, se elige menor precio final; empate por `created_at` más antiguo y luego menor `id`.
- Regla comercial de combo (MVP): el cliente elige entre platos por separado o combo; el mozo registra manualmente esa elección.
- Regla comercial integrada de pricing (MVP): el sistema resuelve primero la mejor promoción individual por plato y luego permite elección manual de combo o separado, con exclusión mutua por ítem/contexto.
- UX comercial de pricing (MVP): el sistema sugiere siempre promociones/combo elegibles antes de confirmar agregado/cambio de ítems.
- Trazabilidad comercial de pricing (MVP): registrar oferta/elegibilidad mostrada, opción elegida por cliente vía mozo y precio final aplicado.
- Stock operativo de platos en MVP: cupos/cantidad disponible por plato, parametrizable por turno y/o por día calendario.
- Regla de prioridad auditable para stock operativo en MVP: si coexisten configuración por turno y por día para un mismo plato/momento, prevalece la de turno.
- Definición de stock real del sistema en v1: stock de productos vendibles de catálogo (platos/bebidas), excluyendo explícitamente insumos/costos.
- Tope de stock operativo diario por producto ligado al stock real v1 del mismo producto.
- Gestión de turnos con regla de **un único turno activo a la vez**, con inicio/fin fecha-hora (admite cruce de medianoche).
- Definición formal de día operativo (MVP): el día operativo se identifica por la fecha de inicio del turno en `America/La_Paz`; turnos que cruzan medianoche siguen imputando a ese día operativo.
- Visibilidad en tiempo real para caja de mesas con cuenta/pedido pendiente de pago.
- En v1, billing registra estado de pago operativo (`pendiente`/`pagado`; `parcial` cuando existan pagos parciales) sin integración de métodos de pago externos.
- Reportes MVP explícitos: ventas por período (día/semana/mes), platos más pedidos, performance por mozo (según alcance vigente), estado de pago operativo y reporte de stock por producto (definido/vendido/saldo).
- Bloqueo de cierre de turno y de día operativo mientras exista al menos una mesa pendiente de pago.
- Colaboración de mozos sobre una misma mesa cuando existe pedido abierto.
- Concurrencia colaborativa explícita en mesa/comanda: dos o más mozos pueden operar en paralelo la misma comanda según permisos (agregar/cancelar ítems, cerrar pedido, cerrar mesa).
- Concurrencia transaccional en colisiones límite sobre operaciones críticas de una misma entidad objetivo: primero en confirmar aplica; operaciones concurrentes rezagadas se rechazan con conflicto y estado actualizado.
- Revalidación obligatoria al confirmar operaciones críticas de mesa/comanda/cierre para evitar condiciones de carrera.
- Invariantes de integridad operativa: prohibido stock negativo, saldo negativo y cierre operativo con pendientes.
- Auditoría específica de conflictos de concurrencia y de transiciones críticas con before/after.
- Restricción de turno para operación de comandas: solo mozos asignados al turno activo pueden abrir y operar comandas.
- Visibilidad en tiempo real de acciones de mozos hacia actores relevantes, mostrando también autor de cada acción.
- Trazabilidad total obligatoria de acciones operativas: quién, qué, cuándo y contexto (mesa/comanda/ítem), con before/after cuando corresponda.
- Contrato de autenticación de fase actual: FE↔BE con API Key en `X-API-Key`.
- La autenticación FE↔BE no usa access token en esta fase; se valida API Key activa y luego RBAC.
- La sesión de usuario interna se gestiona server-side (sin token de cliente) con vigencia/revocación independiente del contrato FE↔BE.
- Contrato explícito de errores 401 vs 403 y auditoría de denegaciones.
- **[Pendiente V2]** estrategia de identidad avanzada (si aplica).
- Registro/edición de mesa con capacidad entera > 0 y rechazo de valores inválidos.
- Reasignación de mesa activa por administración entre mozos con auditoría obligatoria.
- Asignación inicial de mozo al abrir comanda sin exclusividad operativa (mesa atendible por mozo inicial y/o cualquier mozo activo del turno según RBAC).
- Indicador de carga por mozo (mesas activas) con umbral de alerta configurable (default 4).
- KDS: retiro de pedido listo habilitado para cualquier mozo activo del turno, con autor de retiro auditado y propagación en tiempo real.
- KDS: indicador de tiempo transcurrido desde envío a cocina en tiempo real y persistencia de valor final al pasar a listo/retiro para reporte/auditoría.
- KDS: visibilidad de notas por ítem y cola de atención ordenada por antigüedad de forma estable/determinística.
- Reverso de pago con estado exacto de mesa: saldo post-reverso > 0 obliga `esperando_cuenta`; saldo 0 mantiene estado consistente de cierre (`libre` cuando corresponda).
- Asignación dinámica de mozos durante turno activo (alta/baja) con auditoría obligatoria.
- Modelo de comanda secuencial por mesa: no se permite un nuevo pedido mientras exista saldo pendiente del pedido anterior.
- Regla única de imputación de pagos parciales para MVP: FIFO por fecha-hora de ítems/comandas dentro de la mesa.
- Regla única de edición post-envío (MVP): en comanda enviada no hay edición in-place; los cambios se registran como deltas auditables.
- Reglas P0 de stock diario por turnos: distribución automática al habilitar turnos del día, ajuste manual administrativo con restricciones (tope diario y no quedar bajo lo vendido) y restitución por anulación de ítems en comanda abierta.
- Flujo mínimo de reverso/anulación de cobro (MVP): reverso por asiento compensatorio vinculado al pago original, con motivo obligatorio, auditoría y controles de integridad de cierre operativo.
- Estados cerrados y transiciones válidas para mesa/comanda en MVP, con bloqueos operativos explícitos ante deuda pendiente.
- Sincronización automática de cambios entre clientes y backend para evitar inconsistencias.
- Requisitos no funcionales críticos del MVP (SLA, disponibilidad objetivo, capacidad, seguridad, compatibilidad y observabilidad).
- Estándar monetario único del MVP (BOB, 2 decimales, redondeo half-up en total de línea y coherencia comanda/ticket/reportes).
- Explicitación textual de reglas ya cerradas (sin ampliar scope):
  - **Congelamiento de precio promocional por ítem:** el precio final aplicado al agregar el ítem queda fijo en la comanda y no se recalcula por cambios posteriores de promociones; solo cambia si el ítem se elimina y se vuelve a agregar.
  - **Timezone oficial de promociones:** toda evaluación de vigencias `desde`/`hasta` de promociones se realiza en `America/La_Paz`.
  - **Contrato FE↔BE por API Key:** las operaciones protegidas del cliente se autentican por `X-API-Key` y autorización RBAC en backend.
  - **Bloqueo de reverso en día operativo cerrado:** no se permite reversar/anular pagos cuando el día operativo ya está cerrado.

## 4. Out of Scope

- Funcionalidades explícitamente diferidas en PRD (ej.: mapa visual de salón, facturación fiscal, modo offline, descuentos/cortesías manuales generales, variantes/fotos de platos).
- Gestión de stock de insumos (insumos, compras y recetas por plato).
- Gestión de costos y reportes de rentabilidad asociados.
- Integraciones de métodos de pago (tarjetas/QR/factura/etc.) y desagregación de reportes por método de pago.
- Integraciones externas no necesarias para operar el MVP en red local.
- Estrategias avanzadas de observabilidad (dashboards y alertas centralizadas) más allá de logging estructurado inicial.
- Jerarquías de catálogo más profundas que subcategoría (sub-subcategorías o niveles adicionales).

## 5. Non-Goals

- No redefinir arquitectura interna ni stack tecnológico en esta propuesta.
- No introducir nuevos módulos fuera del core ya definido en PRD.
- No convertir este documento en diseño técnico de implementación.

## 6. Capacidades del MVP

1. **Auth:** autenticación interna con RBAC flexible (usuario multirol), autorización granular por vista/acción, deny by default, contrato FE↔BE por API Key (`X-API-Key`), sesión interna server-side y respuesta auditada 401/403.
2. **Turnos:** apertura/cierre por fecha-hora, un turno activo global, con continuidad aun cruzando medianoche y atribución formal a día operativo por fecha de inicio.
3. **Mesas y pedidos:** operación concurrente colaborativa por mesa entre mozos asignados al turno activo, control transaccional atómico en colisiones límite con revalidación al confirmar, visibilidad en tiempo real con autor visible, regla de una comanda abierta a la vez por mesa, capacidad de mesa válida (>0), asignación inicial de mozo no exclusiva y modificaciones post-envío sólo por deltas auditables.
4. **Cocina:** actualización de estados en tiempo real para actores relevantes, retiro de pedidos listos por cualquier mozo activo del turno, y trazabilidad de tiempo transcurrido desde envío a cocina.
5. **Billing:** generación/cierre de cuenta, pagos parciales, reverso/anulación mínima de pago con auditoría obligatoria, estado exacto post-reverso y bloqueo de cierre operativo con saldo pendiente.
6. **Reportes:** filtros operativos del MVP (turno, día calendario, mozo, categoría y franja horaria), con salidas mínimas obligatorias: ventas por período (día/semana/mes), platos más pedidos, performance por mozo, estado de pago operativo y reporte de stock por producto (definido/vendido/saldo).
7. **Promotions-Pricing:** promoción individual por plato (precio fijo o % descuento) con vigencia por tiempo y/o cupo, que deshabilita precio base mientras aplique y se selecciona por algoritmo total (menor precio final + desempates determinísticos); combos con elección manual por mozo según decisión del cliente y sugerencia previa obligatoria de opciones elegibles, evitando doble aplicación conflictiva en un mismo ítem/contexto.
8. **Stock operativo de platos:** configuración de cupos por plato con parametrización por turno y/o día calendario, consumo al agregar ítems y bloqueo al agotarse.
9. **Control de cierre operativo:** vista de pendientes de cobro en caja, bloqueo de cierre de turno/día con pendientes, validación de turnos del día operativo y bloqueo por reversos que reabran saldo.

### Catálogo P0 explícito (congelado para trazabilidad 1:1 con PRD/SPEC vigente)

1. **Usuarios internos:** CRUD básico de usuarios internos con asignación multirol (N:N usuario-rol).
2. **Menú/categorías/subcategorías/platos:** CRUD básico de categorías, subcategorías y platos del menú, con vínculo obligatorio subcategoría->categoría activa y asignación de plato a ambos niveles.
3. **Mesas (administración):** reasignación de mesa activa por admin entre mozos, con auditoría de origen/destino.
4. **Carga operativa de mozos:** indicador de mesas activas por mozo y umbral de alerta configurable (default 4).
5. **Notas por ítem en KDS:** registro de nota operativa por ítem y visualización en cocina.
6. **Cola KDS determinística:** orden por antigüedad (mayor tiempo de espera primero) de forma estable/determinística.
7. **Stock diario por turnos (MVP):** distribución automática inicial por turnos habilitados, ajuste manual con restricciones (tope diario y no quedar bajo lo vendido) y restitución de 1 unidad por anulación/eliminación de ítem en comanda abierta.

## 7. Supuestos y Restricciones

- Operación principal en red local del restaurante.
- Carga objetivo inicial: **forecast 15 TPS**.
- Objetivo operativo de disponibilidad para componentes desplegados: **99.9%**.
- Operaciones de usuario con SLA de respuesta **p95 ≤ 3s**.
- Compatibilidad web en últimas versiones estables de Firefox, Chrome, Safari y Edge.
- En esta fase se fija contrato FE↔BE por API Key; detalles de identidad avanzada se evaluarán en V2 si aplica.

## 8. Impacto por Rol

- **Mozo:** puede continuar atención de una mesa con pedido abierto aunque no haya iniciado la comanda original, siempre que esté asignado al turno activo y tenga permisos RBAC.
- **Cocina:** recibe estado actualizado en forma automática y consistente, evitando desfasajes entre pantallas.
- **Cajero:** cobra sobre estado vigente, visualiza en tiempo real mesas pendientes de cobro y evita cierres operativos con deuda abierta.
- **Administrador:** gobierna turnos por fecha-hora (incluyendo cruces de día), administra asignación de roles/permisos y solo puede cerrar turno/día cuando no quedan mesas pendientes.

## 9. Riesgos y Mitigación

1. **Riesgo:** ambigüedad operativa en turnos que cruzan medianoche.  
   **Mitigación:** regla única de turno activo por intervalo fecha-hora e invariantes explícitas en SPEC.

2. **Riesgo:** inconsistencias por concurrencia entre clientes/mozos sobre la misma comanda.  
   **Mitigación:** sincronización automática backend→clientes, propagación en tiempo real con autor visible, confirmación transaccional atómica por entidad objetivo, revalidación al confirmar y auditoría obligatoria por conflicto/acción/contexto.

3. **Riesgo:** degradación de experiencia en picos de carga.  
   **Mitigación:** NFR de p95 ≤ 3s y forecast 15 TPS con monitoreo de cumplimiento.

4. **Riesgo:** aplicación inconsistente de precios cuando existen múltiples promociones individuales activas y opciones combo para el mismo contexto comercial.  
   **Mitigación:** algoritmo total en SPEC (menor precio final + desempates determinísticos), sugerencia previa de opciones elegibles y trazabilidad de elegibilidad/elección/precio aplicado.

5. **Riesgo:** comportamiento no determinístico del stock operativo cuando coexisten reglas por turno y por día.  
   **Mitigación:** prioridad explícita y auditable (turno sobre día) y escenarios Given/When/Then en SPEC para validar consumo y bloqueo por agotamiento.

6. **Riesgo:** intento de cierre operativo con mesas pendientes (cierre incompleto de caja).  
   **Mitigación:** bloqueo transaccional del cierre con mensaje explícito y listado en tiempo real de mesas pendientes en caja.

7. **Riesgo:** autorización inconsistente entre frontend y backend por validaciones parciales en cliente.  
   **Mitigación:** enforcement de autorización exclusivamente en backend (fuente de verdad), deny by default y auditoría obligatoria por acción autorizada/denegada.

8. **Riesgo:** pérdida de integridad operativa por anulación de cobros sin controles (reapertura de deuda o alteración de cierres).  
   **Mitigación:** reverso por asiento compensatorio, motivo obligatorio, vínculo a pago original, bloqueo sobre día operativo cerrado y re-bloqueo automático de cierre cuando se reabra saldo.

## 10. Dependencias

- PRD actualizado con regla operativa de turnos y alcance MVP coherente.
- SPEC con requisitos funcionales/no funcionales testeables y escenarios Given/When/Then.
- Definición explícita del contrato FE↔BE por API Key y reglas 401/403.
- Definición de reglas de promociones vigentes por plato y combos (tipo, vigencia por tiempo/cupo, prioridad y elección manual) para evitar doble aplicación conflictiva.
- Definición explícita de algoritmo total de selección de promociones individuales (menor precio final + desempates).
- Definición de regla de prioridad de stock operativo (turno sobre día) y trazabilidad mínima de la regla aplicada.
- Definición explícita del concepto de "mesa pendiente de pago" para evaluación de bloqueo de cierre (turno/día) en tiempo real.
- Definición de secuencia de pedidos por mesa (cancelación total del pedido anterior antes de abrir uno nuevo) y tratamiento de pagos parciales.
- Definición de regla operativa de concurrencia colaborativa en mesa/comanda con permisos RBAC y autor visible en eventos en tiempo real.
- Definición de restricción por turno para apertura/operación de comandas (solo mozos asignados al turno activo).
- Definición de flujo de asignación dinámica de mozos durante turno activo y auditoría obligatoria de altas/bajas.
- Definición de asignación inicial de mozo al abrir comanda como dato auditable y no exclusivo en la operación del turno.
- Definición de regla KDS de retiro por cualquier mozo activo del turno con autor de retiro.
- Definición de métrica de tiempo KDS (desde envío a cocina) en tiempo real y persistencia de valor final para reportes.
- Definición de estado exacto de mesa posterior a reverso con before/after y saldo previo/posterior auditables.
- Definición explícita de stock real v1 y validación del tope stock operativo diario <= stock real por producto.
- Definición explícita de reglas de stock diario por turnos: distribución automática inicial, ajuste manual con restricciones y restitución por anulación de ítems.
- Definición de regla única de imputación FIFO para pagos parciales con impacto trazable en saldo/ticket/auditoría.
- Definición del flujo mínimo de reverso/anulación de cobro en MVP con auditoría e integridad.
- Catálogo cerrado de estados y transiciones válidas para mesa y comanda (incluyendo bloqueos).
- Definición operativa de matriz de permisos por rol con alcance por vista/acción para módulos MVP.
- Definición de esquema de auditoría de autorización/acciones (usuario, acción, contexto, fecha-hora) para trazabilidad homogénea.
- Matriz de trazabilidad PRD↔SPEC para capacidades críticas del MVP (requisito → RF → escenario GWT).
- Fuente de verdad para validación de NFR (p95, TPS, disponibilidad): `SPEC.md` sección `3.2 Protocolo único de medición NFR (aceptación)`.

## 11. Criterios de Éxito Medibles

- 100% de operaciones críticas de usuario dentro de **p95 ≤ 3s**.
- Cumplimiento del objetivo operativo de **99.9%** de disponibilidad en componentes desplegados, medido en **ventana mensual** (excluye mantenimientos programados comunicados).
- Operación estable a **15 TPS** sin pérdida de consistencia funcional.
- Cero ambigüedad en gestión de turnos (incluyendo cruce de medianoche) en pruebas de aceptación.
- Sincronización consistente entre actores en eventos de pedidos/cocina/caja.
- Precio aplicado correctamente cuando hay promoción vigente, con trazabilidad en cuenta/ticket en pruebas de aceptación.
- Selección de promoción individual determinística validada para casos con múltiples promociones vigentes (incluyendo desempates).
- Consumo y bloqueo de stock operativo por plato correctos en pruebas de aceptación, incluyendo coexistencia de configuración por turno y por día con prioridad determinística.
- Ninguna configuración de stock operativo diario aceptada por encima del stock real v1 del producto.
- Cero cierres de turno/día permitidos cuando existe al menos una mesa pendiente de pago.
- Cierre de turno/día habilitado correctamente al quedar todas las mesas pagadas del período.
- Reportes MVP operativos disponibles y validados en aceptación para: ventas por período (día/semana/mes), platos más pedidos, performance por mozo, estado de pago operativo y reporte de stock por producto (definido/vendido/saldo).
- Imputación de pagos parciales validada por FIFO y reflejada en saldo pendiente, ticket y auditoría en pruebas de aceptación.
- Reversos/anulaciones de pago ejecutados solo con motivo y auditoría obligatoria, sin violar integridad de cierres operativos.
- Transiciones de estados de mesa/comanda validadas contra catálogo cerrado, sin bypass de bloqueos por deuda.
- Cero operaciones protegidas ejecutadas sin permiso explícito (deny by default) en pruebas de autorización.
- Trazabilidad completa de autorización/acciones críticas con usuario, acción, contexto y timestamp.
- Cero operaciones de comanda ejecutadas por mozos no asignados al turno activo en pruebas de aceptación.
- 100% de acciones colaborativas de mesa/comanda propagadas en tiempo real con autor visible para actores relevantes.
- 100% de altas/bajas de asignación de mozos durante turno registradas en auditoría.
- 100% de colisiones concurrentes en operaciones críticas resueltas de forma determinística (primero confirma/aplica, resto conflicto auditado).
- 0 cierres de mesa/turno/día permitidos con saldo pendiente post-reverso o pendiente concurrente detectado en revalidación final.
- 100% de retiros KDS realizados por mozos activos del turno con autor de retiro trazable.
- Orden de cola KDS validado como determinístico por antigüedad en pruebas de aceptación.
- Distribución/ajuste/restitución de stock diario por turnos validados en aceptación sin violar tope diario ni cupo vendido por turno.

### Baseline y target iniciales (a validar en piloto)

- **Digitalización del flujo:** baseline actual en papel (medición inicial pendiente) → target MVP: **≥95%** de pedidos gestionados digitalmente en turno piloto.
- **Consistencia operativa:** baseline no instrumentado (medición inicial pendiente) → target MVP: **0 incidentes críticos** por desincronización entre salón/cocina/caja en turno piloto validado.
- **Adopción del equipo:** baseline no instrumentado (medición inicial pendiente) → target MVP: **≥90%** del personal operativo usando el sistema en lugar de papel durante la primera semana de operación controlada.

## 12. Rollout / Rollback funcional

### Rollout
- Activación gradual por módulo funcional del MVP (Auth → Turnos → Mesas/Pedidos → Cocina → Billing → Reportes).
- Validación por checklist de escenarios críticos definidos en SPEC.

### Rollback
- Si falla un criterio crítico (SLA, consistencia o regla de turnos), se revierte a operación del flujo previo estable del módulo afectado.
- Se preserva integridad transaccional y trazabilidad de auditoría en el retorno.
