# Open Questions

Registro de dudas y preguntas abiertas que surgieron durante el proceso de diseño.
No requieren resolución urgente pero deben cerrarse antes de implementar el módulo relacionado.

**Estados:** `open` | `in-discussion` | `resolved` | `deferred`

---

## Pendientes

| # | Pregunta | Módulo relacionado | Estado | Fecha |
|---|----------|--------------------|--------|-------|
| OQ-002 | ¿Un mismo insumo puede ser comprado a múltiples proveedores con precios distintos? ¿Cómo se calcula el costo — FIFO, promedio, último precio? | Insumos / Costos | deferred | 2026-04-16 |

> **Nota:** OQ-002 queda diferida para **V2** junto con compra de insumos/costos y se considera **non-blocking para MVP**.

---

## Resueltas

### OQ-035 — Cierre de inconsistencia de alcance en reportes MVP
**Pregunta:** ¿El reporte de stock por producto forma parte de los reportes obligatorios del MVP?  
**Resolución:** Sí. Se confirma `RF-REP-05` como obligatorio del MVP y se alinea PRD/PROPOSAL para declararlo explícitamente como salida obligatoria (definido/vendido/saldo).  
**Impacto:** Queda cerrada la inconsistencia documental de alcance sin cambios de reglas de negocio.  
**Fecha resolución:** 2026-04-21

---

### OQ-001 — Turnos y corte operativo (cerrada por referencia)
**Pregunta original (fragmento turnos):** ¿El restaurante opera en turnos?  
**Resolución:** **Cerrada por referencia explícita a OQ-006**, que ya definió el modelo de turnos (turno único activo, intervalo fecha-hora, puede cruzar medianoche, no depende de día calendario).  
**Impacto:** Se elimina ambigüedad de OQ-001 mezclada; el tema de turnos queda cerrado y trazado en OQ-006. El tema de stock/corte operativo quedó separado y resuelto en OQ-010.  
**Fecha resolución:** 2026-04-21

---

### OQ-003 — Permisos para modificar pedido enviado a cocina
**Pregunta:** ¿Quién puede modificar un pedido ya enviado a cocina?  
**Resolución:** El mozo tiene permisos para modificar pedidos enviados, pero **solo** mediante deltas auditables (agregar nuevo ítem o anular ítem anulable). No se permite edición in-place de ítems ya enviados. Toda modificación queda registrada en una bitácora de auditoría (usuario, timestamp, cambio realizado) para evitar conflictos y tener trazabilidad completa.  
**Impacto:** El módulo de pedidos debe incluir historial de cambios visible para el admin. La bitácora es obligatoria, no opcional.  
**Fecha resolución:** 2026-04-16

---

### OQ-004 — Requisitos del comprobante de pago
**Pregunta:** ¿El ticket necesita cumplir requisitos fiscales?  
**Resolución:** En esta fase se entrega únicamente un ticket interno con el detalle de la cuenta (ítems, cantidades, precios, total, estado de pago y trazabilidad de imputación). La facturación fiscal queda diferida para una fase posterior.  
**Impacto:** El módulo de cuentas no necesita integración con sistemas fiscales por ahora.  
**Fecha resolución:** 2026-04-16

---

### OQ-005 — Mozo con múltiples mesas simultáneas
**Pregunta:** ¿Un mozo puede atender múltiples mesas? ¿No genera lentitud en la entrega?  
**Resolución:** Sí, un mozo puede tener múltiples mesas activas. Para evitar cuellos de botella se implementan dos mecanismos:

1. **KDS de cocina:** los pedidos se muestran ordenados por tiempo de espera, sin distinción de mozo. Cualquier mozo disponible puede retirar un pedido listo — no hay dependencia del mozo que lo tomó.
2. **Indicador de carga:** el admin ve en tiempo real cuántas mesas activas tiene cada mozo. Umbral configurable de alerta (default: 4 mesas activas). El admin puede reasignar una mesa a otro mozo si detecta saturación.

**Impacto en métricas:** la cantidad de mesas por mozo y el tiempo de retiro de pedidos listos se usan para medir performance individual.  
**Fecha resolución:** 2026-04-16

---

