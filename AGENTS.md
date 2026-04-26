# AGENTS.md

Guía operativa para agentes en este repositorio.

## 1) Rol del orquestador

- El orquestador coordina fases, no fuerza implementación sin autorización del usuario.
- No avanza a un nuevo feature sin aprobación explícita del usuario.
- Debe preservar trazabilidad y gobernanza documental en cada paso.

## 2) Flujo obligatorio de trabajo

1. Issue en GitHub
2. Branch por feature
3. Commits incrementales
4. Pull Request

Reglas:
- Un feature por vez.
- No iniciar feature sin gate de aprobación.
- No mezclar features en la misma rama/PR.

## 3) Gates de autorización

Para iniciar un feature:
- Issue en `status:approved`.
- Autorización explícita del usuario para ese feature.

Para pasar al siguiente feature:
- Usuario autoriza explícitamente.

## 4) Estándar de ingeniería (obligatorio)

- **TDD estricto**: Red -> Green -> Refactor. Cobertura obligatoria.
- **Framework de Pruebas**: Usar obligatoriamente `vitest`.
- **TypeScript Estricto**: Prohibido el uso de `any`. Todo parámetro y retorno debe tener un tipado fuerte y explícito.
- **Arquitectura hexagonal** en backend (Ports & Adapters):
  - El dominio puro no puede depender de frameworks (prohibido usar `@Injectable` o decoradores de TypeORM/Prisma en Entidades de Dominio).
  - Los controladores y casos de uso se comunican mediante DTOs. Los casos de uso manipulan Entidades puras.
  - Toda dependencia de infraestructura (ej. base de datos) se define mediante Interfaces (Puertos) en la capa de Dominio, y se implementa en Adaptadores.
- **Clean Code, SOLID y DRY**:
  - Respetar Single Responsibility Principle (SRP) y Dependency Inversion (DIP).
  - Cero *magic numbers* o *magic strings*. Usar constantes centralizadas.
  - Todo código repetido (Tipos, Interfaces, DTOs compartidos y códigos de error canónicos) DEBE ir en `src/packages/shared-utils/`.
- Contrato API y OpenAPI actualizados por feature.
- Cumplir Definition of API Done antes de cerrar endpoint/feature.

Referencias:
- `docs/technicals-requirements/testing/testing-standard.md`
- `docs/technicals-requirements/api/definition-of-api-done.md`

## 5) Arquitectura objetivo del repositorio

Monorepo bajo `src/`:

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

**Reglas estrictas de Monorepo y Diseño Modular:**
- **Fronteras Inquebrantables:** 
  - `apps/web` (UI) NO debe contener lógica de negocio crítica ni acceso directo a DB.
  - `packages/data-access` (Prisma/DB) NO debe exponer reglas de negocio ni depender de UI.
  - `packages/shared-utils` NO debe depender de los módulos de dominio (`backend` o `data-access`) para mantener su reusabilidad universal.
- **Prohibido:** Crear código o módulos sueltos fuera de estas carpetas objetivo. Cada nueva funcionalidad MVP debe acoplarse respetando este scaffolding.
- **Excepciones:** Si una implementación exige romper esta estructura, el agente DEBE pausar y pedir autorización explícita al usuario justificando el trade-off técnico.

Referencias:
- `docs/technicals-requirements/architecture.md`
- `docs/sdd/DESIGN.md`

## 6) Contrato FE↔BE vigente

- Comunicación: API REST
- Backend runtime objetivo: NestJS + Fastify
- Frontend framework objetivo: Next.js + React (App Router)
- Autenticación FE↔BE: `X-API-Key`
- Errores canónicos: 401/403/409/422 con code semántico

Referencias:
- `docs/technicals-requirements/api/backend.md`
- `docs/technicals-requirements/api/auth-and-consumption.md`
- `docs/technicals-requirements/api/canonical-errors.md`

## 7) Documentación viva (obligatoria)

Si cambia contrato o comportamiento:
1. Actualizar fuentes normativas (`PRD`, `sdd/PROPOSAL`, `sdd/SPEC`, `sdd/DESIGN`, `sdd/TASKS`) según corresponda.
2. Actualizar `docs/technicals-requirements/**`.
3. Actualizar `backend-openapi.yaml` para endpoints afectados.

## 8) Prohibiciones

- No iniciar implementación sin autorización explícita del usuario.
- No avanzar de feature sin autorización explícita del usuario.
- No cerrar feature sin evidencia de tests (unit/integration/e2e + coverage cuando aplique).
- No introducir alcance V2 en features MVP sin change explícito aprobado.
