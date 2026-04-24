# PRD — Sistema Interno de Pedidos para Restaurante

**Versión:** 2.2  
**Fecha:** 2026-04-21  
**Estado:** Aprobación interna

---

## 1. Visión del Producto

Sistema web de uso **interno** para el personal del restaurante que digitaliza el flujo completo de operación: desde la toma de pedidos en mesa hasta el cierre de cuentas. El objetivo es eliminar el papel y reducir errores de comunicación entre salón y cocina.

**No es** un sistema de pedidos para clientes finales. Es una herramienta de gestión operativa para el equipo del restaurante.

---

## 2. Actores y Roles

| Rol | Responsabilidad principal |
|-----|--------------------------|
| **Mozo / Mesero** | Toma pedidos en mesa, los envía a cocina, solicita la cuenta |
| **Cocina** | Recibe pedidos en tiempo real, gestiona preparación, marca ítems listos |
| **Cajero** | Genera y cierra cuentas, registra pagos |
| **Administrador** | Gestiona menú, usuarios y reportes operativos |

---

## 3. Requisitos Funcionales

### 3.1 Gestión de Usuarios y Roles
- CRUD de usuarios del sistema
- Modelo RBAC flexible para MVP: un usuario puede tener múltiples roles (relación N:N usuario-rol)
- Roles operativos base del MVP: mozo, cocina, cajero, administrador
- Permisos por rol definidos por vista y acción dentro de la vista (ejemplo en pedidos/comanda: ver, crear/guardar, editar, cancelar ítem, enviar a cocina)
- Permisos efectivos del usuario calculados como unión de permisos de todos sus roles asignados
- Política de seguridad deny by default: sin permiso explícito no hay acceso ni ejecución de acción
- Backend como fuente de verdad de autorización; frontend solo refleja/habilita UX según permisos efectivos
- Login con credenciales internas
- Contrato FE↔BE (fase actual): API Key en header `X-API-Key`
- La autenticación FE↔BE no utiliza token en esta fase
- Respuestas 401 vs 403 definidas por contrato y auditadas (denegación con causa)
- Referencia de evolución V2: estrategia de identidad avanzada (pendiente de definición)
- Auditoría de cambios y autorización: quién ejecutó qué acción, en qué contexto y cuándo; incluir `before/after` cuando aplique

### 3.2 Gestión de Mesas
- Registro y edición de mesas con capacidad entera mayor a 0
- Rechazo explícito de capacidad inválida (nula, no entera o <= 0)
- Auditoría obligatoria de alta/edición de mesa y cambios de capacidad
- Estado por mesa: libre / ocupada / esperando cuenta
- Estados cerrados de mesa (MVP): `libre`, `ocupada`, `esperando_cuenta`
- Transiciones válidas de mesa (MVP): `libre -> ocupada` (apertura de comanda), `ocupada -> esperando_cuenta` (solicitud/generación de cuenta), `esperando_cuenta -> libre` (pago total + cierre)
- Bloqueos de mesa (MVP): no se permite `esperando_cuenta -> ocupada` ni `ocupada -> libre` por atajo operativo; toda liberación requiere saldo 0 y cierre
- Mapa visual del salón con estado en tiempo real *(V2)*
- Asignación inicial de mozo al abrir comanda
- La asignación inicial no es exclusiva: pueden operar el mozo inicial y/o cualquier otro mozo activo del turno con permisos RBAC
- Un mozo puede atender múltiples mesas simultáneamente
- Indicador de carga por mozo: cantidad de mesas activas visible para el admin
- Alerta configurable cuando un mozo supera el umbral de mesas activas (default: 4)
- Reasignación de mesa a otro mozo desde administración

### 3.3 Gestión del Menú
- CRUD de platos: nombre, descripción, precio, categoría
- MVP obligatorio de catálogo: categorías y subcategorías son parte del alcance mínimo y no se difieren a V2.
- Criterios mínimos de catálogo en MVP:
  - CRUD de categorías
  - CRUD de subcategorías
  - cada subcategoría debe pertenecer a una categoría activa
  - asignación obligatoria de productos/platos a categoría y subcategoría
