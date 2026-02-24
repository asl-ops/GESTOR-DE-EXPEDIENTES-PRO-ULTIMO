# 📊 PLANTILLA OFICIAL - Importación Masiva de Clientes
## Gestor de Expedientes Pro v4.6.2

---

## ✅ PLANTILLA MÍNIMA (RECOMENDADA FASE 1)

### Hoja Excel: `Clientes`

Copia estas cabeceras en la primera fila de tu Excel:

```
nombre	documento	tipo	estado
```

### Ejemplo de datos (copiar desde fila 2):

```
GARCÍA LÓPEZ, JUAN	26205457	PARTICULAR	ACTIVO
CONSTRUCCIONES EJEMPLO SL	B12345678	EMPRESA	ACTIVO
COMUNIDAD DE BIENES GARCÍA CB	E12345678	EMPRESA	ACTIVO
PÉREZ MARTÍNEZ, MARÍA	87654321	PARTICULAR	ACTIVO
INVERSIONES TECH SA	A12345678	EMPRESA	ACTIVO
```

---

## 📋 PLANTILLA COMPLETA (TODOS LOS CAMPOS)

### Hoja Excel: `Clientes`

Copia estas cabeceras en la primera fila:

```
nombre	documento	nif	telefono	email	direccion	poblacion	provincia	cp	pais	fechaInicio	cuentaContable	iban	bancoCobro	cuentaCobro	notas	tipo	estado
```

### Ejemplo de datos completos:

```
GARCÍA LÓPEZ, JUAN	26205457	12345678Z	600123456	juan.garcia@example.com	Calle Mayor 123, 3º A	Madrid	Madrid	28001	España	2024-01-15	43000001	ES7921000813610123456789	2100	08136101234567	Cliente VIP desde 2020	PARTICULAR	ACTIVO
CONSTRUCCIONES EJEMPLO SL	B12345678	B12345678	912345678	info@construcciones.com	Polígono Industrial Sur, Nave 12	Sevilla	Sevilla	41020	España	2022-03-10	43000003	ES7921000813610987654321	2100	08136109876543	Empresa de construcción	EMPRESA	ACTIVO
```

---

## 🔧 FÓRMULA EXCEL PARA AUTO-RELLENAR CAMPO `tipo`

### Si tienes miles de filas y no quieres rellenar `tipo` manualmente:

**Suponiendo que:**
- Columna A = `nombre`
- Columna B = `documento`
- Columna C = `tipo` (la que queremos auto-rellenar)

**En la celda C2 (primera fila de datos), escribe esta fórmula:**

```excel
=SI(ESNUMERO(VALOR(B2));"PARTICULAR";"EMPRESA")
```

**Explicación:**
- Si `documento` (columna B) es **solo números** → `PARTICULAR`
- Si `documento` empieza con **letra** → `EMPRESA`

**Luego arrastra la fórmula hacia abajo** para todas las filas.

### Versión alternativa (más robusta):

```excel
=SI(ESBLANCO(B2);"PARTICULAR";SI(ESNUMERO(VALOR(B2));"PARTICULAR";"EMPRESA"))
```

Esta versión también maneja documentos vacíos (los marca como PARTICULAR por defecto).

---

## ⚠️ REGLAS CRÍTICAS PARA EXCEL

### 1. Formato de columnas (IMPORTANTE)

Antes de pegar datos, selecciona estas columnas y cambia el formato a **Texto**:

- `documento` → **Texto** (para no perder ceros: `01234567`)
- `cp` → **Texto** (para no perder ceros: `08001`)
- `telefono` → **Texto** (para mantener `+34`)
- `nif` → **Texto**
- `iban` → **Texto**

**Cómo hacerlo:**
1. Selecciona la columna completa (clic en la letra de la columna)
2. Clic derecho → Formato de celdas
3. Categoría: **Texto**
4. Aceptar

### 2. Normalización automática del campo `documento`

El importador aplicará automáticamente:

| Tu Excel (entrada) | Base de datos (guardado) |
|-------------------|--------------------------|
| `12.345.678` | `12345678` |
| `12-345-678` | `12345678` |
| `b12345678` | `B12345678` |
| `B-12345678` | `B12345678` |
| ` B12345678 ` | `B12345678` |

✅ **No te preocupes por espacios, puntos o guiones** → se eliminan automáticamente.

### 3. Validación de emails

Si un email es inválido:
- ✅ Se registra como **WARNING**
- ✅ El cliente **SÍ se importa** (sin email)
- ❌ **NO se bloquea** la importación

### 4. Fechas