### OQ-006 — Turnos y dimensiones de reportes
**Pregunta:** ¿El sistema maneja más de un turno por día? ¿Cómo se cortan los reportes?  
**Resolución:**
- El sistema opera con **un único turno activo a la vez**.
- Cada turno registra **fecha-hora de inicio y fecha-hora de fin**, y puede cruzar medianoche.
- El modelo de turnos **no depende de día calendario**.
- Cada turno registra mozos asignados al turno.
- Los reportes se pueden generar por las siguientes dimensiones:
  - Por turno
  - Por día calendario
  - Por mozo
  - Por categoría de plato
  - Por estado de pago operativo
  - Por franja horaria (para identificar picos de demanda)
  - Combinados: mozo + turno, turno + categoría, etc.

**Impacto:** El módulo de turnos debe existir desde el MVP con invariantes de intervalo fecha-hora y turno único activo. Los reportes deben diseñarse con filtros combinables desde el inicio.  
**Fecha resolución:** 2026-04-21

---

### OQ-007 — Desempate de promociones con mismo precio final
**Pregunta:** Si dos promociones vigentes dejan el mismo precio final para un plato, ¿cuál se aplica?  
**Resolución:** Se aplica la promoción con `created_at` más antiguo; si persiste empate técnico, se aplica la de menor `id`.  
**Impacto:** La regla elimina ambigüedad de cálculo y garantiza comportamiento determinístico/auditable en cuenta y ticket.  
**Fecha resolución:** 2026-04-21

---

### OQ-008 — Congelamiento de precio promocional en comanda
**Pregunta:** ¿El precio promocional de un ítem debe recalcularse si cambia/vence la promoción después de agregarlo?  
**Resolución:** No. El precio final del ítem queda congelado al momento de agregarlo a la comanda y no se recalcula retroactivamente; solo cambia si se elimina y se vuelve a agregar.  
**Impacto:** Se evita variación inesperada de cuenta y se preserva trazabilidad de la decisión de precio por ítem.  
**Fecha resolución:** 2026-04-21

---

### OQ-009 — Zona horaria oficial para vigencias de promociones
**Pregunta:** ¿Qué zona horaria se usa para evaluar `desde`/`hasta` de promociones?  
**Resolución:** La zona horaria oficial para vigencias es `America/La_Paz`.  
**Impacto:** Todas las validaciones de vigencia usan una referencia temporal única y consistente en backend/reportes/auditoría.  
**Fecha resolución:** 2026-04-21

---

### OQ-010 — Corte/reset de stock operativo de platos en MVP
**Pregunta:** Para stock operativo de platos en MVP: ¿el corte/reset debe definirse por turno o por día calendario?  
**Resolución:**
- El stock operativo diario se asocia a la fecha de inicio del turno (si cruza medianoche, sigue perteneciendo al día de inicio).
- Al habilitar el día y sus turnos, el sistema distribuye automáticamente el stock diario por producto en partes iguales entre turnos habilitados.
- Si solo hay un turno habilitado, recibe el 100% del stock diario.
- El administrador puede redistribuir manualmente cupos por turno, sin superar el total diario ni dejar un turno por debajo de lo ya vendido.
- El sistema debe reportar por producto: venta por turno y saldo remanente del total diario.
**Impacto:** Se elimina ambigüedad operativa del stock de platos en MVP y se garantiza trazabilidad por turno y por día con regla determinística y auditable.  
**Fecha resolución:** 2026-04-21

---

### OQ-011 — Cierre de turno/día con mesas pendientes de cobro
**Pregunta:** ¿Se puede cerrar turno y/o día operativo si todavía existen mesas con cuenta/pedido pendiente de pago?  
**Resolución:** No. Caja debe visualizar en tiempo real las mesas pendientes de cobro y el sistema debe bloquear el cierre de turno y de día operativo mientras exista al menos una mesa pendiente. El cierre solo se habilita cuando todas las mesas del período estén pagadas.  
**Impacto:** Se refuerza control operativo de caja y se evita cierre administrativo con deuda abierta, manteniendo consistencia entre billing, turnos y día operativo.  
**Fecha resolución:** 2026-04-21

---

### OQ-012 — Secuencia de pedidos por mesa y pagos parciales
**Pregunta:** Si se permiten pagos parciales, ¿puede abrirse un segundo pedido en la misma mesa antes de cancelar el primero?  
**Resolución:** No. Se permiten pagos parciales, pero una mesa mantiene estado pendiente mientras el saldo total sea mayor a 0. Solo cuando la comanda anterior queda totalmente pagada se puede abrir una nueva comanda para esa mesa.  
**Impacto:** Se elimina ambigüedad en flujo de mesa, se ordena la operación de caja y se evita acumulación de deuda entre comandas en una misma mesa.  
**Fecha resolución:** 2026-04-21