- Gestión de promociones de platos (MVP): creación, edición, activación/desactivación y vigencia por tiempo (`desde`/`hasta`) y/o por cupo de platos promocionales
- Tipo de promoción por plato (MVP): precio fijo promocional o porcentaje de descuento sobre precio base
- Regla de aplicación — promoción individual (MVP): al agregar un ítem, si existe promoción vigente y aplicable al plato, se usa precio promocional y el precio base queda deshabilitado para ese ítem
- Regla de selección de promociones individuales (MVP): si hay múltiples promociones vigentes/aplicables para un mismo plato, se aplica la de menor precio final; si hay empate, desempata `created_at` más antiguo y luego menor `id`
- Regla operativa — promoción individual (MVP): mientras la promoción individual esté vigente/aplicable, el mozo no puede elegir precio base para ese plato
- Gestión de promociones combo (MVP): definición de combos con precio combo y componentes
- Regla de aplicación — combo (MVP): el cliente puede elegir platos por separado (precio normal/aplicable) o combo a precio combo; la selección la realiza manualmente el mozo según decisión del cliente
- Regla comercial total de decisión (MVP): el sistema primero resuelve la mejor opción individual por plato y luego muestra opciones elegibles (separado/combo) para elección manual del cliente vía mozo, aplicando exclusión mutua por ítem/contexto
- Regla de exclusión de pricing (MVP): para un mismo ítem/contexto no se permite doble aplicación conflictiva entre promoción individual y combo; debe quedar una única opción final aplicada
- Foto por plato *(V2)*
- Definición de **stock real del sistema (v1)**: existencia real de productos vendibles del catálogo (platos/bebidas), sin modelar insumos ni costos
- Stock operativo de platos (MVP): definición de cantidad disponible (cupo) por plato
- Parametrización de stock operativo (MVP): configuración por turno y/o por día calendario
- Regla de prioridad auditable (MVP): si coexisten configuración por turno y por día para el mismo plato/momento, prevalece la de turno y se registra qué regla se aplicó
- Regla de tope (MVP): el stock operativo diario por producto no puede superar su stock real del sistema (v1)
- Consumo de stock con promoción individual (MVP): consumo normal por ítem del plato promocionado
- Consumo de stock con combo (MVP): consumir stock operativo de cada componente del combo según cantidades definidas
- Categorías y subcategorías (entradas, principales, postres, bebidas)
- Variantes de un plato (tamaños, opciones) *(V2)*

### 3.4 Gestión de Pedidos
- Crear pedido vinculado a una mesa
- Solo puede existir una comanda abierta por mesa a la vez
- No se puede abrir un nuevo pedido/comanda si la comanda anterior de la mesa tiene saldo pendiente de pago
- Restricción por turno (MVP): solo mozos asignados al turno activo pueden abrir y operar comandas
- Concurrencia colaborativa (MVP): dos o más mozos asignados al turno activo pueden operar en paralelo la misma mesa/comanda según permisos RBAC
- Concurrencia transaccional en colisiones límite (MVP): operaciones críticas por entidad objetivo se confirman de forma atómica con regla "primero en confirmar, primero en aplicar"; operaciones rezagadas se rechazan con conflicto y estado actualizado
- Revalidación obligatoria al confirmar en operaciones críticas de mesa/comanda/cierre
- Auditoría obligatoria de conflictos de concurrencia (actor, operación, entidad, before/after, motivo de rechazo)
- Operaciones colaborativas permitidas (MVP): agregar/cancelar ítems, cerrar comanda y cerrar mesa, siempre sujetas a permisos y validaciones operativas de saldo/cierre
- Estados cerrados de comanda (MVP): `abierta`, `enviada`, `cerrada`
- Transiciones válidas de comanda (MVP): `abierta -> enviada`, `abierta -> cerrada` (si saldo=0), `enviada -> cerrada` (si saldo=0)
- Bloqueos de comanda (MVP): no se permiten transiciones desde `cerrada`; no se permite abrir nueva comanda en la mesa mientras exista saldo pendiente
- Agregar, quitar y modificar ítems del pedido
- Agregar notas por ítem ("sin sal", "término medio")
- UX comercial (MVP): antes de confirmar un agregado/cambio de ítems, el sistema debe sugerir al mozo promociones individuales y combos elegibles
- Trazabilidad comercial de precios (MVP): registrar oferta/elegibilidad mostrada, opción elegida por cliente vía mozo y precio final aplicado por ítem/combo
- Enviar pedido a cocina
- Regla de edición post-envío (MVP): en comanda enviada no se permite edición in-place de ítems ya enviados; los cambios se registran como delta auditable (agregado de nuevo ítem o anulación explícita de ítem anulable)
- Toda modificación post-envío queda registrada en bitácora de auditoría (usuario, timestamp, cambio y referencia de delta)
- Visibilidad en tiempo real (MVP): toda acción de un mozo sobre mesa/comanda se refleja automáticamente en actores relevantes, incluyendo autor de la acción
- Historial de cambios visible para el administrador
- Dividir pedido entre comensales *(V2)*

