# Definition of API Done (Normativo)

> **Tipo de documento:** Normativo.  
> Un endpoint/contrato API **NO** se considera cerrado hasta cumplir todos los criterios obligatorios de este checklist.

---

## 1) Regla de cierre

Un cambio de API (nuevo endpoint o modificación de contrato existente) **MUST** cumplir este DoD completo en el mismo ciclo de feature (issue -> branch -> commits -> PR).

---

## 2) Checklist obligatorio de cierre API

### 2.1 Contrato
- [ ] El endpoint está definido en [`backend-openapi.yaml`](./backend-openapi.yaml) con `path`, `method` y `operationId`.
- [ ] Tiene request/response schemas explícitos y consistentes con implementación.
- [ ] Declara códigos HTTP aplicables y `code` semántico canónico cuando corresponda.
- [ ] Define seguridad (`apiKeyAuth`) para rutas protegidas.
- [ ] Está versionado bajo `/api/v1/...`.

### 2.2 Errores canónicos
- [ ] `401` y `403` se distinguen correctamente en endpoints protegidos.
- [ ] `409`/`422` se usan según reglas de dominio/concurrencia.
- [ ] Codes canónicos usados: `AUTH_UNAUTHENTICATED`, `AUTH_FORBIDDEN`, `STATE_INVALID`, `STOCK_CONFLICT`, `CONCURRENCY_CONFLICT`, `CLOSURE_BLOCKED`.

Referencia: [`canonical-errors.md`](./canonical-errors.md)

### 2.3 Trazabilidad y observabilidad
- [ ] El flujo registra trazabilidad operativa mínima (actor/acción/contexto/timestamp) cuando aplica.
- [ ] Se preserva correlación extremo a extremo (`correlation_id`) en operaciones críticas.
- [ ] El consumidor puede reconciliar estado ante conflicto/colisión.

Referencia: [`traceability-rules.md`](./traceability-rules.md), [`caches-freshness-observability.md`](./caches-freshness-observability.md)

### 2.4 Calidad y validación
- [ ] Existen tests unitarios para reglas de negocio del endpoint.
- [ ] Existen tests de integración/e2e para contrato y códigos de respuesta.
- [ ] Cuando el caso de uso tenga consumo web, existe validación de consumo desde `src/apps/web/` con evidencia visible para cliente (pantalla/flujo funcional en PR).
- [ ] Existe e2e end-to-end del caso de uso integrado (`UI -> API -> persistencia -> UI`) con resultado verificable.
- [ ] El pipeline de pruebas y coverage está en verde para el cambio.

### 2.5 Gobernanza de entrega
- [ ] PR enlaza el issue del feature (`Closes #N`).
- [ ] El cambio respeta alcance MVP/V2 vigente.
- [ ] No se avanzó al siguiente feature sin autorización explícita del usuario.
- [ ] El feature no viola la estructura monorepo objetivo (`src/apps/web`, `src/packages/backend`, `src/packages/data-access`, `src/packages/shared-utils`).
- [ ] Si hubo excepción de estructura/arquitectura, se pidió y obtuvo autorización explícita del usuario **ANTES** de implementar, con razones técnicas y trade-offs documentados.

---

## 3) Criterio de rechazo

Si cualquier ítem obligatorio queda incumplido, el endpoint **MUST** considerarse “incompleto” y el feature **MUST NOT** darse por cerrado.
Esto incluye violaciones de estructura objetivo o excepciones sin aprobación explícita previa del usuario.

---

## 4) Fuentes normativas

- [`SPEC.md`](../../sdd/SPEC.md)
- [`DESIGN.md`](../../sdd/DESIGN.md)
- [`TASKS.md`](../../sdd/TASKS.md)
- [`backend.md`](./backend.md)
- [`backend-openapi.yaml`](./backend-openapi.yaml)