---

### OQ-013 — Revalidación final al cerrar turno/día
**Pregunta:** ¿Qué pasa si aparece una mesa pendiente entre la validación y la confirmación de cierre de turno/día?  
**Resolución:** El cierre debe revalidar pendientes en tiempo real al momento de confirmar. Si surge un pendiente concurrente, el cierre se rechaza y se debe reintentar luego de resolverlo.  
**Impacto:** Evita condiciones de carrera y cierres inconsistentes en escenarios concurrentes de operación.  
**Fecha resolución:** 2026-04-21

---

### OQ-014 — Restitución de stock operativo por anulación de ítems
**Pregunta:** Si un ítem ya agregado a comanda se anula/elimina, ¿el stock operativo consumido se recupera?  
**Resolución:** Sí. Si el ítem se anula/elimina en comanda abierta, se restituye 1 unidad al cupo operativo correspondiente, con auditoría obligatoria del ajuste.  
**Impacto:** Mantiene consistencia entre disponibilidad operativa y ventas efectivas, evitando subestimar cupos disponibles por anulaciones válidas.  
**Fecha resolución:** 2026-04-21

---

### OQ-015 — Definición de “stock real del sistema” en v1
**Pregunta:** En MVP, ¿qué significa exactamente “stock real del sistema” y cómo se relaciona con stock operativo diario?  
**Resolución:** Para v1, el stock real del sistema se define únicamente sobre productos vendibles de catálogo (platos/bebidas). No incluye gestión de insumos ni costos (diferido a V2). El stock operativo diario por producto debe validarse contra ese stock real v1 y no puede superarlo.  
**Impacto:** Se elimina ambigüedad entre inventario vendible MVP vs. inventario de insumos/costos V2; además se fija un tope operativo diario determinístico por producto.  
**Fecha resolución:** 2026-04-21

---

### OQ-016 — Orden de imputación de pagos parciales
**Pregunta:** Cuando una mesa paga parcialmente, ¿cómo se decide qué parte de la deuda se cancela primero?  
**Resolución:** Para MVP se establece una única regla: imputación FIFO por fecha-hora de ítems/comandas dentro de la mesa (de lo más antiguo a lo más reciente), sin selección manual.  
**Impacto:** La reducción de saldo pendiente pasa a ser determinística y auditable; ticket y auditoría deben reflejar contra qué ítems/comandas se imputó cada pago parcial.  
**Fecha resolución:** 2026-04-21

---

### OQ-017 — Estados y transiciones válidas de mesa/comanda
**Pregunta:** ¿Cuáles son los estados exactos de mesa/comanda y qué transiciones se permiten en MVP?  
**Resolución:** Mesa: estados cerrados `libre`, `ocupada`, `esperando_cuenta`; transiciones válidas `libre -> ocupada`, `ocupada -> esperando_cuenta`, `esperando_cuenta -> libre` (solo con saldo 0). Comanda: estados cerrados `abierta`, `enviada`, `cerrada`; transiciones válidas `abierta -> enviada`, `abierta -> cerrada` (saldo 0), `enviada -> cerrada` (saldo 0). Queda bloqueada cualquier nueva comanda si la mesa tiene saldo pendiente > 0.  
**Impacto:** Se cierra el modelo de estados del MVP, se evitan bypass operativos y se alinea el bloqueo de deuda con caja/turnos/cierre operativo.  
**Fecha resolución:** 2026-04-21

---

### OQ-018 — Modelo de autorización RBAC para MVP (usuarios/roles/permisos)
**Pregunta:** ¿Cómo debe modelarse y aplicarse la autorización en MVP para evitar ambigüedad entre roles, acciones por módulo y validaciones frontend/backend?  
**Resolución:** Se adopta RBAC flexible con usuario multirol (N:N usuario-rol). Cada rol define permisos granulares por vista/acción; los permisos efectivos del usuario se calculan como unión de todos sus roles. Se aplica deny by default: sin permiso explícito no hay acceso/acción. El backend es la fuente de verdad de autorización y el frontend solo refleja/habilita UX según capacidades efectivas. Toda autorización/acción relevante debe auditar usuario, acción, contexto y fecha-hora.  
**Impacto:** Queda unificado el criterio de autorización para Auth, Pedidos/Comanda, Cocina, Caja, Turnos y Administración, evitando reglas implícitas por pantalla y asegurando trazabilidad operativa/auditabilidad del MVP.  
**Fecha resolución:** 2026-04-21

