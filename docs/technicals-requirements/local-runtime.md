# Local Runtime Guide (Normativo)

> **Tipo de documento:** Normativo.  
> Define cómo ejecutar el runtime local del proyecto para desarrollo y validación técnica.

---

## 1) Cuándo aplicar esta guía

Aplicar esta guía cuando:
- Se inicia un feature nuevo.
- Se ejecutan pruebas de regresión locales.
- Se valida un PR antes de revisión/cierre.
- Se diagnostican errores de entorno o inconsistencias de ejecución.

---

## 2) Modelo de ejecución local

Modelo objetivo de trabajo:
- Monorepo con npm workspaces.
- Estructura objetivo bajo `src/apps` y `src/packages`.
- Validación por build + test + e2e + coverage por workspace afectado.

Estado actual en esta rama:
- **Pendiente de implementación:** scaffold de runtime/código aún no creado. La definición técnica ya está cerrada en `../sdd/DESIGN.md` y el inicio de implementación está gobernado por `../sdd/TASKS.md` (issue aprobado + autorización explícita por feature).

Referencia de stack/versionado:
- [`DESIGN.md`](../sdd/DESIGN.md) §21.10

---

## 3) Verificación inicial obligatoria

Antes de desarrollar:

1. Verificar versión de Node instalada (alineada al baseline del proyecto).
2. Instalar dependencias: `npm install` (cuando exista `package.json` de monorepo).
3. Ejecutar sanity checks:
   - `npm run build` (ejecutable cuando exista scaffold monorepo)
   - `npm run test:unit` (ejecutable cuando exista scaffold monorepo)
   - `npm run test:integration` (ejecutable cuando exista scaffold monorepo)

Si falla esta verificación inicial, **MUST** corregirse el entorno antes de continuar.

---

## 4) Uso en Linux

Comandos recomendados:

```bash
npm install
npm run dev
```

Validación completa:

```bash
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:cov
```

---

## 5) Uso en Windows (PowerShell)

Comandos recomendados:

```powershell
npm install
npm run dev
```

Validación completa:

```powershell
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:cov
```

---

## 6) Flujo de uso operativo

1. Levantar entorno local.
2. Ejecutar pruebas en modo TDD durante desarrollo.
3. Ejecutar validación completa pre-PR.
4. Confirmar que contrato API/OpenAPI está actualizado cuando aplique.

Referencia:
- [`testing/testing-standard.md`](./testing/testing-standard.md)
- [`api/definition-of-api-done.md`](./api/definition-of-api-done.md)

---

## 7) Criterio de aceptación local

Una ejecución local se considera válida para entregar feature solo si:
- build OK,
- unit tests OK,
- integration tests OK,
- e2e OK,
- coverage report generado,
- y sin contradicciones con contrato API vigente.
