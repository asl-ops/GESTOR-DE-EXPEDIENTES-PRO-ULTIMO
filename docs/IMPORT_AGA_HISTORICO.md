# Importador AGA -> Expedientes Pro

Script: `/scripts/import-aga-historico-to-expedientes-pro.cjs`
Script Excel: `/scripts/import-aga-excel-to-expedientes-pro.cjs`

## Objetivo

- Leer datos de `saldos-gestoria` (colecciones `clientes` y `expedientes`).
- Mapearlos a `gestor-expedientes-pro` (`clients` y `cases`).
- Ejecutar con seguridad: `dry-run` por defecto + confirmación obligatoria para escritura.

## Comandos

1. Simulación (no escribe):

```bash
npm run import-aga-historico
```

2. Importación real:

```bash
node scripts/import-aga-historico-to-expedientes-pro.cjs --execute --confirm IMPORT_AGA_HISTORICO

## Variante por Excel (fuente local AGA)

1. Simulación:

```bash
npm run import-aga-excel
```

2. Importación real:

```bash
node scripts/import-aga-excel-to-expedientes-pro.cjs --execute --confirm IMPORT_AGA_EXCEL
```

## Importación económica (Facturas y Saldos AGA)

Script: `/scripts/import-aga-economic-excel-to-expedientes-pro.cjs`

1. Simulación:

```bash
npm run import-aga-economic-excel
```

2. Importación real:

```bash
node scripts/import-aga-economic-excel-to-expedientes-pro.cjs --execute --confirm IMPORT_AGA_ECONOMIC_EXCEL
```

Colecciones destino:

- `economicInvoices`
- `economicBalances`
```

## Seguridad

- No borra datos ni configuración maestra.
- Solo crea/actualiza `clients` y `cases`.
- Genera reporte JSON en `/tmp/import_aga_historico_report_*.json`.

## Variables opcionales (origen AGA)

Si quieres sobreescribir el origen por entorno:

- `AGA_FIREBASE_AUTH_DOMAIN`
- `AGA_FIREBASE_PROJECT_ID`
- `AGA_FIREBASE_STORAGE_BUCKET`
- `AGA_FIREBASE_API_KEY`
- `AGA_FIREBASE_MESSAGING_SENDER_ID`
- `AGA_FIREBASE_APP_ID`
