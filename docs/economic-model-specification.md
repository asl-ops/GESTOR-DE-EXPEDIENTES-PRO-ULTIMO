# Modelo Económico y Contable - Especificación Técnica FINAL

**Versión:** 2.0 FINAL  
**Fecha:** 2026-01-04  
**Estado:** ✅ COMPLETO - Modelo cerrado y listo para implementación

---

## 📋 Visión General

Este documento define el **modelo de datos completo y final** para el sistema económico y contable de la aplicación, respetando la lógica fiscal/contable real (30 años de experiencia) mientras se moderniza la arquitectura para ser parametrizable, escalable y sin dependencias de "códigos mágicos".

### ✅ Confirmaciones Clave

**Entregas a Cuenta / Provisiones:**
- ✅ Se tratan como **recibo/movimiento interno SIN factura**
- ✅ NO generan factura en el momento del cobro
- ✅ NO llevan IVA hasta la factura final
- ✅ Se contabilizan en cuenta de provisión/anticipo (438xxx o 555xxx)
- ✅ Se regularizan/compensan en la factura final

### Pilares del Sistema

1. **Movimiento** - Catálogo maestro de acciones económicas
2. **PrefijoExpediente** - Plantillas con configuración predefinida
3. **PrefijoMovimiento** - Movimientos que se insertan automáticamente al crear expediente
4. **LineaEconomica** - Conceptos facturables asociados a prefijos
5. **Reglas Fiscales** - IVA, cuentas contables y comportamiento según naturaleza

---

## 1️⃣ Entidad: Movimiento (Catálogo Maestro)

Los movimientos son "acciones económicas" o "líneas base" reutilizables que pueden formar parte de un expediente.

### Campos Completos

```typescript
interface Movimiento {
  id: string;                          // UUID
  codigo: string;                      // Único. Ej: "HON_RENTA", "SUP_TASA_DGT", "EAC_PROVISION"
  nombre: string;                      // "Honorarios Declaración Renta", "Tasa DGT"
  naturaleza: Naturaleza;              // HONORARIO | SUPLIDO | ENTREGA_A_CUENTA | AJUSTE | OTRO
  regimenIva: RegimenIVA;             // SUJETO | EXENTO | NO_SUJETO | NO_APLICA
  ivaPorDefecto: number | null;        // Ej: 21.00 (solo si SUJETO)
  
  // Comportamiento en facturación
  afectaFactura: boolean;              // ¿Aparece en factura?
  imprimibleEnFactura: boolean;        // ¿Se imprime en el PDF de factura?
  afectaBaseImponible: boolean;        // ¿Suma a la base imponible?
  afectaIva: boolean;                  // ¿Genera IVA repercutido?
  
  // Cálculo de importe
  modoImporte: ModoImporte;            // MANUAL | FIJO | TARIFA | PORCENTAJE
  importePorDefecto: number | null;
  
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

enum Naturaleza {
  HONORARIO = 'HONORARIO',             // Ingresos por servicios profesionales
  SUPLIDO = 'SUPLIDO',                 // Gastos por cuenta del cliente
  ENTREGA_A_CUENTA = 'ENTREGA_A_CUENTA', // Provisiones/anticipos
  AJUSTE = 'AJUSTE',                   // Descuentos, regularizaciones
  OTRO = 'OTRO'
}

enum RegimenIVA {
  SUJETO = 'SUJETO',                   // Genera IVA repercutido
  EXENTO = 'EXENTO',                   // Exento de IVA
  NO_SUJETO = 'NO_SUJETO',            // No sujeto a IVA (suplidos, provisiones)
  NO_APLICA = 'NO_APLICA'             // No aplica IVA
}

enum ModoImporte {
  MANUAL = 'MANUAL',                   // Usuario introduce importe
  FIJO = 'FIJO',                       // Importe fijo predefinido
  PORCENTAJE = 'PORCENTAJE',           // % sobre base
  TARIFA = 'TARIFA'                    // Según tabla de tarifas
}
```

### Reglas por Naturaleza

| Naturaleza | Régimen IVA | IVA % | Afecta Factura | Imprimible | Afecta Base | Afecta IVA |
|------------|-------------|-------|----------------|------------|-------------|------------|
| HONORARIO | SUJETO | 21% | ✅ | ✅ | ✅ | ✅ |
| SUPLIDO | NO_SUJETO | - | ✅ | ✅ | ❌ | ❌ |
| ENTREGA_A_CUENTA | NO_SUJETO | - | ❌ | ❌ | ❌ | ❌ |
| AJUSTE | Variable | Variable | ✅ | ✅ | Variable | Variable |

### Contabilidad - Cuentas Asociadas

