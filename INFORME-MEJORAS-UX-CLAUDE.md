# Informe de Mejoras UX/UI - Gestor de Expedientes PRO

**Fecha:** 16 de enero de 2026
**Versión analizada:** v13.01.26
**Analizado por:** Claude (Anthropic)

---

## Resumen Ejecutivo

Tras explorar la aplicacion en funcionamiento, he identificado **23 oportunidades de mejora** organizadas por prioridad. La aplicacion tiene una base solida y profesional, pero hay ajustes que pueden mejorar significativamente la experiencia de usuario y la intuitividad.

---

## 1. PROBLEMAS CRITICOS (Prioridad Alta)

### 1.1 Datos de Cliente Incompletos en Vista de Expediente

**Problema:** En el detalle del expediente, la direccion muestra `()` vacio al final, indicando que faltan Poblacion y Provincia.

**Ejemplo observado:**
```
UR/PARQUE VERA BLQ.14 3 12 ()
```

**Solucion propuesta:**
- No mostrar parentesis si Poblacion/Provincia estan vacios
- Formato condicional: `{Direccion}, {Poblacion} ({Provincia})` solo si hay datos

---

### 1.2 Clientes "Sin Ficha" con UUIDs

**Problema:** En el explorador de clientes aparecen registros con identificadores UUID (ej: `32F4B1A2-A8FE-4E35-9B05-DFCF6439AEEE`) marcados como "Cliente Detectado (Sin Ficha)".

**Impacto:** Confunde al usuario y ensucia el listado.

**Solucion propuesta:**
- Filtrar estos registros por defecto
- Crear una seccion separada "Clientes pendientes de completar"
- O bien: ejecutar limpieza de datos antes del despliegue

---

### 1.3 Prefijos de Expediente Inconsistentes

**Problema:** Existen prefijos duplicados con diferentes formatos:
- `GE-MAT` vs `GEMAT`
- `FI-TRI` vs `FITRI`

**Impacto:** Dificulta busquedas y filtros, genera confusion.

**Solucion propuesta:**
- Unificar a un solo formato (recomiendo con guion: `GE-MAT`)
- Script de migracion para normalizar existentes
- Validacion en creacion de nuevos expedientes

---

## 2. MEJORAS DE USABILIDAD (Prioridad Media)

### 2.1 Telefono y Email Vacios No Informativos

**Problema:** Cuando no hay telefono o email, el campo aparece vacio sin indicacion.

**Solucion propuesta:**
- Mostrar "No registrado" o un icono de advertencia
- Resaltar en amarillo claro para indicar dato faltante importante

---

### 2.2 Panel de Impresion Siempre Visible

**Problema:** A la derecha del dashboard hay un panel de "Reporte de Consulta" siempre visible que ocupa espacio.

**Solucion propuesta:**
- Convertirlo en modal que aparece al pulsar "Vista Previa" o "Imprimir"
- O hacerlo colapsable/ocultable
- Ganar ese espacio para la tabla principal

---

### 2.3 Boton "Reset W" No Descriptivo

**Problema:** En la barra de herramientas hay un boton "Reset W" cuya funcion no es obvia.

**Solucion propuesta:**
- Renombrar a algo descriptivo: "Restablecer Anchos" o "Reset Columnas"
- Anadir tooltip explicativo

---

### 2.4 Opcion "Todos" en Paginacion

**Problema:** Permite cargar los 60.000+ registros de golpe, colapsando el navegador.

**Solucion propuesta:**
- Eliminar opcion "Todos"
- O limitarla a maximo 500 registros con advertencia
- Alternativa: "Exportar Todo a Excel" en lugar de mostrar todo

---

### 2.5 Columna "Observaciones" Siempre Muestra "—"

**Problema:** En el listado de expedientes, la columna Observaciones muestra guion en casi todos los registros.

**Solucion propuesta:**
- Ocultar columna por defecto si no hay datos
- O mostrar icono de nota solo cuando hay contenido

---

### 2.6 Estados Duplicados: "Situacion" vs "Estado"

**Problema:** Hay dos columnas que parecen redundantes:
- Situacion: "Iniciado", "Cerrado", "VIGENTE"
- Estado: "Pendiente Documentacion", "Cerrado"

**Solucion propuesta:**
- Clarificar la diferencia en la documentacion
- Considerar unificar si son redundantes
- O renombrar para que sea evidente la diferencia

---

## 3. MEJORAS VISUALES (Prioridad Media-Baja)

### 3.1 Fechas Sin Formato Consistente

**Problema:** Las fechas aparecen como `12/1/2026` (sin cero inicial).

**Solucion propuesta:**
- Formato consistente: `12/01/2026`
- Considerar formato largo en detalle: "12 de enero de 2026"

---

