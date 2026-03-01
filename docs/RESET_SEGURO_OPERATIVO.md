# Reset Seguro Operativo

Objetivo: borrar solo datos operativos (clientes y expedientes), sin tocar configuración maestra de la App.

## Colecciones protegidas (nunca se borran)

- `prefixes` (incluye catálogo por prefijo en `prefixes/{prefixId}/movements`)
- `prefijoMovimientos`
- `users`
- `payment_methods`
- `settings`
- `economicTemplates`
- `movimientoCuentasContables`
- `movimientos` (legacy)

## Colecciones operativas que sí se limpian

- `clients`
- `cases`
- `vehicles`
- `deliveryNotes`
- `proformas`
- `invoices`

## Comandos

1. Simulación (recomendado siempre):

```bash
npm run reset-operational-safe
```

2. Ejecutar borrado real:

```bash
node scripts/reset-operational-data-safe.cjs --execute --confirm RESET_OPERATIVO
```

3. Ejecutar borrado real + reiniciar contadores operativos:

```bash
node scripts/reset-operational-data-safe.cjs --execute --confirm RESET_OPERATIVO --reset-counters
```

4. Backup manual de configuración:

```bash
npm run backup-config
```

## Seguridad incluida

- `dry-run` por defecto.
- Confirmación obligatoria con token `RESET_OPERATIVO`.
- Backup automático de configuración maestra antes del borrado real.
- Reporte JSON en `/tmp/reset_operational_report_*.json`.

