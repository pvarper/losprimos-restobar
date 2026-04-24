# Canonical Errors (API)

> Documento índice de errores canónicos (sin duplicar detalle).  
> La fuente de verdad contractual está en [`SPEC.md`](../../sdd/SPEC.md) y su alineación técnica en [`DESIGN.md`](../../sdd/DESIGN.md).

---

## 1) Catálogo canónico vigente

- `AUTH_UNAUTHENTICATED` → `401`
- `AUTH_FORBIDDEN` → `403`
- `STATE_INVALID` → `422`
- `STOCK_CONFLICT` → `409`
- `CONCURRENCY_CONFLICT` → `409`
- `CLOSURE_BLOCKED` → `409`

### Fuente de verdad
- [`SPEC.md`](../../sdd/SPEC.md) → §2.1.1 (mini-matriz de contrato de errores).
- [`DESIGN.md`](../../sdd/DESIGN.md) → §9 (códigos de error canónicos alineados con SPEC).

---

## 2) Reglas de uso contractual

- Los endpoints protegidos deben distinguir de forma explícita autenticación vs autorización (`401` vs `403`).
- Las colisiones de concurrencia y bloqueos operativos deben devolver `409` con code canónico.
- Violaciones de transición/estado de dominio deben devolver `422` con code canónico.

### Fuente de verdad
- [`SPEC.md`](../../sdd/SPEC.md) → RF-AUTH-14, §2.1.1, escenarios GWT de 401/403 y colisiones.
- [`DESIGN.md`](../../sdd/DESIGN.md) → §7 (convenciones API), §9 (catálogo canónico), §11 (seguridad/autorización).

---

## 3) Gobernanza de cambios

1. Si cambia un code canónico o su mapping HTTP, primero actualizar [`SPEC.md`](../../sdd/SPEC.md).
2. Luego ajustar la alineación arquitectónica en [`DESIGN.md`](../../sdd/DESIGN.md).
3. Finalmente sincronizar este índice.