---

### OQ-019 — Consistencia comercial de promociones individuales y combos
**Pregunta:** Cuando un plato tiene promoción individual activa y además existe un combo elegible, ¿cómo se debe decidir precio, sugerencia al mozo, trazabilidad y consumo de stock?  
**Resolución:**
- **Promoción individual de plato:** si está vigente y aplicable, el precio base queda deshabilitado; el mozo no puede elegir precio base mientras dure la promo. La vigencia puede ser por tiempo y/o por cupo de platos promocionales.
- **Promoción combo:** el cliente puede elegir entre comprar platos por separado (precio normal/aplicable) o combo a precio combo; la elección la registra manualmente el mozo según decisión del cliente.
- **Regla de exclusión en mismo ítem:** no se permite doble aplicación conflictiva en un mismo ítem/contexto comercial; se aplica una única opción final entre promoción individual o combo.
- **UX comercial:** antes de confirmar, el sistema siempre debe sugerir promociones/combo elegibles al mozo.
- **Trazabilidad:** registrar oferta/elegibilidad mostrada, opción elegida por cliente vía mozo y precio final aplicado.
- **Stock:** en promoción individual el consumo es normal por ítem; en combo se consume stock operativo de cada componente del combo.
**Impacto:** Se elimina ambigüedad comercial en pricing/promociones, se estandariza la toma de decisión en salón y se alinea trazabilidad de auditoría con reglas de stock operativo sin ampliar scope fuera de MVP.  
**Fecha resolución:** 2026-04-21

---

### OQ-020 — Regla única de edición post-envío de comanda
**Pregunta:** ¿Cómo se modifica una comanda después de enviarla a cocina sin ambigüedad operativa?  
**Resolución:** En MVP se define una regla única: una comanda `enviada` no admite edición in-place de ítems ya enviados. Cualquier cambio debe registrarse como **delta auditable** (agregado de nuevo ítem o anulación explícita de ítem anulable).  
**Impacto:** Se elimina ambigüedad en pedidos post-envío, se preserva trazabilidad completa y se alinea el comportamiento entre salón, cocina y auditoría.  
**Fecha resolución:** 2026-04-21

---

### OQ-021 — Prioridad total de múltiples promociones individuales
**Pregunta:** Si hay más de dos promociones individuales aplicables para un plato, ¿cómo se selecciona una sola de forma determinística?  
**Resolución:** Algoritmo total en MVP: (1) calcular precio final de cada promoción vigente/aplicable; (2) elegir menor precio final; (3) si empata, `created_at` más antiguo; (4) si persiste empate técnico, menor `id`. Luego el sistema muestra opciones elegibles (separado/combo) y aplica la elección manual del cliente vía mozo con exclusión mutua por ítem/contexto.  
**Impacto:** Se cierra completamente la prioridad de promociones y se mantiene consistencia con deshabilitación de precio base, selección manual de combo y no doble aplicación conflictiva.  
**Fecha resolución:** 2026-04-21

---

### OQ-022 — Frontera formal de día operativo y turnos cruzando medianoche
**Pregunta:** ¿Cómo se define formalmente el día operativo y cómo impacta en cierres, reportes y stock cuando un turno cruza medianoche?  
**Resolución:** El día operativo se identifica por la **fecha de inicio del turno** en `America/La_Paz`. Todo evento del turno (ventas, pagos, consumos/restituciones de stock, cierre) se imputa a ese día operativo, aunque ocurra después de medianoche.  
**Impacto:** Se unifica criterio de cierre de día, reportes diarios y stock diario; se elimina ambigüedad entre corte calendario y operación real del turno.  
**Fecha resolución:** 2026-04-21

---