Formato aceptado:
- `DD/MM/YYYY` → `15/01/2024`
- `YYYY-MM-DD` → `2024-01-15`
- Fecha de Excel → se convierte automáticamente

---

## 📊 EJEMPLO COMPLETO PARA COPIAR/PEGAR

### Plantilla Mínima (4 columnas)

```
nombre	documento	tipo	estado
GARCÍA LÓPEZ, JUAN	26205457	PARTICULAR	ACTIVO
PÉREZ MARTÍNEZ, MARÍA	87654321	PARTICULAR	ACTIVO
RODRÍGUEZ SÁNCHEZ, CARLOS	12345678	PARTICULAR	ACTIVO
CONSTRUCCIONES EJEMPLO SL	B12345678	EMPRESA	ACTIVO
INVERSIONES TECH SA	A12345678	EMPRESA	ACTIVO
COMUNIDAD DE BIENES GARCÍA CB	E12345678	EMPRESA	ACTIVO
TRANSPORTES LÓPEZ SL	B87654321	EMPRESA	ACTIVO
MARTÍNEZ FERNÁNDEZ, ANA	98765432	PARTICULAR	ACTIVO
SERVICIOS INTEGRALES SA	A98765432	EMPRESA	ACTIVO
LÓPEZ GARCÍA, PEDRO	11223344	PARTICULAR	ACTIVO
```

---

## 🎯 CHECKLIST ANTES DE IMPORTAR

Antes de importar miles de clientes, verifica:

- [ ] El archivo se llama `clientes_import_YYYYMMDD.xlsx`
- [ ] La hoja se llama exactamente `Clientes` (case-sensitive)
- [ ] La columna `documento` está formateada como **Texto**
- [ ] La columna `nombre` no tiene filas vacías
- [ ] La columna `documento` no tiene filas vacías
- [ ] Has probado con 10-20 filas primero
- [ ] Has descargado el log de errores de la prueba
- [ ] Has corregido los errores encontrados
- [ ] Tienes backup del Excel original

---

## 🚀 PROCESO RECOMENDADO

### Paso 1: Preparar Excel de prueba (10-20 filas)
1. Exporta 20 clientes desde CCS/Econ CEGID
2. Reordena columnas según plantilla
3. Formatea `documento` como Texto
4. Guarda como `clientes_prueba.xlsx`

### Paso 2: Importar prueba
1. Abre la app → Configuración → Clientes
2. Clic en "📥 Importación Masiva"
3. Selecciona política: **IGNORAR duplicados**
4. Selecciona `clientes_prueba.xlsx`
5. Espera resultado

### Paso 3: Revisar log
1. Descarga el log completo
2. Revisa errores y warnings
3. Corrige en el Excel original
4. Repite hasta 0 errores

### Paso 4: Importación masiva
1. Exporta TODOS los clientes desde CCS
2. Aplica el mismo formato
3. Guarda como `clientes_import_20260105.xlsx`
4. Importa (tardará varios minutos con miles de registros)
5. Descarga log final

---

## 📞 SOPORTE

Si encuentras errores durante la importación:

1. **Descarga el log completo** (botón "💾 Descargar Log Completo")
2. Revisa la sección "ERRORES" del log
3. Corrige las filas problemáticas en el Excel
4. Vuelve a importar (los duplicados se ignorarán)

---

## 🎓 PREGUNTAS FRECUENTES

### ¿Qué pasa si importo dos veces el mismo Excel?

Con política **IGNORAR**: Los clientes duplicados se saltarán (no se duplican).
Con política **ACTUALIZAR**: Los clientes existentes se actualizarán con los nuevos datos.

### ¿Puedo importar solo nombre y documento?

✅ SÍ. Son los únicos campos obligatorios.

### ¿Qué pasa si un email es inválido?

Se registra como WARNING, pero el cliente SÍ se importa (sin email).

### ¿Puedo importar sociedades sin administradores?

✅ SÍ. En FASE 1, las sociedades se importan solo con CIF + nombre.
Los administradores se añadirán en FASE 2.

### ¿Cuánto tarda en importar 5000 clientes?

Aproximadamente 2-3 minutos (procesamiento por lotes de 500).

---

## 📝 NOTAS FINALES

- El campo `documento` es la **clave única** para vincular expedientes
- Personas físicas: DNI **sin letra** (solo números)
- Sociedades/CB: CIF **completo** (con letra)
- El importador normaliza automáticamente (elimina espacios, puntos, guiones)
- Email inválido = WARNING (no bloquea importación)
- Tipo se deduce automáticamente si no se especifica

---

**Versión:** 1.0  
**Fecha:** 2026-01-04  
**Autor:** Google Antigravity (Gemini 2.0 Flash Thinking)