```typescript
interface MovimientoCuentaContable {
  id: string;
  movimientoId: string;
  rol: RolCuenta;                      // Define el propósito de la cuenta
  cuentaContable: string;              // Código de cuenta. Ej: "705000", "477000"
  debeHaber: 'DEBE' | 'HABER';        // Posición en el asiento
  descripcion?: string;
}

enum RolCuenta {
  INGRESO = 'INGRESO',                 // 7xx - Ingresos por servicios
  IVA_REPER = 'IVA_REPER',            // 477xxx - IVA repercutido
  GASTO_SUPLIDO = 'GASTO_SUPLIDO',    // 6xx - Gastos por cuenta cliente
  SUPLIDO_CUENTA_PUENTE = 'SUPLIDO_CUENTA_PUENTE', // 555xxx - Cuenta puente suplidos
  PROVISION_CUENTA_PUENTE = 'PROVISION_CUENTA_PUENTE', // 438xxx/555xxx - Provisiones
  ANTICIPO = 'ANTICIPO',               // Anticipos de clientes
  CLIENTE = 'CLIENTE',                 // 430xxx - Clientes
  BANCO = 'BANCO',                     // 572xxx - Bancos
  CAJA = 'CAJA',                       // 570xxx - Caja
  RETENCION = 'RETENCION'              // 4751xx - Retenciones
}
```

**Ventaja:** Si cambian las cuentas contables, se modifica la configuración, no el código.

---

## 2️⃣ Entidad: PrefijoExpediente (Plantilla)

Define un tipo de expediente (FITRI, DIGI, ABOG…) y sus configuraciones predeterminadas.

### Campos

```typescript
interface PrefijoExpediente {
  id: string;
  codigo: string;                      // Único. FITRI, DIGI, ABOG
  descripcion: string;
  activo: boolean;
  
  // Numeración automática
  numeracionUltimo: number;            // Último número asignado (editable en pestaña Numeración)
  numeracionPadding: number;           // Ej: 4 para "0042"
  numeracionSeparador: string;         // "-" por defecto
  formatoNumero?: string;              // "{CODIGO}{SEP}{NUM:0000}"
  
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3️⃣ Entidad: PrefijoMovimiento (Movimientos Predefinidos)

Define **qué movimientos se crean automáticamente** al abrir un expediente con ese prefijo.

### Campos

```typescript
interface PrefijoMovimiento {
  id: string;
  prefijoId: string;
  movimientoId: string;                // Referencia al catálogo maestro
  
  orden: number;                       // Orden de aparición
  obligatorio: boolean;                // ¿Debe incluirse siempre?
  editableEnExpediente: boolean;       // ¿Usuario puede modificar/eliminar?
  importePorDefecto: number | null;
  estadoInicial: EstadoMovimiento;     // Estado al crear el expediente
  observaciones?: string;
}

enum EstadoMovimiento {
  PENDIENTE = 'PENDIENTE',
  REALIZADO = 'REALIZADO',
  FACTURABLE = 'FACTURABLE',
  NO_FACTURABLE = 'NO_FACTURABLE',
  FACTURADO = 'FACTURADO',
  CANCELADO = 'CANCELADO'
}
```

**Esto sustituye el Excel de "prefijos con códigos".**

---

## 4️⃣ Entidad: LineaEconomica (Conceptos Económicos)

Conceptos facturables o previsiones económicas asociadas al prefijo (lo que ya existe en el modal).

### Campos

```typescript
interface LineaEconomica {
  id: string;
  prefijoId: string;
  tipo: TipoLinea;                     // HONORARIO | SUPLIDO | ENTREGA_A_CUENTA
  concepto: string;                    // "Declaración Renta", "Tasa DGT"
  importe: number | null;
  unidad?: string;                     // "hora", "unidad", etc.
  ivaPorDefecto: number | null;        // % IVA si aplica
  incluyeIva: boolean;                 // ¿El importe incluye IVA?
  activo: boolean;
  orden: number;
  movimientoIdAsociado?: string;       // Opcional: mapeo con Movimiento maestro
  createdAt: string;
  updatedAt: string;
}

enum TipoLinea {
  HONORARIO = 'HONORARIO',
  SUPLIDO = 'SUPLIDO',
  ENTREGA_A_CUENTA = 'ENTREGA_A_CUENTA'
}
```

**Si `movimientoIdAsociado` se usa, la línea hereda el régimen IVA y contabilidad del Movimiento (ideal).**

---

## 5️⃣ Entidades Operativas (Expediente en Uso)

### Expediente

```typescript
interface Expediente {
  id: string;
  prefijoId: string;
  numero: string;                      // Generado: "FITRI-58032"
  fechaCreacion: string;
  clienteId: string;
  responsableId: string;
  estado: EstadoExpediente;
  // ... otros campos existentes
}
```

### MovimientoExpediente (Instancias Reales)

Cuando se crea un expediente con un prefijo, se copian automáticamente los `PrefijoMovimiento` aquí.

```typescript
interface MovimientoExpediente {
  id: string;
  expedienteId: string;
  movimientoId: string;                // Referencia al catálogo maestro
  orden: number;
  
  // Datos editables en el expediente
  descripcionOverride?: string;        // Permite personalizar descripción
  importe: number | null;
  regimenIva: RegimenIVA;             // Copiado del movimiento
  ivaPorcentaje: number | null;
  
