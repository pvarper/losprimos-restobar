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

- **TDD estricto**: Red -> Green -> Refactor.
- **Arquitectura hexagonal** en backend (Ports & Adapters).
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

Referencias:
- `docs/technicals-requirements/architecture.md`
- `docs/sdd/DESIGN.md`

## 6) Contrato FE↔BE vigente

- Comunicación: API REST
- Backend runtime objetivo: NestJS + Fastify
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
