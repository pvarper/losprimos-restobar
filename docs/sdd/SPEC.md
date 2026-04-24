# SPEC — Requisitos testeables del core MVP

**Versión:** 2.2  
**Fecha:** 2026-04-21  
**Estado:** Aprobación interna

**Gate de gobernanza:** no avanzar a fase tasks sin autorización explícita del usuario.  
**Gate de ejecución por feature:** no iniciar implementación de un feature sin issue en `status:approved` y autorización explícita del usuario para ese feature.

---

## 1. Reglas de dominio críticas (invariantes)

1. **Turno único activo:** el sistema permite un solo turno activo global a la vez.
2. **Modelo RBAC multirol:** un usuario puede tener múltiples roles simultáneamente (relación N:N usuario-rol).
3. **Permisos por vista/acción:** cada rol define permisos granulares por vista y acción (ejemplo pedidos/comanda: ver, crear/guardar, editar, cancelar ítem, enviar a cocina).
4. **Permisos efectivos por unión:** los permisos efectivos del usuario son la unión de permisos de todos sus roles activos.
5. **Deny by default:** toda vista/acción protegida sin permiso explícito debe rechazarse.
6. **Backend como fuente de verdad de autorización:** la decisión de acceso/acción se toma en backend; frontend solo refleja capacidades en UX.
7. **Auditoría de autorización/acciones:** toda decisión de autorización relevante y toda acción crítica ejecutada/denegada debe registrar usuario, acción, contexto y fecha-hora.
8. **Turno por intervalo fecha-hora:** un turno se define por `inicio` y `fin` con fecha-hora completa; puede cruzar medianoche (ej.: viernes 19:00 a sábado 03:00).
9. **Estados cerrados de mesa (MVP):** una mesa solo puede estar en `libre`, `ocupada` o `esperando_cuenta`.
10. **Transiciones válidas de mesa (MVP):** `libre -> ocupada`, `ocupada -> esperando_cuenta`, `esperando_cuenta -> libre`.
11. **Bloqueo de transición de mesa por deuda:** no se permite `esperando_cuenta -> libre` mientras exista saldo pendiente (`saldo_total > 0`).
12. **Estados cerrados de comanda (MVP):** una comanda solo puede estar en `abierta`, `enviada` o `cerrada`.
13. **Transiciones válidas de comanda (MVP):** `abierta -> enviada`, `abierta -> cerrada` (solo con saldo 0), `enviada -> cerrada` (solo con saldo 0).
14. **Secuencialidad de comandas por mesa:** una mesa solo puede tener una comanda abierta a la vez; no se permite abrir un nuevo pedido mientras exista saldo pendiente de la comanda anterior.
15. **Continuidad de atención:** si una mesa tiene un pedido abierto, cualquier mozo habilitado **y asignado al turno activo** puede continuar la atención.
16. **Auditoría de cambios:** toda modificación relevante de pedidos y estados operativos registra usuario y fecha-hora.
17. **Consistencia de estado:** ante un cambio confirmado en backend, todos los clientes conectados deben converger al mismo estado observable.
18. **Promoción única aplicable por ítem:** para un plato y fecha-hora dada, solo puede aplicarse una promoción vigente al agregar un ítem.
19. **Prioridad determinística de promoción:** si coexistieran configuraciones potencialmente aplicables para el mismo plato y momento, el sistema debe resolver con prioridad única y establecida y registrar cuál regla fue aplicada.
20. **Desempate de promociones por mismo precio final:** si dos promociones producen exactamente el mismo precio final, se aplica la de `created_at` más antigua; si persiste empate técnico, se aplica la de menor `id`.
21. **Congelamiento de precio promocional por ítem:** el precio final resuelto al agregar el ítem queda congelado en la comanda y no se recalcula por cambios posteriores de promociones; solo cambia si el ítem se elimina y se vuelve a agregar.
22. **Zona horaria oficial de vigencias:** las vigencias `desde`/`hasta` se evalúan en la zona horaria oficial `America/La_Paz`.
23. **Stock real del sistema (v1):** se define como existencia real de productos vendibles del catálogo (platos/bebidas); no incluye insumos ni costos.
24. **Stock operativo de platos en MVP:** cada plato puede tener cupo/cantidad disponible configurable para operación del turno y/o del día calendario.
25. **Consumo y bloqueo por agotamiento:** al agregar un ítem a comanda se consume 1 unidad del cupo operativo del plato; si el cupo llega a 0, no se permite seguir agregando ese plato.
26. **Prioridad de configuración de stock (determinística):** si coexisten configuración por turno y por día para el mismo plato/momento, prevalece la configuración por turno.
27. **Trazabilidad básica de stock:** cada consumo/bloqueo de stock operativo debe registrar qué configuración se aplicó (`turno` o `día`) y el saldo resultante.
28. **Ancla temporal del stock diario:** el stock operativo por día se vincula a la **fecha de inicio del turno**; un turno que cruza medianoche consume del día de su fecha de inicio.
29. **Tope diario global:** la suma de cupos operativos asignados a turnos de un mismo día para un producto no puede superar el stock operativo diario definido para ese producto.
30. **Ajuste administrativo controlado:** el administrador puede redistribuir cupos por turno, respetando tope diario global y sin dejar un turno por debajo de lo ya vendido.
31. **Vinculación con stock real v1:** el stock operativo diario por producto no puede exceder su stock real del sistema (v1).
32. **Visibilidad de pendientes para caja:** caja debe ver en tiempo real el conjunto de mesas con cuenta/pedido pendiente de pago en el período operativo vigente.
33. **Bloqueo de cierre con pendientes:** no se permite cerrar turno ni día operativo si existe al menos una mesa con saldo pendiente de pago.
34. **Habilitación de cierre sin pendientes:** el cierre de turno/día operativo solo se habilita cuando todas las mesas del período tienen estado de pago completo.
35. **Pagos parciales permitidos:** una comanda puede recibir pagos parciales, pero mantiene estado pendiente hasta cancelación total del saldo.
36. **Imputación de pagos parciales (MVP):** cada pago parcial se imputa con regla FIFO por fecha-hora de ítems/comandas dentro de la mesa (primero lo más antiguo).
37. **Trazabilidad de imputación de pagos:** cada pago parcial debe registrar contra qué ítems/comandas se imputó, saldo previo/saldo posterior y usuario/fecha-hora.
38. **Revalidación de cierre en tiempo real:** al confirmar cierre de turno o día operativo, el sistema debe revalidar pendientes en ese instante; si aparece un pendiente concurrente, el cierre se rechaza y se debe reintentar.
39. **Restitución de stock operativo por anulación:** si un ítem se elimina/anula de una comanda abierta, el sistema restituye 1 unidad al cupo operativo correspondiente y registra trazabilidad.
40. **Deshabilitación de precio base en promoción individual:** si una promoción individual de plato está vigente y aplicable, el precio base del plato queda deshabilitado para la operación.
41. **No selección manual de precio base bajo promoción individual:** mientras dure la vigencia/aplicabilidad de la promoción individual, el mozo no puede forzar el precio base del plato.
42. **Vigencia de promoción individual por tiempo o cupo:** la aplicabilidad de la promoción individual se determina por ventana temporal y/o cupo de platos promocionales disponible.
43. **Elección comercial manual para combo:** ante opción elegible de combo, la decisión entre comprar platos por separado o aplicar combo la toma el cliente y la registra manualmente el mozo.
44. **Sugerencia previa obligatoria de opciones elegibles:** antes de confirmar agregado/cambio de ítems, el sistema debe exponer al mozo las promociones individuales y combos elegibles.
45. **Trazabilidad comercial de pricing:** por cada decisión de precio/promoción/combo, se debe registrar oferta/elegibilidad mostrada, opción elegida por cliente vía mozo y precio final aplicado.
46. **Consumo de stock en combo por componentes:** al aplicar combo, el sistema consume stock operativo de cada componente del combo según su cantidad definida.
47. **No doble aplicación conflictiva por ítem:** en un mismo ítem/contexto comercial solo puede aplicarse una opción de pricing final entre: (a) promoción individual automática del plato o (b) combo elegido manualmente.
48. **Regla determinística de edición post-envío:** una comanda en estado `enviada` no admite edición in-place de ítems ya enviados; toda modificación debe registrarse como delta auditable (agregado de nuevo ítem o anulación explícita de ítem aún anulable según estado de cocina).
49. **Selección total de promoción individual por plato:** si hay múltiples promociones individuales vigentes/aplicables para un mismo plato y momento, se elige la de menor precio final; si hay empate de precio final, desempata `created_at` más antiguo y luego menor `id`.
50. **Determinismo entre promociones individuales y combo:** el sistema siempre calcula primero la mejor promoción individual por plato (regla del punto 49), muestra opciones elegibles (separado vs combos), y aplica en forma mutuamente excluyente la elección manual registrada por el mozo según decisión del cliente.
51. **Frontera formal de día operativo:** el día operativo se define en zona `America/La_Paz` y corresponde a una fecha operativa `D`; incluye operación de turnos cuyo `inicio` pertenece a `D`, aunque finalicen después de medianoche.
52. **Atribución consistente turno↔día operativo:** todo turno, venta, consumo de stock y pago queda imputado al día operativo de la fecha de inicio del turno al que pertenece.
53. **Precondición de cierre de día operativo:** para cerrar un día operativo deben cumplirse simultáneamente: (a) ausencia de mesas pendientes de pago y (b) turnos de ese día operativo cerrados.
54. **Reverso/anulación de cobro con asiento compensatorio:** la anulación de pago en MVP se ejecuta como reverso auditable enlazado al pago original; está prohibido borrar o sobrescribir pagos históricos.
55. **Integridad de reverso de pago:** un pago no puede reversarse más de su saldo reversible; toda anulación exige motivo obligatorio, usuario y fecha-hora, y si reabre saldo pendiente debe restablecer estado operativo pendiente e impedir cierre operativo hasta regularización.
56. **Moneda oficial del MVP:** toda operación monetaria del sistema debe expresarse en **BOB (Bolivianos)** como moneda oficial única.
57. **Precisión decimal monetaria:** todo monto monetario persistido y expuesto en MVP debe manejar precisión de **2 decimales**.
58. **Política de redondeo monetario:** cuando aplique redondeo, se debe usar regla **half-up a 2 decimales**.
59. **Punto de aplicación de redondeo:** el redondeo se aplica en el **total de línea de ítem** (precio unitario aplicado × cantidad, luego de promoción/descuento del ítem); subtotal y total se calculan sumando líneas ya redondeadas.
60. **Consistencia monetaria transversal:** comanda, ticket y reportes deben mostrar exactamente los mismos montos para una misma operación (sin recálculos divergentes por capa).
61. **Concurrencia colaborativa de comanda:** dos o más mozos asignados al turno activo pueden operar en paralelo la misma mesa/comanda, siempre respetando permisos RBAC y validaciones de estado/saldo.
62. **Restricción por turno para comandas:** solo mozos asignados al turno activo pueden abrir y operar comandas; cualquier intento de mozo no asignado debe rechazarse y auditarse.
63. **Visibilidad en tiempo real con autor visible:** toda acción de mozo sobre mesa/comanda/ítem debe propagarse en tiempo real a los actores relevantes mostrando identidad del autor.
64. **Trazabilidad total obligatoria:** toda acción operativa debe registrar quién, qué, cuándo y contexto (mesa/comanda/ítem), incluyendo before/after cuando aplique.
65. **Asignación dinámica de mozos por turno:** durante un turno activo, administración puede agregar/quitar mozos asignados y cada cambio debe quedar auditado.
66. **Atomicidad de operaciones críticas por entidad objetivo:** en colisiones concurrentes sobre la misma mesa/comanda/cierre aplica "primero en confirmar, primero en aplicar" y el resto se rechaza con conflicto y estado actualizado.
67. **Revalidación obligatoria al confirmar:** antes de confirmar operaciones críticas (cierre, reverso, transición de estado, actualización concurrente), el backend debe revalidar precondiciones con estado vigente.
68. **No saldo negativo:** ninguna operación de billing puede dejar saldo de mesa/comanda menor a 0.
69. **No stock negativo:** ninguna operación de consumo/restitución puede dejar stock operativo menor a 0.
70. **No cierre con pendientes:** mesa/turno/día no pueden cerrarse si existe saldo pendiente > 0 en su alcance.
71. **Contrato FE↔BE de autenticación (fase actual):** operaciones protegidas requieren API Key en header `X-API-Key`.
72. **Validez de API Key:** toda API Key usada en endpoints protegidos debe existir y estar activa.
73. **Sin access token FE↔BE en fase actual:** no forma parte del contrato de autenticación del MVP.
74. **Rotación/revocación de API Key:** el backend debe poder invalidar API keys para denegar acceso posterior.
75. **Autenticación + autorización:** API Key válida autentica; RBAC define permisos efectivos por acción.
76. **Estado exacto post-reverso:** reverso con saldo post > 0 obliga estado de mesa `esperando_cuenta`; con saldo post = 0 mantiene estado consistente de cierre (`libre` cuando corresponda).
77. **Trazabilidad de autenticación por API Key:** toda denegación/autorización relevante por credencial debe auditarse.
78. **Sesión interna server-side:** el sistema mantiene sesión operativa interna de usuario en backend, sin exponer token de autenticación FE↔BE al cliente.
79. **Ciclo de vida de sesión interna:** la sesión interna debe soportar expiración y revocación explícita, con auditoría de denegación cuando su estado invalida una operación protegida.

