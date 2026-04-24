# Database Model & Entity Usage (Normativo)

> **Tipo de documento:** Normativo.  
> Define el modelo de base de datos objetivo y el propósito de uso de cada entidad para MVP.

---

## 1) Alcance y fuente de verdad

Este documento cubre el modelo persistente objetivo para backend (a implementar) en todos los dominios MVP.

Fuentes normativas/técnicas:
- `src/packages/data-access/prisma/schema.prisma` (**pendiente de implementación** en el scaffold monorepo; ver `../../sdd/TASKS.md` §0 y §6 para gate de inicio por feature)
- Reglas funcionales: [`../../sdd/SPEC.md`](../../sdd/SPEC.md)
- Diseño técnico: [`../../sdd/DESIGN.md`](../../sdd/DESIGN.md)

---

## 2) Modelo objetivo inicial (Auth/RBAC/API Key/Auditoría)

### 2.1 `User`
**Propósito:** representar usuario interno autenticable del sistema.

Campos relevantes:
- `id` (PK)
- `email` (único)
- `passwordHash`
- `isActive`
- `createdAt`, `updatedAt`

Relaciones:
- N:N con `Role` vía `UserRole`
- 1:N con `ApiKey` vía `ApiKey.ownerUserId` (un usuario puede tener múltiples claves activas/inactivas para rotación/revocación; cada API key pertenece a un único usuario).

Uso operativo:
- login/autenticación,
- activación/desactivación de usuarios,
- cómputo de permisos efectivos por roles.

### 2.2 `Role`
**Propósito:** agrupar permisos por rol operativo.

Campos relevantes:
- `id` (PK)
- `name` (único)
- `createdAt`, `updatedAt`

Relaciones:
- N:N con `User` vía `UserRole`
- N:N con `Permission` vía `RolePermission`

Uso operativo:
- RBAC multirol,
- deny-by-default por ausencia de permiso explícito.

### 2.3 `Permission`
**Propósito:** permiso granular por acción/vista.

Campos relevantes:
- `id` (PK)
- `code` (único)
- `createdAt`, `updatedAt`

Relaciones:
- N:N con `Role` vía `RolePermission`

Uso operativo:
- autorización de endpoints/acciones,
- validación de acceso en guards.

### 2.4 `UserRole`
**Propósito:** tabla puente para asignación multirol.

Claves:
- PK compuesta (`userId`, `roleId`)

Uso operativo:
- soportar usuarios con múltiples roles simultáneos,
- permitir unión de permisos efectivos.

### 2.5 `RolePermission`
**Propósito:** tabla puente para mapear permisos por rol.

Claves:
- PK compuesta (`roleId`, `permissionId`)

Uso operativo:
- definir matriz RBAC de forma normalizada,
- desacoplar roles de permisos concretos.

### 2.6 `ApiKey`
**Propósito:** persistir credenciales técnicas FE↔BE para autenticación por API Key.

Campos relevantes:
- `id` (PK)
- `keyHash`
- `ownerUserId` (FK)
- `isActive`
- `createdAt`
- `revokedAt` (nullable)

Uso operativo:
- validar autenticación FE↔BE por API Key,
- habilitar rotación/revocación de claves,
- sostener contrato 401/403 sin uso de access token.

### 2.7 `AuditEvent`
**Propósito:** trazabilidad operativa y de seguridad.

Campos relevantes:
- `id` (PK)
- `actorUserId` (nullable)
- `action`
- `entity`
- `context` (JSON nullable)
- `correlationId` (nullable)
- `createdAt`

Uso operativo:
- evidencia de decisiones allow/deny,
- trazabilidad de cambios críticos,
- soporte para auditoría de incidentes.

---

## 3) Modelo MVP por dominios operativos (baseline normativo)

> Esta sección alinea `database-model.md` con PRD/PROPOSAL/SPEC/DESIGN para evitar que el modelo técnico quede limitado a Auth.

### 3.1 Turnos y día operativo

- `OperationalDay`
  - Propósito: representar día operativo anclado a fecha de inicio de turno en `America/La_Paz`.
  - Campos mínimos: `id`, `operationalDate`, `timezone`, `status`, `closedAt`.
- `Shift`
  - Propósito: turno con inicio/fin fecha-hora y estado operativo.
  - Campos mínimos: `id`, `operationalDayId`, `startsAt`, `endsAt`, `status`.
  - Restricción: único turno activo global.
- `ShiftWaiterAssignment`
  - Propósito: alta/baja de mozos asignados a turno activo (con auditoría).
  - Campos mínimos: `shiftId`, `waiterUserId`, `assignedAt`, `unassignedAt`.

### 3.2 Mesas y comandas

- `Table`
  - Campos mínimos: `id`, `nameOrNumber`, `capacity`, `status` (`libre|ocupada|esperando_cuenta`).
- `Order` (Comanda)
  - Campos mínimos: `id`, `tableId`, `shiftId`, `status` (`abierta|enviada|cerrada`), `openedByUserId`, `closedAt`.
  - Restricción: una sola comanda abierta por mesa.
