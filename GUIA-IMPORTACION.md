# 🚀 Guía Rápida de Importación de Clientes

Esta guía te ayudará a importar tus **60,000+ clientes** desde Excel a Firestore de forma segura y eficiente.

## 📝 Paso 1: Hacer una Prueba Pequeña (RECOMENDADO)

Antes de importar los 60,000 clientes, es altamente recomendable hacer una prueba con datos de ejemplo:

### 1.1. Generar archivo de prueba

```bash
npm run generate-sample-excel
```

Esto creará un archivo `clientes-ejemplo.xlsx` con 7 clientes de prueba.

### 1.2. Importar el archivo de prueba

```bash
npm run import-clients clientes-ejemplo.xlsx
```

Deberías ver algo como:

```
╔═══════════════════════════════════════════════════════════╗
║   IMPORTACIÓN MASIVA DE CLIENTES - Gestoría AZ-98        ║
╚═══════════════════════════════════════════════════════════╝

📖 Leyendo archivo: clientes-ejemplo.xlsx
   ✓ Hoja encontrada: "Hoja1"
   ✓ Total de filas leídas: 7

🔄 Normalizando datos...
   ✓ 7 clientes válidos de 7 filas

🔥 Conectando a Firebase...
   ✓ Conexión establecida

📦 Procesando lote 1/1 (7 clientes)
   ✓ Fila 2: "García López, Juan" creado
   ✓ Fila 3: "Martínez Pérez, María" creado
   ...
```

### 1.3. Verificar en la aplicación

1. Inicia la aplicación: `npm run dev`
2. Ve a la sección de **Clientes**
3. Verifica que los 7 clientes de prueba aparezcan correctamente
4. Prueba los filtros, la búsqueda, etc.

### 1.4. Si todo está bien, continúa al Paso 2

---

## 📊 Paso 2: Preparar tu Archivo Excel Real

### 2.1. Verificar el formato

Tu archivo Excel debe tener **6 columnas** en este orden:

| Col | Campo           | Ejemplo              | ¿Obligatorio? |
|-----|-----------------|----------------------|---------------|
| A   | Identificador   | `12345678A`         | ✅ Sí         |
| B   | NIF             | `12345678A`         | ❌ No         |
| C   | Nombre          | `García López, Juan`| ✅ Sí         |
| D   | Domicilio       | `Calle Mayor 1`     | ❌ No         |
| E   | Cuenta Contable | `43001`             | ❌ No         |
| F   | IBAN            | `ES12...`           | ❌ No         |

### 2.2. Importante

- La **primera fila** puede contener encabezados (se omitirá automáticamente)
- Los campos **Identificador** y **Nombre** son obligatorios
- Los demás campos son opcionales pero recomendados

---

## 🔥 Paso 3: Importar los 60,000+ Clientes

### 3.1. Ejecutar la importación

```bash
npm run import-clients ~/Desktop/tu-archivo-clientes.xlsx
```

**Importante**: Reemplaza `~/Desktop/tu-archivo-clientes.xlsx` con la ruta real de tu archivo.

### 3.2. Tiempo estimado

Para **60,000 clientes**:
- ⏱️ Duración esperada: **5-10 minutos**
- 📦 Se procesarán en **120 lotes** de 500 clientes cada uno
- 🔄 Hay un delay de 1 segundo entre lotes para no saturar Firestore

### 3.3. Durante la importación

- ✅ Verás el progreso en tiempo real
- 📊 Se mostrará cada cliente importado
- ⚠️ Los errores se registrarán pero no detendrán el proceso
- 💾 Cada 500 clientes se guardará un batch en Firestore

### 3.4. NO INTERRUMPIR

⚠️ **Una vez iniciada, deja que termine completamente** para evitar inconsistencias.

---

## 📋 Paso 4: Revisar el Reporte

Al finalizar, verás un resumen como:

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

📄 Reporte guardado en: import-report-1737000000000.json
```

### 4.1. Revisar errores (si los hay)

Si hay errores, abre el archivo `import-report-*.json`:

```bash
cat import-report-*.json
```

Verás detalles de cada error:

```json
{
  "errorDetails": [
    {
      "row": 1523,
      "error": "El campo 'nombre' es obligatorio",
      "data": { ... }
    }
  ]
}
```

---

## 🧪 Paso 5: Verificar en la Aplicación

1. Inicia la aplicación: `npm run dev`
2. Ve a **Clientes**
3. Verifica:
   - ✅ Que aparezcan todos los clientes
   - ✅ Que la búsqueda funcione
   - ✅ Que los filtros respondan bien
   - ✅ Que no haya errores de visualización

---

## 🔄 Políticas de Duplicados

### Por defecto: IGNORAR

Si un cliente ya existe (mismo `documento`), se **omite** y no se modifica:

```bash
npm run import-clients archivo.xlsx
```

### Opción: ACTUALIZAR

Si quieres **sobrescribir** los clientes existentes:

```bash
npm run import-clients archivo.xlsx UPDATE
```

⚠️ **Usar con precaución**: Esto actualizará los datos de clientes ya existentes.

---

## ⚠️ Notas Importantes

### ✅ Hacer ANTES de importar

1. **Backup de Firestore** (recomendado)
2. **Prueba con archivo pequeño** (usa `generate-sample-excel`)
3. **Verificar formato del Excel**
4. **Asegurar conexión a internet estable**

### ❌ NO hacer DURANTE la importación

1. **No cerrar la terminal**
2. **No interrumpir con Ctrl+C**
3. **No apagar el ordenador**
4. **No desconectar internet**

### 🛡️ Seguridad

- ✅ El script usa las mismas credenciales de Firebase que la app
- ✅ Respeta los límites de Firestore (500 ops/batch)
- ✅ Incluye delays entre batches
- ✅ Maneja errores sin detener todo el proceso

---

## 🆘 Solución de Problemas

### "Cannot find module 'tsx'"

```bash
npm install --save-dev tsx
```

### "El archivo no existe"

Verifica la ruta:

```bash
ls -la ~/Desktop/tu-archivo.xlsx
```

### "Firebase permission denied"

Verifica las reglas de Firestore en Firebase Console.

### Muchos errores en el reporte

- Revisa el formato de las columnas A-F
- Asegúrate de que la columna A (Identificador) y C (Nombre) tengan valores

---

## 📞 Comandos Disponibles

```bash
# Generar Excel de ejemplo para pruebas
npm run generate-sample-excel

# Importar clientes (ignora duplicados)
npm run import-clients <ruta-archivo.xlsx>

# Importar clientes (actualiza duplicados)
npm run import-clients <ruta-archivo.xlsx> UPDATE

# Iniciar la app para verificar
npm run dev
```

---

## ✨ ¡Listo!

Siguiendo estos pasos, podrás importar tus 60,000+ clientes de forma segura y eficiente. 

Si tienes algún problema, revisa el archivo `import-report-*.json` para detalles específicos.