---

## 2. Requisitos funcionales por capacidad

### 2.1 Auth

- RF-AUTH-01: El sistema debe autenticar usuarios internos del restaurante con credenciales válidas.
- RF-AUTH-02: El sistema debe permitir asignar múltiples roles por usuario (modelo N:N usuario-rol).
- RF-AUTH-03: El sistema debe autorizar acceso a vistas y acciones con permisos granulares por rol (por vista/acción).
- RF-AUTH-04: Los permisos efectivos de un usuario deben calcularse como la unión de permisos de todos sus roles.
- RF-AUTH-05: Toda operación protegida sin permiso explícito debe ser rechazada (deny by default).
- RF-AUTH-06: El backend debe ser la fuente de verdad para autorización; el frontend solo puede reflejar/habilitar UX según permisos efectivos recibidos.
- RF-AUTH-07: Toda autorización relevante y toda acción protegida ejecutada/denegada debe registrar auditoría con usuario, acción, contexto y fecha-hora.
- RF-AUTH-08: El backend REST debe validar API Key para acceso FE↔BE en endpoints protegidos.
- RF-AUTH-09: El cliente debe enviar API Key en `X-API-Key: <api_key>` en cada operación protegida.
- RF-AUTH-10: El módulo de administración debe permitir CRUD básico de usuarios internos (crear, listar, actualizar, desactivar), con asignación de uno o más roles por usuario.
- RF-AUTH-11: El backend debe permitir gestión de API Key (alta, activación/desactivación, revocación) para consumidores internos autorizados.
- RF-AUTH-12: Si la API Key está ausente, inválida o revocada, el sistema debe responder 401 y auditar denegación.
- RF-AUTH-13: La rotación/revocación de API Key debe invalidar uso posterior de la credencial anterior.
- RF-AUTH-14: El contrato de errores de autenticación/autorización debe distinguir y auditar 401 (API Key inválida/ausente) vs 403 (autenticado sin permiso).
- RF-AUTH-15: La validación de API Key debe mantenerse desacoplada del cálculo RBAC de permisos efectivos.
- RF-AUTH-16: El backend debe gestionar sesión interna server-side para usuarios internos autenticados, independiente del contrato FE↔BE por API Key.
- RF-AUTH-17: Si la sesión interna está expirada o revocada, el sistema debe responder 401 y auditar la denegación.

#### 2.1.1 Mini-matriz de contrato de errores (RF críticos)

| Caso crítico | RF de referencia | HTTP | code semántico |
|---|---|---|---|
| Transición/estado inválido de mesa/comanda | RF-MES-06, RF-MES-07, RF-MES-08 | `422` | `STATE_INVALID` |
| Stock insuficiente o agotado al operar comanda | RF-STK-01, RF-STK-02, RF-STK-03 | `409` | `STOCK_CONFLICT` |
| Colisión concurrente al confirmar operación crítica (mesa/comanda/cierre) | RF-MES-22, RF-MES-23, RF-TUR-05 | `409` | `CONCURRENCY_CONFLICT` |
| Bloqueo de cierre por pendientes o precondición de cierre no cumplida | RF-TUR-05, RF-DIA-01, RF-DIA-05 | `409` | `CLOSURE_BLOCKED` |
| No autenticado (API Key ausente/inválida/revocada) | RF-AUTH-08, RF-AUTH-12, RF-AUTH-13, RF-AUTH-14 | `401` | `AUTH_UNAUTHENTICATED` |
| Autenticado sin permiso RBAC explícito | RF-AUTH-03, RF-AUTH-05, RF-AUTH-14 | `403` | `AUTH_FORBIDDEN` |

#### 2.1.2 Matriz RBAC MVP operativa (rol × vista × acción)