### 3.5 Pantalla de Cocina (KDS — Kitchen Display System)
- Vista en tiempo real de pedidos pendientes
- Pedidos ordenados por tiempo de espera (el más antiguo primero), sin distinción de mozo
- Cualquier mozo activo del turno puede retirar un pedido listo — no hay dependencia del mozo que abrió la comanda
- Registrar autor de retiro y propagar el cambio en tiempo real
- Indicador de tiempo transcurrido desde envío a cocina, actualizado en tiempo real
- Persistir valor final de tiempo transcurrido al pasar a listo y al retiro para reportes/auditoría
- Marcar ítem como "en preparación" y "listo"
- Alertas visuales para pedidos con mucho tiempo de espera *(V2)*

### 3.6 Gestión de Cuentas y Pagos
- Generar cuenta de una mesa
- Aplicar descuentos o cortesías manuales *(V2)*
- Registrar estado de pago de la cuenta/pedido (`pendiente` / `pagado`; `parcial` cuando existan pagos parciales)
- Permitir pagos parciales
- Regla de imputación de pagos parciales (MVP): cada pago se imputa en orden FIFO por fecha-hora de ítems/comandas dentro de la mesa (del más antiguo al más reciente)
- Impacto de la imputación (MVP): la reducción de saldo pendiente se calcula sobre ítems efectivamente imputados por FIFO y debe quedar trazada en ticket y auditoría
- Múltiples métodos de pago por cuenta *(V2)*
- Dividir cuenta entre comensales *(V2)*
- Emisión de ticket interno con detalle: ítems, cantidades, precios, total, estado de pago y trazabilidad de imputación
- Facturación fiscal *(fase posterior)*
- Visualización en tiempo real para caja de mesas con cuenta/pedido pendiente de pago
- Definición operativa: una mesa está pendiente mientras su saldo total sea mayor a 0
- Invariante de integridad de saldos: no se permite saldo negativo en cuenta/mesa ni stock negativo por operaciones operativas
- No se permite cerrar turno ni día operativo si existe al menos una mesa con cuenta/pedido pendiente de pago
- El cierre de turno y de día operativo se habilita únicamente cuando todas las mesas del período quedaron pagadas
- En cierre de turno/día se debe ejecutar revalidación final de pendientes en tiempo real antes de confirmar
- Cierre de mesa (vuelve a estado "libre")
- Reverso/anulación de pago (MVP mínimo): permitido como asiento compensatorio enlazado al pago original, con motivo obligatorio, auditoría completa y sin borrado del pago original
- Control de integridad de reverso (MVP): no se puede reversar sobre día operativo cerrado ni reversar dos veces el mismo saldo; si el reverso reabre saldo, la mesa vuelve a pendiente y se bloquea cierre operativo
- Estado exacto post-reverso (MVP): si el reverso deja saldo > 0, la mesa pasa obligatoriamente a `esperando_cuenta`; si el saldo queda en 0, el estado debe permanecer consistente con cierre (`libre` cuando corresponda)
- Auditoría reforzada de reverso: registrar before/after de estado de mesa y saldo previo/posterior

### 3.7 Gestión de Insumos y Costos *(V2)*

#### Registro de Insumos *(V2)*
- CRUD de insumos: nombre, unidad de medida (kg, litro, unidad), proveedor
- Registro de compras de insumos: cantidad, precio pagado, fecha, proveedor
- Stock del día calculado automáticamente: insumos comprados − insumos consumidos por pedidos
- Alertas de stock bajo por insumo *(V2)*

#### Recetas por Plato *(V2)*
- Vincular cada plato a una receta
- La receta define qué insumos consume cada plato y en qué cantidad
- Al enviar un pedido a cocina → descuento automático del stock del día

#### Costo por Plato *(V2)*
- Costo calculado automáticamente: receta × precio actual de insumos
- Historial de variación de costo por cambio de precio de insumos *(V2)*

#### Cruce Inversión vs. Ventas *(V2)*
- Reporte de margen bruto por plato: precio de venta − costo de producción
- Reporte de rentabilidad del período: total vendido vs. total invertido en insumos
- Identificación de platos con margen negativo o muy bajo *(V2)*
- Comparativo entre períodos *(V2)*