- `OrderItem`
  - Campos mínimos: `id`, `orderId`, `productId`, `quantity`, `unitPriceApplied`, `lineTotal`, `note`, `status`.
  - Regla: precio aplicado congelado por ítem al alta.
- `OrderDelta`
  - Propósito: registrar modificaciones post-envío sin edición in-place.
  - Campos mínimos: `id`, `orderId`, `orderItemId`, `deltaType`, `reason`, `createdByUserId`, `createdAt`.

### 3.3 Catálogo y pricing

- `Category`
  - Propósito: categoría de menú.
  - Campos mínimos: `id`, `name`, `isActive`, `createdAt`, `updatedAt`.
- `Subcategory`
  - Propósito: subcategoría de menú vinculada a categoría activa.
  - Campos mínimos: `id`, `categoryId`, `name`, `isActive`, `createdAt`, `updatedAt`.
  - Restricción: subcategoría siempre depende de categoría activa.
- `Product` (plato/bebida)
  - Campos mínimos: `id`, `name`, `description`, `basePrice`, `categoryId`, `subcategoryId`, `isActive`.
  - Restricción: asignación obligatoria a categoría + subcategoría válidas.
- `Promotion`
  - Campos mínimos: `id`, `productId`, `type` (`fixed|percent`), `value`, `startsAt`, `endsAt`, `quota`, `isActive`, `createdAt`.
- `Combo`
  - Campos mínimos: `id`, `name`, `comboPrice`, `isActive`, `createdAt`.
- `ComboComponent`
  - Campos mínimos: `comboId`, `productId`, `quantity`.
- `PricingDecision`
  - Propósito: trazabilidad comercial de elegibilidad, opción elegida y precio final.
  - Campos mínimos: `id`, `orderItemId`, `optionType`, `promotionId` (nullable), `comboId` (nullable), `finalPrice`, `createdAt`.

### 3.4 Stock operativo

- `ProductRealStock`
  - Propósito: stock real v1 por producto vendible.
  - Campos mínimos: `productId`, `quantity`, `updatedAt`.
- `OperationalStockDaily`
  - Propósito: stock operativo diario por producto.
  - Campos mínimos: `operationalDayId`, `productId`, `dailyQuota`.
- `OperationalStockShift`
  - Propósito: distribución de cupo por turno.
  - Campos mínimos: `shiftId`, `productId`, `shiftQuota`, `soldQuantity`.
- `StockMovement`
  - Propósito: consumo/restitución auditable (`turno|día`, saldo resultante, actor, timestamp).
  - Campos mínimos: `id`, `productId`, `shiftId`, `movementType`, `quantity`, `appliedRule`, `balanceAfter`, `actorUserId`, `createdAt`.

### 3.5 Billing

- `Payment`
  - Campos mínimos: `id`, `tableId`, `orderId` (nullable), `amount`, `currency` (`BOB`), `recordedByUserId`, `createdAt`.
- `PaymentAllocation`
  - Propósito: imputación FIFO del pago a ítems/comandas.
  - Campos mínimos: `id`, `paymentId`, `orderItemId`, `allocatedAmount`, `sequence`.
- `PaymentReversal`
  - Propósito: reverso compensatorio enlazado al pago original.
  - Campos mínimos: `id`, `paymentId`, `amount`, `reason`, `createdByUserId`, `createdAt`.

### 3.6 KDS y reportabilidad operativa

- `KitchenItemState`
  - Campos mínimos: `orderItemId`, `status`, `changedByUserId`, `changedAt`, `elapsedSecondsAtState`.
- `KitchenPickup`
  - Campos mínimos: `orderItemId`, `pickedUpByUserId`, `pickedUpAt`, `elapsedSecondsFinal`.

---

## 4) Reglas de integridad vigentes

1. `email` de `User` debe ser único.
2. `name` de `Role` debe ser único.
3. `code` de `Permission` debe ser único.
4. `UserRole` y `RolePermission` no permiten duplicados por PK compuesta.
5. `ApiKey` pertenece siempre a un `User` válido.
6. `Subcategory` debe pertenecer a `Category` activa.
7. `Product` debe tener siempre `categoryId` + `subcategoryId` coherentes.
8. No saldo negativo en `Payment`/`PaymentAllocation`/`PaymentReversal`.
9. No stock negativo en `OperationalStock*`/`StockMovement`.
10. `OperationalStockDaily` por producto no puede superar `ProductRealStock` del mismo producto.
11. Reverso nunca borra pago original; siempre crea movimiento compensatorio.
12. Montos monetarios en BOB con 2 decimales y redondeo half-up en total de línea.

---

## 5) Evolución esperada del modelo

No hay modelo implementado en esta rama; este documento define baseline objetivo para los features MVP #1..#6.

Las entidades de operación se incorporarán incrementalmente por feature, con actualización obligatoria de:
- `src/packages/data-access/prisma/schema.prisma`,
- este documento,
- y contratos relacionados (`backend-openapi.yaml`, trazabilidad/API DoD).

---

## 6) Regla de mantenimiento

Si cambia el modelo persistente objetivo/implementado, primero actualizar `src/packages/data-access/prisma/schema.prisma` en el PR del feature y luego sincronizar este documento normativo.