| Rol \ Vista | Usuarios | Menú/Platos/Categorías | Mesas/Comandas | KDS Cocina | Caja/Billing | Turnos | Reportes |
|---|---|---|---|---|---|---|---|
| **Administrador** | ver, crear, editar, desactivar, asignar roles | ver, crear, editar, desactivar | ver, reasignar mesa, auditar cambios | ver | ver | abrir, cerrar | ver |
| **Mozo** | sin acceso | ver | ver, crear comanda, editar comanda, agregar/quitar ítem, enviar a cocina, agregar nota por ítem, cerrar pedido/comanda, cerrar mesa (solo con precondiciones operativas de saldo/estado y turno activo) | ver (solo seguimiento) | ver (solo estado de mesa/cuenta) | sin acceso | sin acceso |
| **Cocina** | sin acceso | ver (solo lectura operativa) | ver (solo lectura operativa) | ver, marcar en preparación, marcar listo | sin acceso | sin acceso | sin acceso |
| **Cajero** | sin acceso | ver (solo lectura) | ver (solo lectura operativa) | ver (solo lectura) | ver, generar cuenta, registrar pago, reversar pago (con motivo) | sin acceso | ver |

### 2.2 Turnos

- RF-TUR-01: Debe existir operación de apertura y cierre manual de turno.
- RF-TUR-02: No se puede abrir un nuevo turno mientras exista otro turno activo.
- RF-TUR-03: El cierre de turno debe registrar fecha-hora efectiva de cierre.
- RF-TUR-04: El modelo de turno no depende de día calendario; admite intervalos cruzando medianoche.
- RF-TUR-05: El sistema debe bloquear el cierre de turno si existe al menos una mesa con cuenta/pedido pendiente de pago en ese turno.
- RF-TUR-06: Si no existen mesas pendientes de pago en el turno activo, el sistema debe habilitar y permitir el cierre de turno.
- RF-TUR-07: El administrador debe poder agregar mozos al turno activo durante la operación, dejando auditoría de alta (quién, cuándo y contexto de turno).
- RF-TUR-08: El administrador debe poder quitar mozos del turno activo durante la operación, dejando auditoría de baja (quién, cuándo y contexto de turno).
- RF-TUR-09: Toda operación de apertura/edición de comanda debe validar que el mozo actor esté asignado al turno activo; de no estarlo, debe rechazarse y auditarse.

### 2.3 Mesas / Pedidos

- RF-MES-01: Se debe poder abrir pedido para una mesa con estado operativo de mesa actualizado.
- RF-MES-02: Solo se permite una comanda abierta por mesa; no se puede abrir una nueva comanda mientras exista saldo pendiente en la comanda anterior.
- RF-MES-03: Se debe permitir agregar, quitar y modificar ítems en cada comanda abierta.
- RF-MES-04: Si una mesa tiene pedido abierto, cualquier mozo **asignado al turno activo** y con permisos RBAC puede continuar su atención.
- RF-MES-05: Toda modificación post-envío debe quedar en bitácora de auditoría.
- RF-MES-06: El sistema debe implementar estados cerrados de mesa (`libre`, `ocupada`, `esperando_cuenta`) y rechazar estados fuera de catálogo.
- RF-MES-07: El sistema debe implementar estados cerrados de comanda (`abierta`, `enviada`, `cerrada`) y rechazar estados fuera de catálogo.
- RF-MES-08: El sistema debe validar únicamente transiciones permitidas de mesa y comanda según invariantes del dominio.
- RF-MES-09: Debe bloquearse cualquier intento de abrir nueva comanda en una mesa con saldo pendiente total mayor a 0.
- RF-MES-10: En comanda `enviada`, la modificación debe procesarse como delta auditable (agregar nuevo ítem o anular ítem anulable), sin edición in-place de ítems ya enviados.
- RF-MES-11: El administrador debe poder reasignar una mesa activa a otro mozo, registrando auditoría de origen/destino y fecha-hora.
- RF-MES-12: El sistema debe exponer indicador de carga por mozo (cantidad de mesas activas) y alerta cuando supere umbral configurable (default: 4).
- RF-MES-13: El sistema debe permitir registrar notas por ítem de comanda y conservarlas durante todo el flujo operativo hasta cocina/ticket/auditoría.
- RF-MES-14: El sistema debe permitir operación colaborativa concurrente de dos o más mozos sobre la misma mesa/comanda (agregar/cancelar ítems, cerrar pedido, cerrar mesa) respetando permisos RBAC y reglas operativas de saldo/estado.
- RF-MES-15: Toda acción colaborativa sobre mesa/comanda/ítem debe propagarse en tiempo real a mozos y actores relevantes sin refresco manual.
- RF-MES-16: En cada evento en tiempo real de acción colaborativa, el sistema debe exponer explícitamente el autor de la acción.
- RF-MES-17: Toda acción operativa de mesa/comanda/ítem debe registrar auditoría completa con quién, qué, cuándo, contexto y before/after cuando aplique.
- RF-MES-18: El alta y edición de mesa debe validar capacidad entera mayor a 0 y rechazar valores nulos/no enteros/<=0.
- RF-MES-19: Toda alta/edición de mesa y cambio de capacidad debe registrar auditoría con before/after.
- RF-MES-20: Al abrir una comanda, el sistema debe registrar asignación inicial de mozo a mesa/comanda.
- RF-MES-21: La asignación inicial de mozo no bloquea operación colaborativa: cualquier mozo activo del turno con permisos RBAC puede operar la mesa/comanda.
- RF-MES-22: En colisiones concurrentes sobre la misma entidad operativa (mesa/comanda), la confirmación debe ser atómica: primera confirmación aplica, las siguientes se rechazan por conflicto con estado actualizado.
- RF-MES-23: Los rechazos por conflicto concurrente deben auditar actor, operación, entidad, before/after y motivo.
- RF-MES-24: El administrador debe poder consultar historial de cambios de pedidos/comandas/ítems con filtros combinables mínimos por mesa, comanda, rango de fecha-hora y actor.
- RF-MES-25: La consulta de historial para administración debe devolver resultados en orden cronológico ascendente e incluir detalle `before/after` cuando aplique mutación de estado o dato.

### 2.4 Cocina

- RF-KDS-01: Cocina debe visualizar pedidos/comandas pendientes en tiempo real.
- RF-KDS-02: Se debe poder actualizar estado de ítems (ej.: en preparación, listo).
- RF-KDS-03: Los cambios de estado deben propagarse automáticamente a mozos/caja/admin sin refresco manual.
- RF-KDS-04: La cola KDS debe ordenarse por antigüedad (mayor tiempo de espera primero) de forma estable y determinística.
- RF-KDS-05: KDS debe mostrar notas por ítem cuando existan (ej.: "sin sal", "término medio").
- RF-KDS-06: Un pedido/ítem en estado listo puede ser retirado por cualquier mozo activo del turno, independientemente del mozo que abrió la comanda.
- RF-KDS-07: KDS debe mostrar en tiempo real el tiempo transcurrido desde envío a cocina.
- RF-KDS-08: Al pasar a `listo` y al registrar `retiro`, el sistema debe persistir el valor final de tiempo transcurrido para reportes/auditoría, junto con autor del retiro.

### 2.5 Billing

- RF-BIL-01: Debe generarse cuenta de una mesa a partir de comandas asociadas.
- RF-BIL-02: Debe registrarse estado de pago operativo (`pendiente`/`pagado`; `parcial` cuando existan pagos parciales) y cierre de cuenta.
- RF-BIL-03: Al cerrar cuenta, la mesa debe transicionar a estado libre.
- RF-BIL-04: Caja debe visualizar en tiempo real la lista de mesas con cuenta/pedido pendiente de pago.
- RF-BIL-05: Se deben permitir pagos parciales sobre la cuenta de una mesa, registrando monto y fecha-hora con actualización consistente del estado de pago operativo.
- RF-BIL-06: Una mesa se considera pendiente de pago mientras su saldo total sea mayor a 0; solo con saldo 0 puede cerrarse la cuenta y habilitar cierre operativo.
- RF-BIL-07: Todo pago parcial debe imputarse por regla FIFO (fecha-hora ascendente de ítems/comandas de la mesa) sin intervención manual en MVP.
- RF-BIL-08: La emisión de ticket interno debe incluir trazabilidad de imputación de pagos parciales (pago, ítems/comandas alcanzados, parcial/total y saldo restante).
- RF-BIL-09: La auditoría de billing debe registrar por cada pago parcial: saldo previo, saldo posterior, criterio FIFO aplicado, usuario y fecha-hora.
- RF-BIL-10: El sistema debe permitir reverso/anulación de un pago registrado en MVP mediante asiento compensatorio enlazado al pago original, sin borrado físico del movimiento original.
- RF-BIL-11: Todo reverso/anulación de pago debe exigir motivo obligatorio y registrar auditoría con usuario, fecha-hora, pago original y saldo previo/posterior.
- RF-BIL-12: Si un reverso reabre saldo pendiente de una mesa, la mesa debe volver a estado pendiente y el sistema debe bloquear cierre de turno/día hasta regularización.
- RF-BIL-13: Si el reverso deja saldo posterior mayor a 0, la mesa debe pasar obligatoriamente a estado `esperando_cuenta`.
- RF-BIL-14: Si el reverso deja saldo posterior en 0, el estado de mesa debe permanecer consistente con cierre (`libre` cuando corresponda por flujo operativo).
- RF-BIL-15: Toda operación de reverso debe auditar before/after de estado de mesa y saldo previo/posterior.
- RF-BIL-16: El sistema debe rechazar cualquier operación de pago/reverso que produzca saldo negativo.