### 3.8 Gestión de Turnos
- Debe existir un único turno activo a la vez
- Cada turno registra fecha-hora de inicio y fecha-hora de fin (puede cruzar medianoche)
- El modelo de turnos no se corta por día calendario
- Definición de día operativo (MVP): en `America/La_Paz`, el día operativo se identifica por la fecha de inicio del turno y absorbe sus eventos aunque el turno termine al día siguiente
- Cada turno registra mozos asignados
- Asignación dinámica de mozos (MVP): durante un turno activo, administración puede agregar/quitar mozos
- Toda alta/baja de asignación de mozo en turno debe quedar auditada (quién, qué, cuándo y contexto)
- Apertura y cierre de turno manual por el administrador
- Regla de cierre operativo: no se puede cerrar turno/día con mesas pendientes de cobro; el sistema debe bloquear y listar pendientes para resolución

### 3.9 Reportes y Estadísticas
- Reportes filtrables por las siguientes dimensiones (combinables):
  - Por turno
  - Por día calendario
  - Por mozo
  - Por categoría de plato
  - Por estado de pago operativo
  - Por franja horaria (para identificar picos de demanda)
- Ventas por período (día / semana / mes)
- Platos más pedidos
- Performance por mozo (mesas atendidas, tiempo de retiro de pedidos listos)
- Estado de pago operativo (pagado / pendiente / parcial)
- Reporte de stock por producto (stock definido / stock vendido / stock saldo)
- Tiempo promedio de preparación *(V2)*
- Margen bruto por plato *(V2)*

---

## 4. Requisitos No Funcionales

- **Interfaz responsiva:** optimizada para tablet (mozos) y pantalla grande (cocina)
- **SLA de respuesta:** operaciones de usuario con p95 ≤ 3 segundos
- **Disponibilidad objetivo:** 99.9% para componentes desplegados del MVP
- **Capacidad esperada:** forecast operativo de 15 TPS
- **Autenticación FE↔BE:** API Key en `X-API-Key` para operaciones protegidas
- **Gestión de API Key:** soporte de activación/desactivación/rotación en backend (según gobernanza)
- **Autorización:** RBAC separado de autenticación por API Key
- **Consistencia:** actualización automática para todos los actores (cliente↔backend y entre clientes)
- **Seguridad de autenticación/autorización:** contrato explícito 401 vs 403 con auditoría de denegaciones
- **Compatibilidad web:** últimas versiones estables de Firefox, Chrome, Safari y Edge
- **Observabilidad:** logs estructurados desde día 1 (Grafana/Loki como evolución posterior)
- **Protocolo de medición NFR:** la fuente de verdad para validación de p95/TPS/disponibilidad es `SPEC.md` sección `3.2 Protocolo único de medición NFR (aceptación)`.
- **Multiusuario simultáneo** sin conflictos de escritura
- **Disponibilidad offline básica:** si cae la red, el pedido en curso no se pierde *(V2)*
- **Auditoría completa:** toda acción queda registrada con quién, qué, cuándo y contexto (mesa/comanda/ítem), con `before/after` cuando aplique

---

## 5. MVP — Alcance Mínimo Viable

### Criterio
El restaurante debe poder **tomar un pedido, enviarlo a cocina y cobrar la cuenta** — todo desde el sistema, sin papel.

### Flujo mínimo que debe funcionar

```
Mozo crea pedido en mesa
    → agrega ítems del menú
    → envía pedido a cocina
Cocina ve el pedido en tiempo real
    → marca ítems como listos

Cajero genera la cuenta
    → registra el pago
    → cierra la mesa (vuelve a "libre")
```

### Módulos incluidos en el MVP