  estado: EstadoMovimiento;
  facturable: boolean;
  fecha: string;
  observaciones?: string;
  
  createdAt: string;
  updatedAt: string;
}
```

---

## 6️⃣ Modelo de Facturación

### Factura

```typescript
interface Factura {
  id: string;
  clienteId: string;
  expedienteId: string;
  serie: string;
  numero: string;
  fecha: string;
  baseImponibleTotal: number;
  ivaTotal: number;
  total: number;
  estado: EstadoFactura;
  createdAt: string;
  updatedAt: string;
}

enum EstadoFactura {
  BORRADOR = 'BORRADOR',
  EMITIDA = 'EMITIDA',
  COBRADA = 'COBRADA',
  ANULADA = 'ANULADA'
}
```

### FacturaLinea

```typescript
interface FacturaLinea {
  id: string;
  facturaId: string;
  origenMovimientoExpedienteId?: string; // Trazabilidad al movimiento origen
  tipo: TipoLinea;                     // HONORARIO | SUPLIDO
  concepto: string;
  importe: number;
  ivaPorcentaje: number | null;
  ivaImporte: number | null;
  totalLinea: number;
  
  // Contabilidad
  cuentaContableIngreso?: string;      // Si HONORARIO
  cuentaContablePuente?: string;       // Si SUPLIDO
}
```

---

## 7️⃣ Modelo de Cobros (Entregas a Cuenta)

✅ **Confirmado:** Las entregas a cuenta se registran como **Cobro/Recibo** vinculado al expediente, **SIN generar factura**.

### Cobro

```typescript
interface Cobro {
  id: string;
  clienteId: string;
  expedienteId?: string;               // Puede estar vinculado a expediente o ser genérico
  tipo: TipoCobro;
  importe: number;
  fecha: string;
  metodo: MetodoCobro;
  referencia?: string;                 // Nº transferencia, cheque, etc.
  observaciones?: string;
  
  // Contabilidad
  cuentaBanco?: string;                // Cuenta bancaria destino
  
  createdAt: string;
  updatedAt: string;
}

enum TipoCobro {
  PROVISION = 'PROVISION',             // Entrega a cuenta / Provisión de fondos
  COBRO_FACTURA = 'COBRO_FACTURA',    // Cobro de factura emitida
  OTRO = 'OTRO'
}

enum MetodoCobro {
  TRANSFERENCIA = 'TRANSFERENCIA',
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  CHEQUE = 'CHEQUE',
  DOMICILIACION = 'DOMICILIACION'
}
```

**Contabilidad de Provisión:**
- **Banco/Caja** (DEBE) → 572xxx / 570xxx
- **Provisión cliente / Cuenta puente** (HABER) → 438xxx o 555xxx

**Liquidación posterior:** Cuando se emite factura, se aplica el pago anticipado como descuento/compensación.

---

## 8️⃣ Modelo Contable (Preparación Futura)

### AsientoContable

```typescript
interface AsientoContable {
  id: string;
  expedienteId?: string;
  fecha: string;
  descripcion: string;
  origen: OrigenAsiento;
  estado: EstadoAsiento;
  createdAt: string;
  updatedAt: string;
}

enum OrigenAsiento {
  MOVIMIENTO = 'MOVIMIENTO',
  FACTURA = 'FACTURA',
  COBRO = 'COBRO',
  PAGO = 'PAGO',
  AJUSTE = 'AJUSTE'
}

enum EstadoAsiento {
  BORRADOR = 'BORRADOR',
  CONFIRMADO = 'CONFIRMADO'
}
```

### ApunteContable

```typescript
interface ApunteContable {
  id: string;
  asientoId: string;
  cuentaContable: string;
  debe: number;
  haber: number;
  concepto: string;
  referenciaMovimientoId?: string;     // Trazabilidad
  referenciaFacturaId?: string;
  referenciaCobroId?: string;
}
```

---

## ✅ LAS 4 REGLAS CLAVE (Confirmadas)

### 1️⃣ Entregas a Cuenta (Provisión) — SIN Factura ✅

**Naturaleza:** `ENTREGA_A_CUENTA`

**Características:**
- `afectaFactura = false` ❌
- `imprimibleEnFactura = false` ❌
- `regimenIva = NO_SUJETO` (sin IVA)
- `afectaBaseImponible = false` ❌
- `afectaIva = false` ❌

**Contabilidad:**
```
Banco/Caja (572xxx/570xxx)          DEBE: 100€
  Provisión cliente (438xxx/555xxx)      HABER: 100€