### 2.6 Reportes

- RF-REP-01: Se deben emitir reportes filtrables por turno.
- RF-REP-02: Se deben permitir filtros combinables del MVP (turno, día calendario, mozo, categoría, estado de pago operativo y franja horaria).
- RF-REP-03: Los reportes deben respetar cortes por intervalos fecha-hora de turno, incluso si cruzan medianoche.
- RF-REP-04: Los reportes por día operativo deben imputar la operación al día de inicio del turno, aunque existan eventos luego de medianoche.
- RF-REP-05: Debe existir reporte de stock por producto con columnas mínimas: stock definido, stock vendido y stock saldo del período consultado.
- RF-REP-06: Debe existir reporte de ventas por período con granularidad mínima día/semana/mes.
- RF-REP-07: Debe existir reporte de platos más pedidos para el período consultado.
- RF-REP-08: Debe existir reporte de performance por mozo según alcance vigente (mínimo: mesas atendidas y tiempo de retiro de pedidos listos).
- RF-REP-09: Debe existir reporte de estado de pago operativo de mesas/cuentas con al menos `pagado`, `pendiente` y `parcial` cuando corresponda por pagos parciales.
- RF-REP-10: En MVP no se debe exigir integración ni desagregación de reportes por método de pago; dicha capacidad queda diferida a V2.
- RF-REP-11: Cuando coexistan vistas por `día calendario` y por `día operativo`, la vista de día operativo prevalece como fuente de verdad operativa (cierre/stock/atribución por turno) y la vista de día calendario se usa con finalidad analítica.

### 2.7 Promociones y precios promocionales

- RF-PRM-01: Se debe poder crear, editar y activar/desactivar promociones por plato.
- RF-PRM-02: Toda promoción debe definir vigencia con fecha-hora `desde` y `hasta`, evaluada en la zona horaria oficial `America/La_Paz`.
- RF-PRM-03: El tipo de promoción permitido para MVP debe ser: (a) precio fijo promocional o (b) porcentaje de descuento sobre precio base del plato.
- RF-PRM-04: Al agregar un ítem a una comanda, el sistema debe resolver primero la mejor promoción individual vigente/aplicable del plato (menor precio final; desempate por `created_at` más antiguo y luego menor `id`) siempre que para ese ítem no se haya registrado elección manual de combo; si no hay promoción vigente/aplicable, debe aplicar precio base.
- RF-PRM-05: El motor comercial debe exponer opciones elegibles de pricing (platos por separado con promoción individual resuelta o precio base, y combos elegibles) para que el mozo registre la elección del cliente en forma mutuamente excluyente por ítem/contexto.
- RF-PRM-06: El precio final del ítem queda congelado al momento de agregarse a la comanda y no se recalcula por cambios posteriores de promociones.
- RF-PRM-07: El sistema debe registrar en cuenta/ticket la trazabilidad de la promoción aplicada por ítem (identificador o nombre de promoción, tipo y valor aplicado, precio final resultante).
- RF-PRM-08: Si una promoción individual de plato está vigente y aplicable, el sistema debe deshabilitar el precio base para ese plato en la operación de agregado/cambio de ítems.
- RF-PRM-09: Mientras una promoción individual esté vigente/aplicable, el mozo no debe poder seleccionar manualmente precio base para ese plato.
- RF-PRM-10: La promoción individual debe soportar vigencia por tiempo (`desde`/`hasta`) y/o por cupo de platos promocionales; al agotarse cupo o vencer tiempo deja de aplicar.
- RF-PRM-11: El sistema debe permitir definir combos con componentes y precio combo, coexistiendo con la compra de platos por separado.
- RF-PRM-12: Cuando un combo sea elegible, el sistema debe permitir que el mozo registre manualmente la opción elegida por el cliente (combo o platos por separado), dejando esa selección como mutuamente excluyente con promoción individual para el mismo ítem/contexto.
- RF-PRM-13: Antes de confirmar agregado/cambio de ítems, el sistema debe sugerir al mozo todas las promociones individuales y combos elegibles.
- RF-PRM-14: La auditoría comercial de pricing debe registrar oferta/elegibilidad mostrada, opción elegida por cliente vía mozo y precio final aplicado.
- RF-PRM-15: El sistema debe impedir doble aplicación conflictiva de pricing en un mismo ítem: no puede aplicar simultáneamente promoción individual y precio combo.

### 2.8 Stock operativo de platos (MVP)

- RF-STK-00: El sistema debe gestionar **día operativo** y **turnos habilitados** por día antes de iniciar operación.
- RF-STK-01: Se debe poder configurar cupo/cantidad disponible por plato para un turno específico.
- RF-STK-02: Se debe poder configurar cupo/cantidad disponible por plato para un día calendario específico.
- RF-STK-03: Al agregar un ítem a una comanda, el sistema debe consumir 1 unidad del cupo operativo aplicable del plato.
- RF-STK-04: Si el cupo operativo aplicable de un plato está agotado (0), el sistema debe bloquear el agregado de nuevos ítems de ese plato.
- RF-STK-05: Si existen configuraciones simultáneas por turno y por día para el mismo plato/momento, el sistema debe aplicar prioridad de turno sobre día.
- RF-STK-06: El sistema debe registrar trazabilidad básica por evento de stock operativo (plato, regla aplicada: `turno`/`día`, saldo resultante, usuario y fecha-hora).
- RF-STK-07: Al habilitar un día operativo con N turnos habilitados, el sistema debe distribuir automáticamente el stock diario por producto en partes iguales entre esos turnos.
- RF-STK-08: Si el día operativo tiene un único turno habilitado, ese turno debe recibir el 100% del stock diario por producto.
- RF-STK-09: El administrador debe poder ajustar manualmente la distribución por turnos del stock diario por producto.
- RF-STK-10: El sistema debe rechazar ajustes que hagan que la suma de cupos por turno supere el stock diario definido del producto.
- RF-STK-11: El sistema debe rechazar ajustes que dejen el cupo de un turno por debajo de lo ya vendido en ese turno.
- RF-STK-12: El sistema debe exponer consulta/reporte por producto con: stock diario definido, vendido por turno, saldo por turno y saldo diario remanente.
- RF-STK-13: Si un ítem de comanda abierta se elimina o anula, el sistema debe restituir 1 unidad al cupo operativo aplicado originalmente y registrar auditoría del ajuste.
- RF-STK-14: El stock diario operativo por producto debe validarse contra el stock real del sistema (v1) del mismo producto; si lo supera, la configuración debe rechazarse.
- RF-STK-15: Al aplicar un combo, el sistema debe consumir stock operativo de cada componente del combo en las cantidades definidas; en promociones individuales el consumo se mantiene normal por ítem.
- RF-STK-16: Todo consumo/restitución de stock diario debe imputarse al día operativo determinado por la fecha de inicio del turno, aun cuando el evento ocurra luego de medianoche.

### 2.9 Cierre de día operativo

- RF-DIA-01: El sistema debe bloquear el cierre de día operativo si existe al menos una mesa con cuenta/pedido pendiente de pago dentro del día operativo.
- RF-DIA-02: El sistema debe permitir el cierre de día operativo cuando no existan mesas pendientes de pago en el día operativo.
- RF-DIA-03: Ante bloqueo de cierre (turno o día), el sistema debe informar causa y listado de mesas pendientes para resolución operativa.
- RF-DIA-04: Al confirmar cierre de turno o día operativo, el sistema debe ejecutar una revalidación final en tiempo real de pendientes; si detecta cambios concurrentes, debe rechazar el cierre con mensaje de reintento.
- RF-DIA-05: El cierre de día operativo debe validar explícitamente que todos los turnos atribuidos a ese día operativo estén cerrados.
- RF-DIA-06: No se permite reversar/anular pagos de un día operativo ya cerrado.

### 2.10 Gestión de menú/platos/categorías/subcategorías

- RF-MNU-01: El módulo de administración debe permitir CRUD básico de categorías de menú (crear, listar, actualizar, desactivar).
- RF-MNU-02: El módulo de administración debe permitir CRUD básico de platos (crear, listar, actualizar, desactivar) incluyendo nombre, descripción, precio y categoría.
- RF-MNU-03: El módulo de administración debe permitir CRUD básico de subcategorías de menú (crear, listar, actualizar, desactivar).
- RF-MNU-04: Toda subcategoría creada/actualizada debe referenciar obligatoriamente una categoría activa; si falta categoría o está inactiva, el sistema debe rechazar con `422` por validación.
- RF-MNU-05: La alta/edición de plato debe exigir asignación válida de categoría y subcategoría; si la subcategoría es inválida/inexistente/inactiva o no pertenece a la categoría indicada, el sistema debe rechazar con `422` por validación.