### OQ-023 — Reverso/anulación de cobro en MVP
**Pregunta:** ¿Cuál es el flujo mínimo de anulación de pagos en MVP sin romper integridad operativa?  
**Resolución:** Se habilita reverso/anulación como **asiento compensatorio** vinculado al pago original (sin borrado físico), con motivo obligatorio y auditoría completa. No se permite reversar más del saldo reversible ni reversar pagos de día operativo ya cerrado. Si el reverso reabre saldo, la mesa vuelve a pendiente y se bloquea cierre operativo hasta regularización.  
**Impacto:** Se incorpora capacidad mínima de corrección de cobros con trazabilidad y controles de integridad, sin ampliar scope fuera de MVP.  
**Fecha resolución:** 2026-04-21

---

### OQ-024 — Consistencia de estado documental PRD/PROPOSAL
**Pregunta:** ¿Cómo evitar contradicción entre estados de documentos de producto durante pre-next-phase?  
**Resolución:** Para esta iteración, PRD y PROPOSAL quedan alineados en estado **Aprobación interna**. Cualquier desalineación futura debe explicitar criterio de fase en el encabezado de ambos documentos.  
**Impacto:** Se evita ambigüedad de gobernanza documental y se mejora trazabilidad del readiness antes de la siguiente fase.  
**Fecha resolución:** 2026-04-21

---

### OQ-025 — Estándar monetario único del MVP
**Pregunta:** ¿Qué moneda, precisión, política y punto de redondeo se aplican de forma única en MVP para evitar divergencias entre comanda, ticket y reportes?  
**Resolución:** Se fija BOB como moneda oficial, precisión de 2 decimales y redondeo half-up aplicado al total de línea de ítem; subtotal/total se calculan por suma de líneas redondeadas. Comanda, ticket y reportes deben exponer los mismos montos para la misma operación.  
**Impacto:** Se elimina ambigüedad monetaria transversal y se habilita validación testeable de consistencia entre módulos operativos.  
**Fecha resolución:** 2026-04-21

---

### OQ-026 — Cierre #3: colaboración concurrente, trazabilidad total y restricción por turno
**Pregunta:** ¿Cómo se debe cerrar el criterio de operación multi-mozo sobre una misma mesa/comanda sin romper gobernanza de turnos ni trazabilidad MVP?  
**Resolución:** Se aprueba para MVP: (1) concurrencia colaborativa de dos o más mozos sobre la misma mesa/comanda según RBAC; (2) visibilidad en tiempo real de cada acción para actores relevantes mostrando autor; (3) trazabilidad total obligatoria con quién/qué/cuándo/contexto y before/after cuando aplique; (4) bloqueo de apertura/operación de comandas para mozos no asignados al turno activo; (5) asignación dinámica de mozos (alta/baja) durante turno con auditoría obligatoria.  
**Impacto:** Quedan alineados PRD/PROPOSAL/SPEC sin ampliar scope fuera de MVP, manteniendo consistencia con RBAC, cierre operativo, pagos parciales, stock y promociones.  
**Fecha resolución:** 2026-04-21

---

### OQ-027 — Concurrencia transaccional en colisiones límite
**Pregunta:** En operaciones críticas concurrentes sobre la misma mesa/comanda/cierre, ¿cómo se define un resultado único sin inconsistencias?  
**Resolución:** Se adopta atomicidad por entidad objetivo con regla "primero en confirmar, primero en aplicar". Toda operación rezagada se rechaza por conflicto con estado actualizado y revalidación obligatoria al confirmar. Se prohíbe explícitamente stock negativo, saldo negativo y cierre con pendientes.  
**Impacto:** Se elimina comportamiento no determinístico en colisiones límite y se refuerza integridad operativa/auditoría sin ampliar scope del MVP.  
**Fecha resolución:** 2026-04-21

---

### OQ-028 — Contrato sesión/token de fase actual
**Pregunta:** ¿Cuál es el contrato exacto FE↔BE para autenticación/autorización en MVP actual y cómo se distingue de la sesión de usuario?  
**Resolución (actualizada):** FE↔BE opera con API Key en `X-API-Key`. No se utiliza access token en esta fase. La autenticación por API Key se complementa con autorización RBAC en backend y contrato explícito de 401 vs 403 con auditoría. La sesión de usuario interna del sistema se mantiene server-side (sin token de cliente) con ciclo de vida independiente para control operativo y trazabilidad.  
**Impacto:** Se simplifica el contrato cliente-servidor para MVP, se alinea UX/API con seguridad y se separan responsabilidades entre autenticación técnica FE↔BE (API Key) y sesión operativa interna (server-side).  
**Fecha resolución:** 2026-04-21