```

**Liquidación posterior:**
- Cuando se emite factura de honorarios/suplidos, se aplica el pago anticipado como descuento/compensación
- O se mantiene como saldo a favor del cliente en el expediente

**Ventaja:** Evita IVA anticipado y se ajusta al flujo clásico de asesorías.

---

### 2️⃣ Suplidos (Tasas y Gastos por Cuenta del Cliente)

**Naturaleza:** `SUPLIDO`

**Características:**
- `regimenIva = NO_SUJETO` (del despacho)
- `afectaFactura = true` ✅ (aparece en factura)
- `imprimibleEnFactura = true` ✅
- `afectaBaseImponible = false` ❌ (no suma a base)
- `afectaIva = false` ❌ (no genera IVA del despacho)

**Contabilidad típica:**

**Al facturar al cliente:**
```
Cliente (430xxx)                    DEBE: 15€
  Cuenta puente suplidos (555xxx)        HABER: 15€
```

**Al pagar la tasa:**
```
Cuenta puente suplidos (555xxx)     DEBE: 15€
  Banco/Caja (572xxx/570xxx)             HABER: 15€
```

**Ventaja:** Controla suplidos sin "ensuciar" ingresos.

---

### 3️⃣ Honorarios

**Naturaleza:** `HONORARIO`

**Características:**
- `regimenIva = SUJETO` ✅
- `ivaPorDefecto = 21` (o el que aplique)
- `afectaFactura = true` ✅
- `imprimibleEnFactura = true` ✅
- `afectaBaseImponible = true` ✅
- `afectaIva = true` ✅

**Contabilidad:**
```
Cliente (430xxx)                    DEBE: 145.20€
  Ingresos (705xxx)                      HABER: 120€
  IVA repercutido (477xxx)               HABER: 25.20€