| Módulo | Alcance MVP |
|--------|-------------|
| **Usuarios** | Login + RBAC flexible (usuario multirol N:N), 4 roles base (mozo, cocina, cajero, admin), permisos por vista/acción, deny by default, enforcement en backend y auditoría de autorización/acciones; contrato FE↔BE por API Key (`X-API-Key`) en fase actual |
| **Turnos** | Un único turno activo a la vez, registro por fecha-hora (inicio/fin), apertura/cierre manual, atribución al día operativo por fecha de inicio y asignación dinámica auditada de mozos |
| **Menú** | CRUD de categorías, subcategorías y platos con precio; cada subcategoría pertenece a una categoría activa y cada plato/producto se asigna a categoría + subcategoría |
| **Stock operativo de platos** | Cupos/cantidad disponible por plato para operación MVP, parametrizable por turno y/o día calendario; prioridad determinística: turno sobre día |
| **Stock real del sistema (v1)** | Existencia real por producto vendible de catálogo (platos/bebidas) usada como tope del stock operativo diario; no incluye insumos/costos |
| **Promociones y combos** | Promoción individual por plato (precio fijo o % descuento) con vigencia por tiempo y/o cupo, deshabilitando precio base mientras aplique y selección determinística por menor precio final (desempate por antigüedad/id); combos con precio combo elegidos manualmente por mozo según cliente, con sugerencia previa obligatoria y trazabilidad de opción/precio aplicado |
| **Mesas** | Estados cerrados (`libre`, `ocupada`, `esperando_cuenta`) con transiciones válidas y bloqueos operativos; alta/edición con capacidad entera > 0 y auditoría de cambios; indicador de carga por mozo |
| **Pedidos** | Crear, agregar/cancelar ítems, notas por ítem, asignación inicial de mozo al abrir comanda (no exclusiva), operación colaborativa concurrente por mozos asignados al turno activo con visibilidad en tiempo real y autor visible, control transaccional atómico en colisiones límite y revalidación al confirmar, modificar post-envío solo vía deltas auditables (sin edición in-place), comanda con estados cerrados (`abierta`, `enviada`, `cerrada`) |
| **Cocina (KDS)** | Vista en tiempo real ordenada por tiempo de espera, marcar ítems listos, retiro por cualquier mozo activo del turno con autor auditado, indicador en tiempo real desde envío a cocina y persistencia de tiempo final en listo/retiro |
| **Cuentas** | Generar cuenta, pagos parciales con imputación FIFO, reverso/anulación de pago con auditoría obligatoria e integridad mínima (saldo no negativo), estado exacto post-reverso (`esperando_cuenta` si saldo>0), ticket interno con trazabilidad de imputación, registrar pago, cerrar mesa, visualizar pendientes de cobro en tiempo real para caja |
| **Reportes** | Ventas por período (día/semana/mes), platos más pedidos, performance por mozo, estado de pago operativo y reporte de stock por producto (definido/vendido/saldo) |

### Catálogo MVP congelado para trazabilidad (P0)

Para asegurar trazabilidad 1:1 PRD↔SPEC en esta iteración, el catálogo funcional mínimo del MVP queda congelado en las siguientes capacidades críticas:

1. **Gestión de usuarios (mínimo operativo):** CRUD básico de usuarios internos y asignación de roles operativos.
2. **Gestión de menú/platos/categorías/subcategorías:** CRUD básico de categorías, subcategorías y platos con precio; cada subcategoría pertenece a categoría activa y cada plato queda asignado a categoría + subcategoría.
3. **Asignación y reasignación de mesa:** administración puede reasignar mesa activa entre mozos con auditoría.
4. **Indicador de carga por mozo:** visibilidad de mesas activas por mozo con umbral de alerta configurable (default 4).
5. **Notas por ítem:** cada ítem de comanda puede registrar nota operativa visible para cocina.
6. **Orden KDS por antigüedad:** cola de cocina ordenada por mayor tiempo de espera primero.
7. **Stock diario por turnos (MVP):** distribución automática inicial por turnos habilitados, ajuste manual con restricciones (tope diario y no quedar bajo lo vendido) y restitución de 1 unidad por anulación/eliminación de ítem en comanda abierta.

---

## 6. Fuera de Scope — V2 en adelante

- Mapa visual del salón
- Fotos de platos
- Variantes de platos
- División de cuenta entre comensales
- Integraciones de métodos de pago (tarjetas/QR/factura/etc.)
- Múltiples métodos de pago por cuenta
- Descuentos y cortesías manuales generales
- Gestión de stock de insumos (insumos, compras y recetas por plato)
- Gestión de costos (costo por plato e historial de variación)
- Reportes de rentabilidad (margen bruto por plato, rentabilidad por período y comparativos)
- Disponibilidad offline
- Tiempo promedio de preparación

---

## 7. Métricas de Éxito

- Tiempo de cierre de mesa: reducción vs. proceso manual
- Errores de pedido: cantidad de pedidos modificados post-envío a cocina
- Adopción: % del personal usando el sistema en lugar de papel en la primera semana
- Control de cierre operativo: 0 cierres de turno/día ejecutados con mesas pendientes de pago