### 3.2 Saldos en Rojo Cuando Son Deudas

**Problema:** Todos los saldos aparecen en el mismo color, no se distingue si es a favor o en contra.

**Solucion propuesta:**
- Verde para saldos positivos (a cobrar)
- Rojo para saldos negativos (deuda)
- Gris para 0,00 EUR

---

### 3.3 Responsable "—" No Asignado

**Problema:** Algunos expedientes muestran "—" como responsable.

**Solucion propuesta:**
- Mostrar "Sin asignar" en naranja/amarillo
- Facilitar asignacion rapida desde el listado

---

### 3.4 Ancho de Columnas en Tabla

**Problema:** Algunas columnas tienen ancho fijo que corta nombres largos.

**Ejemplo:** "SAIZ-DE-BUSTAMANTE ALVAREZ-OSSORIO, MARI" (truncado)

**Solucion propuesta:**
- Tooltip con nombre completo al hover
- O columnas redimensionables (ya parece existir "Reset W")

---

## 4. MEJORAS DE NAVEGACION (Prioridad Media)

### 4.1 Breadcrumbs Limitados

**Problema:** Los breadcrumbs solo muestran "Inicio" sin la ruta completa.

**Solucion propuesta:**
- Mostrar ruta completa: Inicio > Expedientes > GEMAT-18372
- Permitir navegacion hacia atras por niveles

---

### 4.2 Busqueda Global Poco Visible

**Problema:** Hay dos campos de busqueda (cabecera y seccion) que pueden confundir.

**Solucion propuesta:**
- Unificar en un solo buscador global prominente
- Usar atajos de teclado (Ctrl+K o /)

---

### 4.3 Acceso Rapido a Expedientes Recientes

**Problema:** No hay forma rapida de volver a expedientes visitados recientemente.

**Solucion propuesta:**
- Seccion "Recientes" en el dashboard
- O dropdown en el buscador con historial

---

## 5. MEJORAS FUNCIONALES (Para Futuro)

### 5.1 Edicion Inline en Tabla

**Sugerencia:** Permitir editar estado/responsable directamente desde el listado sin abrir el detalle.

---

### 5.2 Seleccion Multiple Mejorada

**Sugerencia:** Al seleccionar varios expedientes, mostrar barra de acciones flotante con:
- Cambiar estado masivo
- Asignar responsable masivo
- Exportar seleccion

---

### 5.3 Indicadores de Antiguedad

**Sugerencia:** Resaltar expedientes que llevan mucho tiempo sin actividad:
- Amarillo: >30 dias sin cambios
- Rojo: >60 dias sin cambios

---

### 5.4 Vista Kanban por Estado

**Sugerencia:** Ademas de la tabla, ofrecer vista tipo Kanban donde las columnas sean los estados y se puedan arrastrar expedientes.

---

### 5.5 Notificaciones/Alertas

**Sugerencia:** Sistema de alertas para:
- Expedientes proximos a vencer
- Documentacion pendiente hace X dias
- Pagos pendientes

---

## 6. DATOS Y CALIDAD

### 6.1 Validacion de NIF/CIF

**Sugerencia:** Validar formato de NIF/NIE/CIF al introducir datos de cliente.

---

### 6.2 Normalizacion de Nombres

**Problema observado:** Algunos nombres tienen formato inconsistente:
- "ANTONIO SANCHEZ LOPEZ" (mayusculas)
- "Juan Garcia Martinez" (capitalizado)

**Solucion propuesta:**
- Normalizar a formato "APELLIDOS, Nombre" o "Nombre APELLIDOS"
- Aplicar al importar datos

---

### 6.3 Direcciones Incompletas

**Problema observado:** Muchas direcciones no tienen poblacion/provincia.

**Solucion propuesta:**
- Marcar visualmente fichas incompletas
- Herramienta de "Completar datos faltantes"

---

## Resumen de Prioridades

| Prioridad | Cantidad | Esfuerzo Estimado |
|-----------|----------|-------------------|
| Alta | 3 | 2-4 horas |
| Media | 10 | 1-2 dias |
| Media-Baja | 4 | 4-8 horas |
| Futuro | 6 | Variable |

---

## Proximos Pasos Recomendados

1. **Inmediato:** Corregir formato de direccion con parentesis vacios
2. **Corto plazo:** Limpiar clientes "Sin Ficha" y unificar prefijos
3. **Medio plazo:** Implementar mejoras de usabilidad (paginacion, panel impresion)
4. **Largo plazo:** Funcionalidades avanzadas (Kanban, alertas)

---

**Nota:** Este informe se basa en la exploracion de la aplicacion en su estado actual. Algunas observaciones pueden requerir revision del codigo fuente para determinar la mejor solucion tecnica.

---

*Generado por Claude (Anthropic) - 16 de enero de 2026*
