# 📥 Importación Masiva de Clientes desde Excel

Este documento explica cómo importar más de 60,000 clientes desde un archivo Excel a la base de datos de Firestore.

## 📋 Formato del Excel Requerido

El archivo Excel debe tener las siguientes columnas (A-F):

| Columna | Campo             | Descripción                          | Obligatorio |
|---------|-------------------|--------------------------------------|-------------|
| A       | Identificador     | DNI/NIF/CIF del cliente             | ✅ Sí       |
| B       | NIF               | NIF secundario (si aplica)          | ❌ No       |
| C       | Nombre            | Nombre completo o razón social      | ✅ Sí       |
| D       | Domicilio         | Dirección completa                  | ❌ No       |
| E       | Cuenta Contable   | Código de cuenta contable           | ❌ No       |
| F       | IBAN              | Código IBAN bancario                | ❌ No       |

### Ejemplo de Excel

```
| A          | B          | C                    | D                        | E      | F                       |
|------------|------------|----------------------|--------------------------|--------|-------------------------|
| 12345678A  | 12345678A  | García López, Juan   | Calle Mayor 1, Madrid    | 43001  | ES1234567890123456789012|
| B12345678  | B12345678  | Construcciones SL    | Av. Principal 45, Toledo | 43002  | ES9876543210987654321098|
```

## 🚀 Cómo Usar el Script

### 1. Preparar el archivo Excel

1. Asegúrate de que tu Excel tenga los datos en las columnas A-F
2. La primera fila puede ser de encabezados (se omitirá automáticamente)
3. Guarda el archivo en una ubicación fácil de recordar (ej: Desktop)

### 2. Ejecutar la importación

Abre la terminal en el directorio del proyecto y ejecuta:

```bash
npm run import-clients <ruta-al-archivo.xlsx>
```

**Ejemplo:**

```bash
npm run import-clients ~/Desktop/clientes-gestoria.xlsx
```

### 3. Política de duplicados

Por defecto, el script **ignora** clientes que ya existen (por documento). 

Si quieres **actualizar** los clientes existentes en lugar de ignorarlos:

```bash
npm run import-clients ~/Desktop/clientes-gestoria.xlsx UPDATE
```

## 📊 Qué Hace el Script

1. **Lee el archivo Excel** y valida las columnas
2. **Normaliza los datos**:
   - Limpia espacios, guiones y puntos de documentos
   - Detecta automáticamente el tipo (PARTICULAR/EMPRESA)
   - Valida campos obligatorios
3. **Procesa en lotes de 500** para no saturar Firestore
4. **Verifica duplicados** por documento/NIF
5. **Genera un reporte completo** al finalizar

## 📈 Progreso en Tiempo Real

Durante la importación verás:

```
📖 Leyendo archivo: /Users/antonio/Desktop/clientes.xlsx
   ✓ Hoja encontrada: "Hoja1"
   ✓ Total de filas leídas: 60123

🔄 Normalizando datos...
   ✓ 60000 clientes válidos de 60123 filas

🔥 Conectando a Firebase...
   ✓ Conexión establecida

📊 Iniciando importación (120 lotes de ~500 clientes)

📦 Procesando lote 1/120 (500 clientes)
   ✓ Fila 2: "García López, Juan" creado
   ✓ Fila 3: "Construcciones SL" creado
   ...
   💾 Batch guardado (500 operaciones)
   ⏸  Esperando 1000ms...
```

## 📄 Reporte Final

Al terminar, el script genera:

1. **Resumen en consola:**

```
╔═══════════════════════════════════════════════════════════╗
║                   REPORTE FINAL                           ║
╚═══════════════════════════════════════════════════════════╝

📊 Total de filas procesadas:  60123
✅ Clientes creados:            59890
↻  Clientes actualizados:       0
↷  Clientes omitidos:           200
❌ Errores:                     33
⏱  Duración:                    5m 23s
```

2. **Archivo JSON con detalles** (`import-report-[timestamp].json`)

Este archivo contiene:
- Detalles completos de cada error
- Timestamp de inicio y fin
- Estadísticas detalladas

## ⚠️ Validaciones Automáticas

El script valida automáticamente:

- ✅ **Nombre obligatorio**: Si falta, se omite la fila
- ✅ **Identificador obligatorio**: Si falta, se omite la fila
- ✅ **Normalización de documentos**: Limpia espacios y caracteres especiales
- ✅ **Detección de tipo**: Deduce si es PARTICULAR o EMPRESA
- ✅ **Duplicados**: Verifica por documento antes de crear

## 🔍 Casos Especiales

### Clientes duplicados
- **IGNORE** (por defecto): No modifica el cliente existente
- **UPDATE**: Actualiza los campos con los nuevos valores del Excel

### Filas con datos incompletos
- Si falta **nombre** o **identificador**: Se omite y se registra en el reporte
- Si faltan otros campos: Se crea el cliente con los campos disponibles

### Tipos de cliente
- **DNI (12345678A)**: Se detecta como PARTICULAR
- **CIF (B12345678)**: Se detecta como EMPRESA
- Si viene con letra al inicio: EMPRESA
- Solo números: PARTICULAR

## 🛡️ Seguridad

- ✅ El script usa las **mismas credenciales de Firebase** que la app
- ✅ Respeta los **límites de Firestore** (500 operaciones por batch)
- ✅ Incluye **delays entre batches** para no saturar
- ✅ Maneja **errores individualmente** sin detener todo el proceso

## 📌 Notas Importantes

1. **Tiempo estimado**: Para 60,000 clientes, el proceso puede tardar entre **5-10 minutos**
2. **Conexión a internet**: Asegúrate de tener una conexión estable
3. **No interrumpir**: Una vez iniciado, deja que termine para evitar datos inconsistentes
4. **Backup recomendado**: Considera exportar los clientes actuales antes de importar masivamente

## 🆘 Solución de Problemas

### "El archivo no existe"
- Verifica la ruta del archivo
- Usa rutas absolutas o relativas correctas
- Ejemplo: `~/Desktop/archivo.xlsx` o `/Users/tu-usuario/Desktop/archivo.xlsx`

### "Error de conexión a Firebase"
- Verifica que el archivo `.env.local` tenga las credenciales correctas
- Asegúrate de tener internet estable

### "Permission denied"
- Verifica que las reglas de Firestore permitan escritura
- Asegúrate de estar autenticado (las credenciales están en `.env.local`)

### Muchos errores en el reporte
- Revisa el archivo `import-report-*.json` para ver detalles
- Verifica que las columnas A-F del Excel coincidan con el formato esperado

## 📞 Soporte

Si tienes problemas:
1. Revisa el archivo de reporte JSON generado
2. Verifica el formato de tu Excel
3. Asegúrate de que las variables de entorno estén configuradas
