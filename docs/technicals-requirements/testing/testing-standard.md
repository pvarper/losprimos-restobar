# Testing Standard (Normativo)

> **Tipo de documento:** Normativo.  
> Define el estándar de desarrollo guiado por pruebas para el MVP backend + web.

---

## 1) Objetivo

Establecer una forma única de construir features con **TDD estricto**, validación automática y trazabilidad para slices **backend + web** con contrato API.

Fuentes relacionadas:
- [`SPEC.md`](../../sdd/SPEC.md)
- [`DESIGN.md`](../../sdd/DESIGN.md)
- [`../api/definition-of-api-done.md`](../api/definition-of-api-done.md)
- [`../local-runtime.md`](../local-runtime.md)

---

## 2) Estándar de desarrollo (TDD estricto)

Todo cambio funcional **MUST** seguir este ciclo:

1. **Red:** escribir primero test que falla (unit/integration/e2e según alcance).
2. **Green:** implementar mínimo código para pasar.
3. **Refactor:** mejorar diseño sin romper tests.

Reglas obligatorias:
- No se cierra endpoint/feature sin tests pasando.
- No se cierra feature sin actualizar contrato OpenAPI cuando aplica.
- No avanzar al siguiente feature sin autorización explícita del usuario.

---

## 3) Frameworks y tooling de testing (vigente)

- **Runner unit/integration:** Vitest
- **Ejecución TS en tests:** Vitest (sin `ts-jest`)
- **E2E HTTP:** supertest
- **Testing NestJS:** @nestjs/testing
- **Servidor HTTP objetivo:** Fastify (via NestJS adapter)

Referencia de implementación actual:
- **Pendiente de implementación (no de definición):** el estándar ya fija Vitest + supertest + `@nestjs/testing`; falta materializar configuración/archivos en la primera entrega de scaffold monorepo, respetando gates de `../../sdd/TASKS.md`.

---

## 4) Comandos normativos

Secuencia mínima por feature:

1. `npm run build`
2. `npm run test:unit`
3. `npm run test:integration`
4. `npm run test:e2e`
5. `npm run test:cov`

Estos comandos **MUST** ejecutarse antes de abrir/cerrar PR del feature.

---

## 5) Ubicación de implementación y pruebas

- Código backend objetivo: `src/packages/backend/`
- Código frontend web objetivo: `src/apps/web/`
- Estructura obligatoria por paquete:
  - Unit: `src/packages/<package>/tests/unit/**/*.spec.ts`
  - Integration: `src/packages/<package>/tests/integration/**/*.spec.ts`
- Pruebas e2e objetivo (backend): `src/packages/backend/tests/e2e/**/*.e2e-spec.ts`
- Pruebas frontend web (unit/integration): `src/apps/web/**/tests/**/*.spec.*` (estructura final agnóstica al framework elegido).
- Pruebas e2e web/full-stack: `src/apps/web/**/tests/e2e/**/*.e2e.*` (o ruta equivalente documentada por el proyecto).
- Contrato API vivo: `docs/technicals-requirements/api/backend-openapi.yaml`

---

## 6) Cobertura mínima esperada

Baseline normativo inicial:

- **MUST** existir reporte de cobertura en cada feature (`npm run test:cov`).
- **MUST NOT** introducir módulos nuevos sin cobertura de pruebas asociadas.
- **Objetivo mínimo esperado en código nuevo/modificado:** **>= 80%** de líneas y funciones.

> Nota: si una fase requiere umbral más estricto, se eleva por decisión de gobernanza sin bajar este baseline.

---

## 7) Tipos de tests recomendados por alcance

1. **Unitarios** (obligatorios): reglas de dominio, guards, servicios.
2. **Integración** (obligatorios cuando hay contrato interno): módulos + adapters + persistencia.
3. **E2E** (obligatorios en endpoints/flows críticos): contrato HTTP, códigos de error, seguridad.

### 7.1 E2E full-stack obligatorio en flujos críticos

- En features MVP críticos, **MUST** existir al menos un e2e de punta a punta que valide `UI -> API -> persistencia -> UI`.
- El e2e debe cubrir caso exitoso y manejo de error canónico aplicable (`401/403/409/422` según feature).
- No se considera cerrado un slice crítico si solo hay evidencia e2e backend sin consumo web validado.

Mapeo sugerido:
- Auth/RBAC: unit + e2e (401/403/login).
- Reglas de concurrencia/estado: unit + integración + e2e.
- Flujos de caja/stock/reportes: unit + integración + e2e según criticidad.

---

## 8) Relación con runtime local

Este estándar depende del runtime local definido en:
- [`../local-runtime.md`](../local-runtime.md)

Si el runtime local no pasa verificación inicial, los resultados de test **MUST NOT** considerarse válidos para cierre de feature.

---

## 9) Check de calidad de arquitectura/estructura en PR (bloqueante)

Además de tests automáticos, cada PR **MUST** pasar este check documental/manual:

- [ ] No se crearon módulos/rutas fuera de `src/apps/web`, `src/packages/backend`, `src/packages/data-access`, `src/packages/shared-utils`.
- [ ] No se rompieron reglas de dependencia del monorepo definidas en `../architecture.md`.
- [ ] Si hubo excepción, existe solicitud explícita con justificación técnica, impacto, alternativas y trade-offs.
- [ ] La excepción (si aplica) tiene autorización explícita del usuario previa a la implementación.

Incumplir cualquier ítem bloquea aprobación de PR y cierre de feature.