---

### OQ-029 — Estado exacto de mesa posterior a reverso
**Pregunta:** ¿A qué estado debe quedar una mesa luego de reversar un pago y cómo se bloquea el cierre operativo?  
**Resolución:** Si el reverso deja saldo > 0, la mesa pasa obligatoriamente a `esperando_cuenta`; si saldo = 0, mantiene estado consistente de cierre (`libre` cuando corresponda). Se bloquea cierre operativo mientras haya saldo pendiente y se audita before/after con saldo previo/posterior.  
**Impacto:** Se elimina ambigüedad de estados post-reverso y se preserva consistencia entre billing, mesas y cierre operativo.  
**Fecha resolución:** 2026-04-21

---

### OQ-030 — Registro de mesa con capacidad válida
**Pregunta:** ¿Qué validación mínima de capacidad debe exigirse al crear/editar mesas en MVP?  
**Resolución:** La capacidad de mesa debe ser entera y mayor a 0. Se rechazan valores inválidos (nulos, no enteros o <=0) y se auditan cambios de mesa/capacidad con before/after.  
**Impacto:** Se evita carga de datos inconsistentes en operación diaria y se fortalece trazabilidad administrativa.  
**Fecha resolución:** 2026-04-21

---

### OQ-031 — Asignación inicial de mozo al abrir comanda
**Pregunta:** ¿La asignación inicial del mozo en una mesa debe impedir que otros mozos del turno atiendan esa mesa?  
**Resolución:** No. Al abrir comanda se registra mozo inicial asignado, pero la asignación no es exclusiva: pueden operar mozo inicial y/o cualquier mozo activo del turno con permisos RBAC. Se audita asignación inicial y acciones de otros mozos.  
**Impacto:** Se mantiene continuidad operativa en salón sin romper gobernanza RBAC/turno ni trazabilidad.  
**Fecha resolución:** 2026-04-21

---

### OQ-032 — Retiro en KDS por cualquier mozo activo
**Pregunta:** ¿Quién puede retirar pedidos listos en KDS cuando hay operación multi-mozo en turno?  
**Resolución:** Cualquier mozo activo del turno puede retirar pedidos listos, independientemente de quién abrió la comanda. Debe registrarse autor de retiro y propagarse estado en tiempo real.  
**Impacto:** Se reduce fricción operativa en cocina/salón y se conserva trazabilidad por actor.  
**Fecha resolución:** 2026-04-21

---

### OQ-033 — Indicador KDS de tiempo transcurrido
**Pregunta:** ¿Cómo se mide y conserva el tiempo de espera en KDS para uso operativo y de reporte?  
**Resolución:** KDS muestra tiempo transcurrido desde envío a cocina en tiempo real; al pasar a `listo` y al `retiro` se persiste el valor final para reporte/auditoría.  
**Impacto:** Se estandariza métrica de espera de cocina con trazabilidad histórica utilizable en reportes de performance.  
**Fecha resolución:** 2026-04-21

---

### OQ-034 — Cierre punto 1: reportes MVP sin método de pago en v1
**Pregunta:** ¿Cómo cerrar el alcance de reportes MVP y pagos para evitar contradicción entre documentos sobre método de pago?  
**Resolución:** **Superseded por OQ-035.** Se mantiene en v1 la ausencia de integración de métodos de pago externos, pero el alcance final de reportes MVP queda cerrado por OQ-035 e **incluye obligatoriamente `RF-REP-05` (stock por producto: definido/vendido/saldo)** además de ventas por período, platos más pedidos, performance por mozo y estado de pago operativo.  
**Impacto:** Se elimina la contradicción documental y queda una única verdad vigente para reportes MVP, sin cambios de alcance funcional respecto del cierre actual.  
**Fecha resolución:** 2026-04-21

---

## Cómo usar este archivo

- Agregar una pregunta: sumar fila a la tabla con el próximo número correlativo
- **Resolver:** mover a sección **Resueltas**, cambiar estado a `resolved`, documentar resolución e impacto
- **Diferir:** cambiar estado a `deferred` y agregar nota de contexto en la tabla
- Si una pregunta bloquea el avance de un módulo, escalarla al PRD o al diseño según corresponda