```

---

### 4️⃣ Tipos de Movimiento Asociados a Cada Prefijo

Se resuelve con:
- **PrefijoMovimiento** (plantilla de configuración)
- Genera **MovimientoExpediente** al crear expediente
- Se transforma en **FacturaLinea** al facturar (si procede)

---

## 🔄 Flujo Completo del Sistema

### A) Configuración (Administración)

1. **Definir Movimientos** en catálogo maestro
   - Honorarios con IVA + cuentas
   - Suplidos sin IVA + cuentas puente
   - Entregas a cuenta + cuentas provisión

2. **Definir Prefijos** (FITRI, DIGI, etc.)
   - Código, descripción, numeración

3. **Asignar al Prefijo:**
   - Movimientos predefinidos (PrefijoMovimiento)
   - Líneas económicas predefinidas (LineaEconomica)

### B) Operación Diaria

1. **Crear Expediente** con prefijo FITRI
   - Se genera número: `FITRI-58032`
   - Se cargan automáticamente:
     - Movimientos del prefijo → MovimientoExpediente
     - Conceptos económicos por defecto

2. **Registrar Operaciones:**
   - Honorarios facturables
   - Suplidos facturables (sin IVA)
   - Entregas a cuenta como Cobros (sin factura)

3. **Al Facturar:**
   - Se incluyen honorarios + suplidos
   - Se calcula base imponible e IVA
   - Se descuenta la provisión si existe
   - Se generan asientos contables

---

## 📊 Ejemplos de Datos Completos

### Ejemplo 1: Honorario - Declaración Renta

```json
{
  "codigo": "HON_DECL_RENTA",
  "nombre": "Honorarios Declaración Renta",
  "naturaleza": "HONORARIO",
  "regimenIva": "SUJETO",
  "ivaPorDefecto": 21.00,
  "afectaFactura": true,
  "imprimibleEnFactura": true,
  "afectaBaseImponible": true,
  "afectaIva": true,
  "modoImporte": "MANUAL",
  "activo": true
}
```

**Cuentas contables:**
```json
[
  { "rol": "INGRESO", "cuenta": "705000", "debeHaber": "HABER" },
  { "rol": "IVA_REPER", "cuenta": "477000", "debeHaber": "HABER" },
  { "rol": "CLIENTE", "cuenta": "430000", "debeHaber": "DEBE" }
]
```

---

### Ejemplo 2: Suplido - Tasa DGT

```json
{
  "codigo": "SUP_TASA_DGT",
  "nombre": "Tasa DGT",
  "naturaleza": "SUPLIDO",
  "regimenIva": "NO_SUJETO",
  "ivaPorDefecto": null,
  "afectaFactura": true,
  "imprimibleEnFactura": true,
  "afectaBaseImponible": false,
  "afectaIva": false,
  "modoImporte": "MANUAL",
  "activo": true
}
```

**Cuentas contables:**
```json
[
  { "rol": "SUPLIDO_CUENTA_PUENTE", "cuenta": "555000", "debeHaber": "HABER" },
  { "rol": "CLIENTE", "cuenta": "430000", "debeHaber": "DEBE" }
]
```

---

### Ejemplo 3: Entrega a Cuenta - Provisión

```json
{
  "codigo": "EAC_PROVISION",
  "nombre": "Provisión de fondos",
  "naturaleza": "ENTREGA_A_CUENTA",
  "regimenIva": "NO_SUJETO",
  "ivaPorDefecto": null,
  "afectaFactura": false,
  "imprimibleEnFactura": false,
  "afectaBaseImponible": false,
  "afectaIva": false,
  "modoImporte": "MANUAL",
  "activo": true
}
```

**Cuentas contables:**
```json
[
  { "rol": "BANCO", "cuenta": "572000", "debeHaber": "DEBE" },
  { "rol": "PROVISION_CUENTA_PUENTE", "cuenta": "438000", "debeHaber": "HABER" }
]
```

---

### Ejemplo 4: Prefijo FITRI (Completo)

**PrefijoExpediente:**
```json
{
  "codigo": "FITRI",
  "descripcion": "Departamento Fiscal - Tramitaciones Renta",
  "numeracionUltimo": 58031,
  "numeracionPadding": 4,
  "numeracionSeparador": "-",
  "formatoNumero": "FITRI-{NUM:0000}",
  "activo": true
}
```

**PrefijoMovimiento (Movimientos predefinidos):**
```json
[
  {
    "movimientoId": "HON_DECL_RENTA",
    "orden": 1,
    "obligatorio": true,
    "editableEnExpediente": true,
    "importePorDefecto": 120.00,
    "estadoInicial": "PENDIENTE"
  },
  {
    "movimientoId": "SUP_TASA_DGT",
    "orden": 2,
    "obligatorio": false,
    "editableEnExpediente": true,
    "importePorDefecto": 15.00,
    "estadoInicial": "PENDIENTE"
  },
  {
    "movimientoId": "EAC_PROVISION",
    "orden": 3,
    "obligatorio": false,
    "editableEnExpediente": true,
    "importePorDefecto": 100.00,
    "estadoInicial": "PENDIENTE"
  }
]
```

**LineaEconomica (Conceptos económicos por defecto):**
```json
[
  {
    "tipo": "HONORARIO",
    "concepto": "Declaración Renta",
    "importe": 120.00,
    "ivaPorDefecto": 21.00,
    "incluyeIva": false,
    "movimientoIdAsociado": "HON_DECL_RENTA",
    "orden": 1,
    "activo": true
  },
  {
    "tipo": "SUPLIDO",
    "concepto": "Tasa DGT",
    "importe": 15.00,
    "ivaPorDefecto": null,
    "incluyeIva": false,
    "movimientoIdAsociado": "SUP_TASA_DGT",
    "orden": 2,
    "activo": true
  },
  {
    "tipo": "ENTREGA_A_CUENTA",
    "concepto": "Provisión de fondos",
    "importe": 100.00,
    "ivaPorDefecto": null,
    "incluyeIva": false,
    "movimientoIdAsociado": "EAC_PROVISION",
    "orden": 3,
    "activo": true
  }
]
```

---

## ✅ Beneficios del Modelo Final

1. ✅ **Respeta la lógica histórica** - 30 años de experiencia contable/fiscal
2. ✅ **Moderniza la arquitectura** - Atributos claros, reglas explícitas
3. ✅ **Elimina "códigos mágicos"** - Todo parametrizable desde la aplicación
4. ✅ **Sin dependencias de Excel** - Catálogo maestro en base de datos
5. ✅ **Automatiza facturación** - Reglas claras de IVA y contabilidad
6. ✅ **Escalable** - Fácil añadir retenciones, IRPF, operaciones UE
7. ✅ **Auditable** - Trazabilidad completa de movimientos y asientos
8. ✅ **Preparado para CCS** - Estructura de asientos/apuntes lista

---

## 🎯 Regla de Oro (MUY IMPORTANTE)

### ✅ El IVA y contabilidad deben derivarse SIEMPRE del Movimiento

**El concepto puede cambiar el texto/importe, pero la NATURALEZA manda.**

Esto garantiza:
- ✅ Suplido **siempre** sin IVA
- ✅ Honorario **siempre** con IVA
- ✅ Provisión **nunca** entra a factura (salvo compensación)
- ✅ Consistencia total en contabilidad

---

## 🚀 Próximos Pasos de Implementación

### Fase 1: Catálogo Maestro
1. Crear interfaz de gestión de Movimientos
2. Definir movimientos básicos (HON, SUP, EAC)
3. Asignar cuentas contables a cada movimiento

### Fase 2: Configuración de Prefijos
1. Migrar prefijos existentes al nuevo modelo
2. Asignar movimientos predefinidos a cada prefijo
3. Validar líneas económicas existentes

### Fase 3: Operación en Expedientes
1. Implementar creación automática de MovimientoExpediente
2. Interfaz de gestión de movimientos en expediente
3. Registro de cobros (entregas a cuenta)

### Fase 4: Facturación
1. Generación de facturas desde movimientos
2. Cálculo automático de IVA
3. Compensación de provisiones

### Fase 5: Contabilidad (Futuro)
1. Generación automática de asientos
2. Exportación a formato CCS
3. Integración con software contable

---

## 📝 Compatibilidad con Sistema Actual

El modelo es **100% compatible** con la estructura actual:

| Actual | Nuevo | Relación |
|--------|-------|----------|
| `PrefixConfig` | `PrefijoExpediente` | 1:1 migración directa |
| `PrefixLine` | `LineaEconomica` | 1:1 migración directa |
| - | `Movimiento` | **NUEVO** - Catálogo maestro |
| - | `PrefijoMovimiento` | **NUEVO** - Plantilla de movimientos |
| - | `MovimientoExpediente` | **NUEVO** - Instancias en expediente |

---

## 🎓 Glosario de Términos

- **Movimiento:** Acción económica reutilizable (honorario, suplido, provisión)
- **Naturaleza:** Tipo fundamental del movimiento (determina IVA y contabilidad)
- **Régimen IVA:** Tratamiento fiscal del movimiento
- **Suplido:** Gasto realizado por cuenta del cliente, sin IVA del despacho
- **Entrega a cuenta:** Provisión de fondos sin factura, regularizable posteriormente
- **Cuenta puente:** Cuenta contable temporal para suplidos/provisiones
- **Base imponible:** Importe sobre el que se calcula el IVA
- **IVA repercutido:** IVA que se cobra al cliente

---

**Modelo cerrado y listo para implementación** ✅  
**Próximo paso sugerido:** Mapeo de códigos CCS actuales → Movimientos nuevos

**Versión:** 1.0  
**Fecha:** 2026-01-04  
**Estado:** BORRADOR - Pendiente confirmación sobre entregas a cuenta

---

## 📋 Visión General

Este documento define el modelo de datos completo para el sistema económico y contable de la aplicación, respetando la lógica fiscal/contable real mientras se moderniza la arquitectura para ser parametrizable y escalable.

### Pilares del Sistema

1. **Movimiento** - Catálogo maestro de acciones económicas
2. **Prefijo de Expediente** - Plantillas con configuración predefinida
3. **Línea Económica** - Conceptos facturables asociados a prefijos
4. **Reglas Fiscales** - IVA, cuentas contables y comportamiento según naturaleza

---

## 1️⃣ Entidad: Movimiento (Catálogo Maestro)

Los movimientos son "acciones económicas" o "líneas base" que pueden formar parte de un expediente.

### Campos

```typescript
interface Movimiento {
  id: string;                          // UUID
  codigo: string;                      // Ej: "HON_ASIST", "SUP_TASA", "EAC_PROVISION"
  nombre: string;                      // "Honorarios Asesoría", "Tasa DGT"
  naturaleza: Naturaleza;              // HONORARIO | SUPLIDO | ENTREGA_A_CUENTA | AJUSTE | OTRO
  tipoIva: TipoIVA;                   // SUJETO | EXENTO | NO_SUJETO | NO_APLICA
  ivaPorDefecto: number | null;        // Ej: 21.00 (solo si SUJETO)
  afectaFactura: boolean;              // ¿Aparece en factura?
  afectaBaseImponible: boolean;        // ¿Suma a la base imponible?
  afectaIva: boolean;                  // ¿Genera IVA repercutido?
  imprimibleEnFactura: boolean;        // ¿Se imprime en el PDF de factura?
  modoCalculo: ModoCalculo;            // MANUAL | FIJO | PORCENTAJE | TARIFA
  importePorDefecto: number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

enum Naturaleza {
  HONORARIO = 'HONORARIO',
  SUPLIDO = 'SUPLIDO',
  ENTREGA_A_CUENTA = 'ENTREGA_A_CUENTA',
  AJUSTE = 'AJUSTE',
  OTRO = 'OTRO'
}

enum TipoIVA {
  SUJETO = 'SUJETO',           // Genera IVA repercutido
  EXENTO = 'EXENTO',           // Exento de IVA
  NO_SUJETO = 'NO_SUJETO',     // No sujeto a IVA
  NO_APLICA = 'NO_APLICA'      // No aplica IVA
}

enum ModoCalculo {
  MANUAL = 'MANUAL',           // Usuario introduce importe
  FIJO = 'FIJO',               // Importe fijo predefinido
  PORCENTAJE = 'PORCENTAJE',   // % sobre base
  TARIFA = 'TARIFA'            // Según tabla de tarifas
}
```

### Contabilidad - Cuentas Asociadas

```typescript
interface MovimientoCuentaContable {
  id: string;
  movimientoId: string;
  rol: RolCuenta;              // INGRESO | IVA_REPER | GASTO_SUPLIDO | etc.
  cuentaContable: string;      // Ej: "705000", "477000", "430000"
  debeHaber: 'DEBE' | 'HABER';
  descripcion?: string;
}

enum RolCuenta {
  INGRESO = 'INGRESO',                 // 7xx - Ingresos
  IVA_REPER = 'IVA_REPER',            // 477 - IVA repercutido
  GASTO_SUPLIDO = 'GASTO_SUPLIDO',    // 6xx - Gastos por cuenta cliente
  PROVISION = 'PROVISION',             // 438/55x - Provisiones/Anticipos
  ANTICIPO = 'ANTICIPO',               // Anticipos de clientes
  CLIENTE = 'CLIENTE',                 // 430 - Clientes
  BANCO = 'BANCO',                     // 572 - Bancos
  CAJA = 'CAJA',                       // 570 - Caja
  RETENCION = 'RETENCION'              // 4751 - Retenciones
}
```

---

## 2️⃣ Entidad: Prefijo de Expediente

Define un tipo de expediente (FITRI, DIGI, ABOG…) y sus configuraciones predeterminadas.

### Campos

```typescript
interface PrefijoExpediente {
  id: string;
  codigo: string;                      // FITRI, DIGI, ABOG
  descripcion: string;
  activo: boolean;
  numeracionUltimo: number;            // Último número asignado
  numeracionPadding: number;           // Ej: 4 para "0042"
  numeracionSeparador: string;         // "-" por defecto
  formatoNumero?: string;              // "{CODIGO}{SEP}{NUM:0000}"
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Relación: Prefijo ↔ Movimientos

```typescript
interface PrefijoMovimiento {
  id: string;
  prefijoId: string;
  movimientoId: string;
  orden: number;                       // Orden de aparición
  obligatorio: boolean;                // ¿Debe incluirse siempre?
  editableEnExpediente: boolean;       // ¿Usuario puede modificar?
  importePorDefecto: number | null;
  observaciones?: string;
  estadoInicial: EstadoMovimiento;     // PENDIENTE | REALIZADO | FACTURADO
}

enum EstadoMovimiento {
  PENDIENTE = 'PENDIENTE',
  REALIZADO = 'REALIZADO',
  FACTURADO = 'FACTURADO',
  CANCELADO = 'CANCELADO'
}
```

---

## 3️⃣ Entidad: Línea Económica

Conceptos facturables o previsiones económicas asociadas al prefijo.

### Campos

```typescript
interface LineaEconomica {
  id: string;
  prefijoId: string;
  tipo: TipoLinea;                     // HONORARIO | SUPLIDO | ENTREGA_A_CUENTA
  concepto: string;                    // "Declaración Renta", "Tasa DGT"
  importe: number | null;
  unidad?: string;                     // "hora", "unidad", etc.
  ivaPorDefecto: number | null;        // % IVA si aplica
  incluyeIva: boolean;                 // ¿El importe incluye IVA?
  activo: boolean;
  orden: number;
  movimientoIdAsociado?: string;       // Opcional: mapeo con Movimiento
  createdAt: string;
  updatedAt: string;
}

enum TipoLinea {
  HONORARIO = 'HONORARIO',
  SUPLIDO = 'SUPLIDO',
  ENTREGA_A_CUENTA = 'ENTREGA_A_CUENTA'
}
```

---

## 4️⃣ Reglas Fiscales y de IVA

### Reglas Básicas por Naturaleza

| Naturaleza | Tipo IVA | IVA % | Afecta Base | Afecta IVA | Cuenta Principal |
|------------|----------|-------|-------------|------------|------------------|
| HONORARIO | SUJETO | 21% | ✅ | ✅ | 705xxx (Ingresos) |
| SUPLIDO | NO_SUJETO | - | ❌ | ❌ | 6xx/55x (Suplidos) |
| ENTREGA_A_CUENTA | ⚠️ PENDIENTE | ⚠️ | ❌ | ⚠️ | 438/55x (Provisiones) |

### ⚠️ DECISIÓN PENDIENTE: Entregas a Cuenta

**Pregunta crítica:** ¿Cómo se tratan las entregas a cuenta actualmente?

**Opción A: Recibo/Movimiento Interno (SIN factura)**
- No genera factura inmediata
- No lleva IVA en el momento del cobro
- Se contabiliza como provisión/anticipo
- Se regulariza en factura final
- Cuenta: 438xxx o 55xxx (Anticipos de clientes)

**Opción B: Factura de Anticipo (CON factura)**
- Se emite factura de anticipo
- Lleva IVA en el momento del cobro
- Se descuenta en factura final
- Cuenta: 430xxx (Clientes) + 477xxx (IVA repercutido)

**👉 ACCIÓN REQUERIDA:** Confirmar cuál es el procedimiento actual.

---

## 5️⃣ Entidad: Asiento Contable (Preparación futura)

Para cuando se implemente contabilidad interna completa.

### Asiento

```typescript
interface AsientoContable {
  id: string;
  expedienteId: string;
  fecha: string;                       // Fecha del asiento
  descripcion: string;
  origen: OrigenAsiento;               // MOVIMIENTO | FACTURA | COBRO | PAGO
  estado: EstadoAsiento;               // BORRADOR | CONFIRMADO
  createdAt: string;
  updatedAt: string;
}

enum OrigenAsiento {
  MOVIMIENTO = 'MOVIMIENTO',
  FACTURA = 'FACTURA',
  COBRO = 'COBRO',
  PAGO = 'PAGO'
}

enum EstadoAsiento {
  BORRADOR = 'BORRADOR',
  CONFIRMADO = 'CONFIRMADO'
}
```

### Apunte

```typescript
interface ApunteContable {
  id: string;
  asientoId: string;
  cuentaContable: string;              // Código de cuenta
  debe: number;                        // Importe en DEBE
  haber: number;                       // Importe en HABER
  concepto: string;
  referenciaMovimientoId?: string;     // Referencia al movimiento origen
}
```

---

## 📊 Ejemplos de Datos

### Ejemplo 1: Honorario - Declaración Renta

```json
{
  "codigo": "HON_DECL_RENTA",
  "nombre": "Honorarios Declaración Renta",
  "naturaleza": "HONORARIO",
  "tipoIva": "SUJETO",
  "ivaPorDefecto": 21,
  "afectaFactura": true,
  "afectaBaseImponible": true,
  "afectaIva": true,
  "imprimibleEnFactura": true,
  "modoCalculo": "MANUAL",
  "activo": true
}
```

**Cuentas contables:**
- INGRESO → 705000 (HABER)
- IVA_REPER → 477000 (HABER)
- CLIENTE → 430000 (DEBE)

---

### Ejemplo 2: Suplido - Tasa DGT

```json
{
  "codigo": "SUP_TASA_DGT",
  "nombre": "Tasa DGT",
  "naturaleza": "SUPLIDO",
  "tipoIva": "NO_SUJETO",
  "ivaPorDefecto": null,
  "afectaFactura": true,
  "afectaBaseImponible": false,
  "afectaIva": false,
  "imprimibleEnFactura": true,
  "modoCalculo": "MANUAL",
  "activo": true
}
```

**Cuentas contables:**
- GASTO_SUPLIDO → 555000 o 600000 (según método)
- CLIENTE → 430000 (DEBE)

---

### Ejemplo 3: Entrega a Cuenta - Provisión

```json
{
  "codigo": "EAC_PROVISION",
  "nombre": "Provisión de fondos",
  "naturaleza": "ENTREGA_A_CUENTA",
  "tipoIva": "NO_SUJETO",
  "ivaPorDefecto": null,
  "afectaFactura": false,
  "afectaBaseImponible": false,
  "afectaIva": false,
  "imprimibleEnFactura": false,
  "modoCalculo": "MANUAL",
  "activo": true
}
```

**Cuentas contables (Opción A - Sin factura):**
- BANCO → 572000 (DEBE)
- PROVISION → 438000 (HABER)

---

### Ejemplo 4: Prefijo FITRI (Departamento Fiscal)

```json
{
  "codigo": "FITRI",
  "descripcion": "Departamento Fiscal - Tramitaciones Renta",
  "numeracionUltimo": 58031,
  "numeracionPadding": 4,
  "numeracionSeparador": "-",
  "formatoNumero": "FITRI-{NUM:0000}",
  "activo": true
}
```

**Movimientos predefinidos:**
1. HON_DECL_RENTA (obligatorio, orden: 1)
2. SUP_TASA_DGT (opcional, orden: 2)
3. EAC_PROVISION (opcional, editable, orden: 3)

**Líneas económicas por defecto:**
- Honorario: "Declaración Renta" → 120€ + IVA 21%
- Suplido: "Tasa DGT" → 15€ sin IVA
- Entrega a cuenta: "Provisión de fondos" → 100€ sin IVA

---

## ✅ Beneficios del Modelo

1. **Respeta la lógica histórica** - Mantiene conceptos de honorarios, suplidos y entregas a cuenta
2. **Moderniza la arquitectura** - Atributos claros, reglas explícitas, sin "códigos mágicos"
3. **Elimina dependencias de Excel** - Todo parametrizable desde la aplicación
4. **Automatiza facturación** - Reglas claras de IVA y contabilidad
5. **Escalable** - Fácil añadir retenciones, IRPF, operaciones UE, etc.
6. **Auditable** - Trazabilidad completa de movimientos y asientos

---

## 🚧 Próximos Pasos

1. ✅ **CONFIRMAR:** Tratamiento de entregas a cuenta (Opción A o B)
2. Definir cuentas contables específicas según plan contable usado
3. Implementar catálogo de movimientos maestro
4. Migrar prefijos existentes al nuevo modelo
5. Crear interfaz de gestión de movimientos
6. Implementar motor de cálculo de IVA
7. Preparar generación de asientos contables

---

## 📝 Notas de Implementación

### Migración de Datos Existentes

Los prefijos actuales con "líneas económicas" deben migrarse:
- Cada línea económica → puede convertirse en un Movimiento
- O mantenerse como LineaEconomica y asociarse a un Movimiento existente

### Compatibilidad con Sistema Actual

El modelo es compatible con la estructura actual de `PrefixConfig` y `PrefixLine`:
- `PrefixConfig` → `PrefijoExpediente`
- `PrefixLine` → `LineaEconomica`
- Nuevo: `Movimiento` (catálogo maestro)
- Nuevo: `PrefijoMovimiento` (relación plantilla)

---

**Documento en revisión - Pendiente de confirmación sobre entregas a cuenta**
