# Database Technical Requirements (Normativo)

Índice del módulo de base de datos para documentación técnica normativa.

---

## Documentos

1. **Database Model & Entity Usage (Normativo)**  
   [`database-model.md`](./database-model.md)

---

## Fuentes relacionadas

- Modelo objetivo (pendiente de scaffold): `src/packages/data-access/prisma/schema.prisma`
- Reglas funcionales: [`../../sdd/SPEC.md`](../../sdd/SPEC.md)
- Diseño técnico: [`../../sdd/DESIGN.md`](../../sdd/DESIGN.md)
- Trazabilidad/API DoD: [`../api/definition-of-api-done.md`](../api/definition-of-api-done.md)

---

## Regla de actualización

Todo cambio de entidad/relación en `schema.prisma` debe reflejarse en `database-model.md` en el mismo PR del feature.

`database-model.md` cubre baseline de entidades para features MVP #1..#6 (auth, turnos, mesas/comandas, catálogo/pricing, stock, billing, KDS y auditoría).