### 2.11 Estándar monetario MVP

- RF-MON-01: La moneda oficial única del MVP es BOB (Bolivianos) y debe exponerse consistentemente en todos los contratos de API y vistas internas.
- RF-MON-02: Todo monto monetario debe almacenarse y exponerse con precisión de 2 decimales.
- RF-MON-03: La política de redondeo para MVP es half-up a 2 decimales.
- RF-MON-04: El redondeo se aplica en el total de línea de ítem; subtotal y total se obtienen por suma de líneas redondeadas, sin recalcular reglas distintas por pantalla.
- RF-MON-05: Comanda, ticket interno y reportes deben mantener coherencia obligatoria de montos para una misma operación monetaria.

---

## 3. Requisitos no funcionales (NFR)

1. **NFR-01 Performance (SLA):** El tiempo de respuesta de operaciones de usuario debe cumplir **p95 ≤ 3 segundos**.
2. **NFR-02 Disponibilidad objetivo:** Los componentes desplegados del MVP deben apuntar a **99.9%** de disponibilidad operativa.
3. **NFR-03 Capacidad esperada:** El sistema debe sostener un forecast de **15 TPS** en condiciones operativas objetivo.
4. **NFR-04 Contrato FE↔BE de autenticación:** API Key en header `X-API-Key` para operaciones protegidas.
5. **NFR-05 Consistencia:** Todo cambio confirmado en backend debe actualizar automáticamente a todos los actores para evitar inconsistencias cliente↔backend y entre clientes.
6. **NFR-06 Seguridad de autenticación/autorización:** autenticación FE↔BE por API Key + autorización RBAC, con reglas explícitas y auditables de respuesta 401 vs 403.
7. **NFR-07 Compatibilidad web:** Soporte en últimas versiones estables de **Firefox, Chrome, Safari y Edge**.
8. **NFR-08 Observabilidad:** Logging estructurado disponible desde día 1; evolución posterior prevista a Grafana/Loki para centralización y análisis.
9. **NFR-09 Gobernanza de ingeniería:** Estándares de Clean Code, Principios SOLID, DRY(Don't Repeat Yourself),TDD, Manejo de Errores, Uso de Interfaces/Types, Diseño Modular, Estructura MonoRepo y Arquitectura Hexagonal aplican como criterio de ingeniería/design governance, no como requisito funcional de producto.
10. **NFR-10 Tiempo real colaborativo:** Los eventos operativos de mesa/comanda deben propagarse a actores relevantes en tiempo real incluyendo metadato de autor, sin requerir refresco manual.
11. **NFR-11 Auditabilidad operativa:** El sistema debe persistir auditoría completa por acción operativa con campos mínimos de actor, acción, timestamp, contexto y before/after cuando exista mutación de estado/dato.
12. **NFR-12 Gestión de credenciales API:** la rotación/revocación de API Key debe propagarse sin ambigüedad para impedir acceso con credenciales invalidadas.
13. **NFR-13 Responsividad por dispositivo/rol (operación interna):** la UX del MVP debe mantenerse usable y legible según contexto operativo principal por rol: **mozo** en móvil/tablet/iPad, **cocina** en pantalla grande/monitor, y **caja/admin** en PC.

### 3.1 Referencia informativa de KPIs de adopción/piloto (no bloqueante)

> Esta sección es **solo de trazabilidad** con PROPOSAL y **no define requisitos técnicos duros ni criterio de rechazo de implementación**.

- Digitalización del flujo en piloto: referencia de target **≥95%** de pedidos gestionados digitalmente.
- Consistencia operativa en piloto: referencia de target **0 incidentes críticos** por desincronización salón/cocina/caja.
- Adopción del equipo en piloto: referencia de target **≥90%** de personal operativo usando el sistema durante la primera semana controlada.

### 3.2 Protocolo único de medición NFR (aceptación)

- **Qué se mide:** latencia **p95** (NFR-01), capacidad sostenida **15 TPS** (NFR-03) y disponibilidad **99.9%** (NFR-02).
- **Ventana/entorno:**
  - p95 + TPS: prueba de carga en entorno preproducción representativo, ventana mínima continua de 30 minutos.
  - disponibilidad: ventana mensual sobre entorno productivo, excluyendo mantenimientos programados comunicados.
- **Criterio de cumplimiento:** se aprueba solo si en la misma corrida/ventana se cumple **p95 ≤ 3s** a **15 TPS** y en el mes de referencia se observa **≥99.9%** de disponibilidad.
- **Evidencia mínima esperada:** reporte exportable de prueba de carga (incluyendo p95 y TPS observados), reporte de disponibilidad mensual y registro de fecha/hora + entorno + versión evaluada.

---

## 4. Escenarios clave (GIVEN / WHEN / THEN)

### Escenario 1 — Apertura de turno cruzando medianoche

**GIVEN** no existe turno activo  
**WHEN** un administrador abre turno con inicio viernes 19:00 y fin sábado 03:00  
**THEN** el sistema registra un único turno activo con intervalo fecha-hora válido, sin forzar corte por día calendario.

### Escenario 2 — Bloqueo de segundo turno activo

**GIVEN** existe un turno activo  
**WHEN** un administrador intenta abrir otro turno  
**THEN** el sistema rechaza la operación indicando conflicto por turno activo existente.

### Escenario 3 — Bloqueo de nueva comanda con saldo pendiente

**GIVEN** la mesa 12 tiene una comanda con saldo pendiente  
**WHEN** un mozo intenta abrir una nueva comanda para la mesa 12  
**THEN** el sistema bloquea la operación e informa que primero debe cancelarse totalmente la comanda anterior.

### Escenario 4 — Continuidad de atención entre mozos

**GIVEN** la mesa 7 tiene pedido abierto creado por el mozo A  
**WHEN** el mozo B (asignado al turno activo y con permisos) agrega ítems en esa mesa  
**THEN** el sistema permite la operación y registra auditoría con identidad del mozo B.

### Escenario 5 — Consistencia de actualización en tiempo real

**GIVEN** cocina marca un ítem como listo  
**WHEN** el backend confirma el cambio de estado  
**THEN** mozos, caja y administración ven automáticamente el nuevo estado sin refresco manual.

### Escenario 6 — SLA de operación de usuario

**GIVEN** una operación protegida válida (ej.: agregar ítem a comanda)  
**WHEN** se ejecutan mediciones operativas del endpoint  
**THEN** el percentil 95 de latencia se mantiene en 3 segundos o menos.

### Escenario 7 — API Key inválida en endpoint protegido

**GIVEN** una API Key inválida o revocada  
**WHEN** se intenta usar en un endpoint protegido  
**THEN** el backend responde 401, no ejecuta la acción y registra auditoría de denegación.

### Escenario 8 — Compatibilidad en navegadores objetivo

**GIVEN** un usuario opera el sistema en últimas versiones estables de Firefox, Chrome, Safari o Edge  
**WHEN** ejecuta los flujos críticos del MVP  
**THEN** las funciones core se comportan de forma equivalente y sin degradaciones bloqueantes.

### Escenario RBAC-1 — Unión de permisos por usuario multirol

**GIVEN** un usuario tiene asignados simultáneamente los roles `mozo` y `cajero`, con permisos diferenciados por vista/acción  
**WHEN** inicia sesión y accede a los módulos protegidos del MVP  
**THEN** el sistema le habilita la unión de acciones permitidas por ambos roles y mantiene bloqueadas las no incluidas en esa unión.

### Escenario RBAC-2 — Denegación por falta de permiso explícito

**GIVEN** un usuario autenticado no posee permiso explícito para la acción `cancelar ítem` en pedidos/comanda  
**WHEN** intenta ejecutar esa acción sobre una comanda abierta  
**THEN** el backend rechaza la operación por autorización insuficiente (deny by default) y registra evento de auditoría de denegación.

### Escenario RBAC-3 — Backend como fuente de verdad y frontend reflejando UX

**GIVEN** el rol de un usuario cambia en backend durante un turno activo  
**WHEN** el usuario vuelve a invocar una acción protegida y el frontend refresca capacidades efectivas  
**THEN** la autorización efectiva se resuelve según backend (fuente de verdad), y la interfaz refleja únicamente las vistas/acciones actualmente permitidas.

### Escenario 9 — Creación de promoción con vigencia

**GIVEN** un administrador gestiona el menú y el plato “Milanesa napolitana” tiene precio base vigente  
**WHEN** crea una promoción activa con tipo “% descuento”, valor 20%, `desde` 2026-04-21 18:00 y `hasta` 2026-04-21 23:59  
**THEN** el sistema guarda la promoción con su vigencia completa (en `America/La_Paz`) y la deja disponible para evaluación automática al agregar ítems.

### Escenario 10 — Aplicación automática de promoción vigente al agregar ítem

**GIVEN** existe una promoción activa y vigente para el plato “Milanesa napolitana” al momento de la operación  
**WHEN** un mozo agrega ese plato a una comanda  
**THEN** el precio del ítem se calcula con la promoción vigente, respetando la prioridad definida por invariantes, y se registra la referencia de promoción aplicada.

### Escenario 11 — No aplicar promoción fuera de vigencia

**GIVEN** existe una promoción para un plato con `hasta` 2026-04-21 23:59  
**WHEN** un mozo agrega el plato a las 2026-04-22 00:10  
**THEN** el sistema no aplica la promoción expirada y utiliza el precio base del plato.

### Escenario 12 — Trazabilidad de promoción aplicada en ticket/cuenta

**GIVEN** una cuenta contiene ítems con y sin promoción aplicada  
**WHEN** el cajero genera el ticket interno de la mesa  
**THEN** cada ítem con promoción muestra trazabilidad (identificador/nombre de promoción, tipo, valor y precio final), permitiendo auditoría del cálculo de cuenta.

### Escenario 13 — Desempate cuando dos promociones dan el mismo precio final

**GIVEN** existen dos promociones vigentes para el mismo plato que resultan en igual precio final  
**WHEN** un mozo agrega ese plato a una comanda  
**THEN** el sistema aplica la promoción con `created_at` más antiguo y, si persiste empate, la de menor `id`, registrando la seleccionada.

### Escenario 14 — Congelamiento de precio promocional en comanda

**GIVEN** un ítem fue agregado con una promoción vigente y luego esa promoción cambia o expira  
**WHEN** el cajero genera la cuenta de la mesa  
**THEN** el ítem conserva el precio promocional resuelto al momento de alta en comanda, sin recálculo retroactivo.

### Escenario 15 — Configuración de stock por plato para un turno

**GIVEN** existe un turno activo y el plato “Milanesa napolitana” habilitado en menú  
**WHEN** un administrador configura cupo operativo de 25 unidades para ese plato en el turno activo  
**THEN** el sistema guarda la configuración de stock por turno para ese plato y la deja disponible para consumo operativo.

### Escenario 16 — Configuración de stock por plato por día calendario

**GIVEN** el plato “Sopa del día” habilitado en menú  
**WHEN** un administrador configura cupo operativo de 40 unidades para la fecha 2026-04-22  
**THEN** el sistema guarda la configuración de stock por día calendario para ese plato y la deja disponible para consumo operativo en esa fecha.

### Escenario 17 — Consumo de stock al agregar ítem y bloqueo por agotamiento

**GIVEN** el plato “Hamburguesa clásica” tiene cupo operativo aplicable de 1 unidad  
**WHEN** un mozo agrega una unidad del plato a una comanda y luego intenta agregar una segunda unidad  
**THEN** el sistema consume la primera unidad, deja el saldo en 0 y bloquea el segundo agregado por stock agotado.

### Escenario 18 — Prioridad cuando coexisten configuración por turno y por día

**GIVEN** para el plato “Pique macho” existen simultáneamente cupo por día (50) y cupo por turno (12) aplicables al mismo momento operativo  
**WHEN** un mozo agrega una unidad del plato a una comanda dentro de ese turno  
**THEN** el sistema aplica de forma determinística la configuración por turno (prioridad sobre día), descuenta sobre ese cupo y registra en trazabilidad que la regla aplicada fue `turno`.

### Escenario 19 — Habilitación de día con distribución automática igualitaria

**GIVEN** para el producto “Milanesa napolitana” existe stock operativo diario de 30 unidades y hay 3 turnos habilitados para el día operativo  
**WHEN** el administrador habilita el día y sus turnos  
**THEN** el sistema distribuye automáticamente 10 unidades por turno para ese producto.

### Escenario 20 — Día con un solo turno habilitado

**GIVEN** para el producto “Sopa del día” existe stock operativo diario de 18 unidades y solo 1 turno habilitado en el día operativo  
**WHEN** el administrador habilita el día  
**THEN** el sistema asigna el 100% (18 unidades) al único turno habilitado.

### Escenario 21 — Ajuste manual válido de distribución por turnos

**GIVEN** para el producto “Pique macho” el stock diario es 40 y la distribución automática inicial entre 2 turnos quedó en 20/20  
**WHEN** el administrador ajusta la distribución a 25/15 sin violar restricciones  
**THEN** el sistema acepta el ajuste y registra auditoría de la redistribución.

### Escenario 22 — Bloqueo de ajuste por superar tope diario

**GIVEN** para el producto “Hamburguesa clásica” el stock diario es 50  
**WHEN** el administrador intenta asignar cupos por turno cuya suma total es 55  
**THEN** el sistema rechaza la operación por exceder el tope diario del producto.

### Escenario 23 — Corte por fecha de inicio del turno y trazabilidad diaria

**GIVEN** un turno inicia el 2026-04-21 19:00 y finaliza el 2026-04-22 03:00 para el producto “Milanesa napolitana”  
**WHEN** se registran ventas durante todo el turno  
**THEN** el consumo se imputa al stock operativo del día 2026-04-21 (fecha de inicio del turno), y el reporte diario muestra cuánto vendió ese turno y cuánto saldo quedó del total diario.

### Escenario 24 — Caja visualiza mesas pendientes en tiempo real

**GIVEN** existen mesas 4 y 9 con cuenta/pedido pendiente de pago y la mesa 2 ya está pagada  
**WHEN** caja consulta el panel de pendientes de cobro  
**THEN** el sistema muestra en tiempo real las mesas 4 y 9 como pendientes y excluye la mesa 2.

### Escenario 25 — Bloqueo de cierre de turno con mesas pendientes

**GIVEN** existe un turno activo y al menos una mesa del turno con cuenta/pedido pendiente de pago  
**WHEN** un administrador intenta cerrar el turno  
**THEN** el sistema rechaza el cierre, informa la causa y lista las mesas pendientes.

### Escenario 26 — Bloqueo de cierre de día operativo con mesas pendientes

**GIVEN** el día operativo vigente contiene al menos una mesa con cuenta/pedido pendiente de pago  
**WHEN** un administrador intenta cerrar el día operativo  
**THEN** el sistema rechaza el cierre, informa la causa y lista las mesas pendientes.

### Escenario 27 — Habilitación de cierre operativo sin pendientes

**GIVEN** todas las mesas del turno y del día operativo vigente registran pago completo  
**WHEN** un administrador intenta cerrar turno y luego cerrar día operativo  
**THEN** el sistema habilita ambas operaciones y registra fecha-hora efectiva de cada cierre.

### Escenario 28 — Pago parcial mantiene mesa pendiente

**GIVEN** la mesa 5 tiene una cuenta total de 200 y saldo pendiente de 200  
**WHEN** caja registra un pago parcial de 120  
**THEN** el sistema actualiza saldo pendiente a 80 y mantiene la mesa en estado pendiente de pago.

### Escenario 29 — Revalidación concurrente en cierre de turno

**GIVEN** al iniciar el cierre de turno no hay pendientes visibles  
**WHEN** durante la confirmación final aparece una mesa con saldo pendiente por operación concurrente  
**THEN** el sistema rechaza el cierre, informa el nuevo pendiente y exige reintento tras resolución.

### Escenario 30 — Restitución de stock operativo por anulación de ítem

**GIVEN** un plato consumió 1 unidad de stock operativo al agregarse a comanda y luego el ítem se anula antes del cierre de cuenta  
**WHEN** se confirma la anulación del ítem  
**THEN** el sistema restituye 1 unidad al cupo operativo correspondiente y registra auditoría del movimiento.

### Escenario 31 — Rechazo de stock operativo diario por exceder stock real v1

**GIVEN** el producto vendible “Limonada” tiene stock real del sistema (v1) igual a 20 unidades  
**WHEN** un administrador intenta configurar stock operativo diario de 25 unidades para “Limonada”  
**THEN** el sistema rechaza la configuración por superar el stock real v1 del producto.

### Escenario 32 — Imputación FIFO de pago parcial y actualización de saldo

**GIVEN** la mesa 8 tiene ítems pendientes en orden temporal: ítem A (40), ítem B (30), ítem C (50)  
**WHEN** caja registra un pago parcial de 60  
**THEN** el sistema imputa 40 a ítem A y 20 a ítem B (FIFO), deja saldo pendiente total de 60 y registra trazabilidad de imputación.

### Escenario 33 — Bloqueo de transición inválida de mesa/comanda

**GIVEN** la mesa 3 está en `esperando_cuenta` con saldo pendiente mayor a 0 y su comanda está en `enviada`  
**WHEN** un usuario intenta forzar transición de mesa a `libre` o abrir una nueva comanda en la misma mesa  
**THEN** el sistema rechaza ambas operaciones por transición inválida y deuda pendiente, registrando evento de auditoría.

### Escenario 34 — Promoción individual deshabilita precio base

**GIVEN** el plato “Milanesa napolitana” tiene promoción individual vigente y aplicable  
**WHEN** un mozo intenta agregar ese plato eligiendo precio base  
**THEN** el sistema bloquea el precio base, aplica el precio promocional y registra la promoción seleccionada.

### Escenario 35 — Vigencia por cupo en promoción individual

**GIVEN** una promoción individual de “Hamburguesa clásica” tiene cupo de 10 platos y ya se vendieron 10 bajo promoción  
**WHEN** un mozo agrega una nueva hamburguesa  
**THEN** el sistema considera agotado el cupo promocional, deja de aplicar la promo y utiliza el precio normal/aplicable vigente.

### Escenario 36 — Elección manual entre combo o platos por separado

**GIVEN** existe combo elegible “2 Milanesas + 2 Gaseosas” y los componentes también pueden venderse por separado  
**WHEN** el cliente decide comprar por separado y el mozo registra esa decisión  
**THEN** el sistema mantiene precios por separado (normal/aplicable) y no fuerza precio combo.

### Escenario 37 — Sugerencia obligatoria de promociones/combo antes de confirmar

**GIVEN** hay promociones individuales y combos elegibles para los ítems en edición  
**WHEN** el mozo intenta confirmar el agregado/cambio de ítems  
**THEN** el sistema muestra primero las opciones elegibles y recién luego permite confirmar la selección comercial.

### Escenario 38 — Trazabilidad comercial de elegibilidad, elección y precio final

**GIVEN** durante una operación se mostraron opciones elegibles y el mozo registró la elección del cliente  
**WHEN** se confirma la operación y luego se consulta auditoría/ticket interno  
**THEN** debe existir registro de oferta/elegibilidad mostrada, opción elegida y precio final aplicado.

### Escenario 39 — Consumo de stock por componentes al aplicar combo

**GIVEN** un combo está compuesto por 2 “Milanesa napolitana” y 2 “Gaseosa”, con stock operativo disponible de cada componente  
**WHEN** el mozo aplica el combo en una comanda  
**THEN** el sistema descuenta 2 unidades de stock de “Milanesa napolitana” y 2 de “Gaseosa”, registrando trazabilidad del consumo por componente.

### Escenario 40 — Modificación post-envío como delta auditable

**GIVEN** una comanda está en estado `enviada` con ítems ya despachados a cocina  
**WHEN** el mozo intenta cambiar en forma directa cantidad/precio de un ítem ya enviado  
**THEN** el sistema rechaza la edición in-place y solo permite registrar un delta auditable (agregado nuevo o anulación explícita de ítem anulable), manteniendo trazabilidad completa.

### Escenario 41 — Selección determinística entre múltiples promociones individuales

**GIVEN** para un mismo plato existen tres promociones individuales vigentes/aplicables con precios finales 80, 75 y 75  
**WHEN** un mozo agrega el plato a una comanda sin elegir combo  
**THEN** el sistema aplica la promoción con precio final 75 y, entre empates, selecciona `created_at` más antiguo y luego menor `id`, dejando evidencia de la regla aplicada.

### Escenario 42 — Día operativo y turno cruzando medianoche

**GIVEN** el turno inicia el 2026-04-21 19:00 y finaliza el 2026-04-22 03:00 en `America/La_Paz`  
**WHEN** se registran ventas, pagos y consumos de stock durante todo el turno  
**THEN** toda la operación se imputa al día operativo 2026-04-21 (fecha de inicio del turno) para cierre diario, reportes y stock diario.

### Escenario 43 — Reverso de pago reabre pendiente y bloquea cierre operativo

**GIVEN** una mesa estaba totalmente pagada y un cajero autorizado reversa un pago válido con motivo registrado  
**WHEN** el reverso deja saldo pendiente mayor a 0  
**THEN** la mesa vuelve a estado pendiente de pago, el evento queda auditado con vínculo al pago original y el sistema bloquea cierre de turno/día hasta regularización.

### Escenario 44 — Bloqueo de reverso sobre día operativo cerrado

**GIVEN** el día operativo 2026-04-21 ya fue cerrado  
**WHEN** un usuario intenta anular un pago imputado a ese día operativo  
**THEN** el sistema rechaza la operación por integridad de cierre y registra intento denegado en auditoría.

### Escenario 45-A — 401 por API Key ausente/inválida/revocada en endpoint protegido

**GIVEN** un usuario intenta invocar un endpoint protegido sin header `X-API-Key`, o con API Key inválida/revocada  
**WHEN** el backend valida la autenticación de la solicitud  
**THEN** el backend responde **401**, no ejecuta la acción solicitada y registra auditoría de denegación por no autenticado.

### Escenario 45-B — 403 por falta de permiso RBAC con API Key válida

**GIVEN** un usuario autenticado con API Key válida intenta ejecutar una acción protegida sin permiso RBAC explícito  
**WHEN** el backend evalúa autorización efectiva (deny by default) para esa acción  
**THEN** el backend responde **403**, no ejecuta la acción solicitada y registra auditoría de denegación por autorización insuficiente.

### Escenario 46 — Bloqueo de cierre de día por turnos no cerrados

**GIVEN** no existen mesas pendientes de pago, pero el día operativo tiene al menos un turno aún abierto  
**WHEN** un administrador intenta cerrar el día operativo  
**THEN** el sistema bloquea el cierre indicando que faltan turnos por cerrar y lista los turnos pendientes.

### Escenario 47 — Reporte de stock por producto (definido/vendido/saldo)

**GIVEN** existe operación de ventas para el producto “Milanesa napolitana” en el período consultado  
**WHEN** administración genera el reporte de stock por producto  
**THEN** el sistema muestra para cada producto el stock definido, vendido y saldo de forma consistente con los movimientos del período.

### Escenario 48 — Redondeo monetario consistente en comanda/ticket/reportes

**GIVEN** una comanda contiene ítems con precios que requieren redondeo decimal  
**WHEN** se consulta la comanda, se emite ticket y se genera reporte del mismo período  
**THEN** los montos coinciden exactamente entre los tres artefactos aplicando regla half-up a 2 decimales en total de línea.

### Escenario 49 — CRUD básico de usuarios

**GIVEN** un administrador autenticado con permisos de usuarios  
**WHEN** crea, lista, actualiza y desactiva un usuario asignándole roles operativos del MVP  
**THEN** el sistema persiste cada operación, aplica validaciones de autorización y deja auditoría trazable.

### Escenario 50 — CRUD básico de menú/plato

**GIVEN** un administrador autenticado con permisos de menú  
**WHEN** crea una categoría y un plato, luego actualiza su precio y finalmente desactiva el plato  
**THEN** el sistema aplica CRUD completo de catálogo con persistencia y auditoría de cambios.

### Escenario 51 — Reasignación de mesa entre mozos

**GIVEN** la mesa 10 está activa y asignada al mozo A  
**WHEN** un administrador la reasigna al mozo B por balance de carga  
**THEN** la mesa queda operativamente asignada al mozo B y el sistema registra auditoría de reasignación.

### Escenario 52 — Nota por ítem visible en KDS

**GIVEN** un mozo agrega un ítem con nota "sin sal" en una comanda enviada  
**WHEN** cocina visualiza el pedido en KDS  
**THEN** el ítem muestra la nota asociada y la cocina puede operar el ítem con esa referencia.

### Escenario 53 — Orden KDS por antigüedad

**GIVEN** existen tres pedidos pendientes con tiempos de espera de 18, 9 y 3 minutos  
**WHEN** cocina consulta la cola KDS  
**THEN** el sistema los ordena de mayor a menor antigüedad de espera (18 → 9 → 3) sin depender del mozo.

### Escenario 54 — Colaboración concurrente con autor visible en tiempo real

**GIVEN** la mesa 15 tiene comanda abierta y los mozos A y B están asignados al turno activo  
**WHEN** el mozo A agrega un ítem en la comanda  
**THEN** el mozo B y los actores relevantes ven el nuevo ítem en tiempo real, incluyendo que el autor fue el mozo A.

### Escenario 55 — Cancelación de ítem visible en tiempo real con autor

**GIVEN** la comanda de la mesa 15 contiene un ítem anulable y los mozos A/B están asignados al turno activo  
**WHEN** el mozo B cancela el ítem  
**THEN** la cancelación se refleja en tiempo real para actores relevantes mostrando al mozo B como autor y registrando auditoría con before/after.

### Escenario 56 — Bloqueo de mozo no asignado al turno activo

**GIVEN** la mesa 6 tiene comanda abierta y el mozo C no está asignado al turno activo  
**WHEN** el mozo C intenta agregar o cancelar ítems en la comanda  
**THEN** el sistema rechaza la operación por restricción de turno y registra auditoría de denegación con contexto.

### Escenario 57 — Alta/baja dinámica de mozo durante turno con auditoría

**GIVEN** existe un turno activo con mozos A y B asignados  
**WHEN** un administrador agrega al mozo C y luego quita al mozo B durante el mismo turno  
**THEN** el sistema aplica ambos cambios de asignación y registra auditoría completa de alta/baja (quién ejecutó, qué cambio, cuándo y contexto de turno).

### Escenario 58 — Colisión concurrente en operación crítica de comanda

**GIVEN** dos mozos activos del turno intentan confirmar cambios incompatibles sobre la misma comanda casi en simultáneo  
**WHEN** ambas operaciones llegan a confirmación backend  
**THEN** el sistema aplica atómicamente la primera confirmada, rechaza la segunda con conflicto y devuelve estado actualizado, registrando auditoría del conflicto.

### Escenario 59 — Uso correcto de API Key activa

**GIVEN** una API Key activa y válida para el cliente  
**WHEN** el cliente invoca un endpoint protegido  
**THEN** el backend autentica correctamente, evalúa RBAC y mantiene trazabilidad de la operación.

### Escenario 60 — API Key revocada bloquea acceso

**GIVEN** una API Key revocada  
**WHEN** se intenta invocar operación protegida  
**THEN** el backend rechaza la solicitud con 401 y audita denegación por credencial inválida.

### Escenario 61 — Estado exacto de mesa post-reverso

**GIVEN** una mesa pagada recibe un reverso de pago válido  
**WHEN** el saldo posterior del reverso resulta (a) mayor a 0 o (b) igual a 0  
**THEN** en (a) la mesa pasa obligatoriamente a `esperando_cuenta`; en (b) mantiene estado consistente de cierre (`libre` cuando corresponda), con auditoría before/after y saldo previo/posterior.

### Escenario 62 — Validación de capacidad de mesa en alta/edición

**GIVEN** un administrador intenta crear/editar una mesa con capacidad inválida (nula, decimal o <= 0)  
**WHEN** confirma la operación  
**THEN** el sistema rechaza la solicitud por validación de dominio; con capacidad entera > 0 la acepta y audita el cambio.

### Escenario 63 — Asignación inicial de mozo sin exclusividad operativa

**GIVEN** una comanda se abre en mesa 11 y queda registrada con mozo inicial A  
**WHEN** el mozo B, activo en el turno y autorizado por RBAC, agrega ítems o actualiza la comanda  
**THEN** el sistema permite la operación, mantiene la asignación inicial trazable y audita la acción del mozo B.

### Escenario 64 — KDS retiro por cualquier mozo activo e indicador de tiempo

**GIVEN** un pedido fue enviado a cocina y KDS muestra tiempo transcurrido en tiempo real desde ese envío  
**WHEN** el pedido pasa a listo y luego es retirado por un mozo activo del turno distinto al mozo inicial  
**THEN** el sistema permite el retiro, registra autor de retiro, propaga estado en tiempo real y persiste el tiempo final en `listo` y `retiro` para reporte/auditoría.

### Escenario 65 — Reportes MVP operativos obligatorios

**GIVEN** existe operación registrada en el período consultado con ventas, ítems comandados, actividad por mozo y estados de pago de mesas/cuentas  
**WHEN** administración genera reportes del MVP para ese período  
**THEN** el sistema entrega como mínimo: (a) ventas por período día/semana/mes, (b) platos más pedidos, (c) performance por mozo (mesas atendidas y tiempo de retiro de pedidos listos), y (d) estado de pago operativo (`pagado`/`pendiente`/`parcial` cuando corresponda), sin requerir desglose por método de pago en v1.

### Escenario 66 — Consulta administrativa de historial de cambios

**GIVEN** existen cambios auditados sobre mesa 12 / comanda C-120 (alta de ítem, anulación de ítem y cambio de estado), ejecutados por mozos A y B en distintos momentos  
**WHEN** un administrador consulta historial aplicando filtros por mesa=12, comanda=C-120, rango de fecha-hora y actor=mozo B  
**THEN** el sistema devuelve únicamente los eventos que cumplen los filtros, ordenados cronológicamente (ascendente), mostrando actor, contexto (mesa/comanda/ítem) y `before/after` en los eventos donde corresponda.

### Escenario 67 — Umbral de carga por mozo con alerta y auditoría (RF-MES-12)

**GIVEN** existe un turno activo, el umbral de carga por mozo está configurable y, si no se define valor explícito, aplica el default 4  
**WHEN** un mozo pasa de 4 a 5 mesas activas en el turno vigente (superando el umbral efectivo)  
**THEN** el sistema dispara alerta de sobrecarga visible para administración, mantiene el indicador de carga actualizado y registra evento auditable con mozo afectado, umbral efectivo, valor previo y valor nuevo de carga, y fecha-hora.

### Escenario 68 — Rotación de API Key invalida la clave anterior

**GIVEN** una API Key antigua fue reemplazada por rotación administrativa  
**WHEN** se intenta invocar un endpoint protegido usando la clave anterior  
**THEN** el backend rechaza la operación con 401, no ejecuta la acción y exige uso de credencial vigente.

### Escenario 69 — Creación válida de subcategoría vinculada a categoría activa

**GIVEN** existe una categoría activa "Bebidas" y un administrador con permisos de menú  
**WHEN** crea la subcategoría "Sin alcohol" referenciando esa categoría activa  
**THEN** el sistema persiste la subcategoría, mantiene el vínculo con su categoría y registra auditoría de alta.

### Escenario 70 — Rechazo de subcategoría sin categoría

**GIVEN** un administrador intenta crear una subcategoría sin informar categoría asociada  
**WHEN** confirma la operación de alta  
**THEN** el sistema rechaza la solicitud con `422` por validación y no crea la subcategoría.

### Escenario 71 — Rechazo de asignación de plato con subcategoría inválida/inactiva

**GIVEN** un administrador crea o edita un plato con categoría informada y subcategoría inválida, inexistente o inactiva  
**WHEN** confirma la operación de persistencia del plato  
**THEN** el sistema rechaza la solicitud con `422` por validación, sin persistir la asignación inconsistente.

---

## 5. Matriz de trazabilidad PRD ↔ SPEC (MVP/P0)

| PRD (capacidad) | RF SPEC asociado | Escenario GWT asociado |
|---|---|---|
| Gestión de usuarios (CRUD básico + RBAC) | RF-AUTH-10, RF-AUTH-03/04/05 | Escenario RBAC-1, RBAC-2, 49 |
| Gestión de menú/platos/categorías/subcategorías | RF-MNU-01, RF-MNU-02, RF-MNU-03, RF-MNU-04, RF-MNU-05 | Escenario 50, 69, 70, 71 |
| Asignación/reasignación de mesa | RF-MES-11 | Escenario 51 |
| Indicador de carga por mozo + umbral | RF-MES-12 | Escenario 67 |
| Concurrencia colaborativa en mesa/comanda | RF-MES-14, RF-MES-15, RF-MES-16 | Escenario 54, 55 |
| Restricción por turno para operar comandas | RF-TUR-09, RF-MES-04 | Escenario 56 |
| Asignación dinámica de mozos en turno | RF-TUR-07, RF-TUR-08 | Escenario 57 |
| Trazabilidad total operativa con before/after | RF-MES-17, NFR-11 | Escenario 55, 57 |
| Notas por ítem | RF-MES-13, RF-KDS-05 | Escenario 52 |
| Orden KDS por antigüedad | RF-KDS-04 | Escenario 53 |
| Contrato FE↔BE por API Key (401/403, validación, revocación) | RF-AUTH-08, RF-AUTH-09, RF-AUTH-11..RF-AUTH-14 | Escenario 7, 45-A, 45-B, 59, 60 |
| Rotación/revocación de API Key y propagación de invalidez | RF-AUTH-15, NFR-12 | Escenario 68 |
| Concurrencia transaccional en colisiones límite | RF-MES-22, RF-MES-23 | Escenario 58 |
| Capacidad válida de mesa (alta/edición) | RF-MES-18, RF-MES-19 | Escenario 62 |
| Asignación inicial de mozo no exclusiva | RF-MES-20, RF-MES-21 | Escenario 63 |
| KDS retiro por cualquier mozo activo + tiempo persistido | RF-KDS-06, RF-KDS-07, RF-KDS-08 | Escenario 64 |
| Historial de cambios visible para admin (consulta) | RF-MES-24, RF-MES-25 | Escenario 66 |
| Estado exacto de mesa post-reverso | RF-BIL-13, RF-BIL-14, RF-BIL-15 | Escenario 61 |
| Cierre de día bloqueado por turnos no cerrados | RF-DIA-05 | Escenario 46 |
| Stock diario por turnos (distribución/ajuste/restitución) | RF-STK-07, RF-STK-09, RF-STK-10, RF-STK-11, RF-STK-13 | Escenario 19, 21, 30 |
| Reporte de stock por producto | RF-REP-05 | Escenario 47 |
| Reportes MVP operativos (ventas/platos/mozo/estado pago) | RF-REP-06, RF-REP-07, RF-REP-08, RF-REP-09, RF-REP-10 | Escenario 65 |
| Estándar monetario único y consistente | RF-MON-01..RF-MON-05 | Escenario 48 |
