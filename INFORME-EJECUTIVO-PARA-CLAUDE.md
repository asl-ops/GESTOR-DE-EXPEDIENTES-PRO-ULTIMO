# Informe Ejecutivo: Gestor de Expedientes PRO

## 📋 Resumen Ejecutivo

**Gestor de Expedientes PRO** es una aplicación web moderna para la gestión integral de expedientes administrativos, orientada específicamente a gestorías y asesorías administrativas que tramitan documentación vehicular (matriculaciones, transferencias, bajas, etc.) y otros procedimientos administrativos.

**Tecnologías Clave:**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Firestore + Storage + Authentication)
- **UI/UX**: TailwindCSS + Lucide Icons
- **Inteligencia Artificial**: Google Gemini API
- **Procesamiento**: OCR (Tesseract.js), Generación de PDFs (jsPDF, @react-pdf/renderer), Plantillas DOCX (docxtemplater)
- **Gestión de Estado**: Zustand
- **Routing**: React Router DOM

---

## 🎯 Propósito de la Aplicación

Esta aplicación resuelve problemas críticos de las gestorías administrativas:

1. **Gestión centralizada de expedientes** vehiculares y administrativos
2. **Seguimiento económico detallado** con facturación y control de costes
3. **Automatización mediante IA** para entrada de datos desde documentos escaneados
4. **Gestión unificada de clientes** sin duplicados
5. **Generación automática de documentos** (mandatos, informes, facturas)
6. **Comunicaciones trazables** (llamadas, emails, notas, WhatsApp)
7. **Integración con plataformas externas** (Hermes DGT, futuras APIs administrativas)

---

## 🏗️ Arquitectura del Sistema

### Modelo de Datos Principal

#### 1. **Expedientes (CaseRecord)**
```typescript
interface CaseRecord {
  fileNumber: string;              // Número único de expediente
  
  // SISTEMA NUEVO: Cliente centralizado
  clienteId?: string;              // Referencia al cliente
  clientSnapshot?: ClientSnapshot; // Cache para listados rápidos
  
  // DEPRECADO (compatibilidad)
  client: Client;                  // Cliente embebido (legacy)
  
  vehicle: Vehicle;                // Datos del vehículo
  fileConfig: FileConfig;          // Categoría y tipo de trámite
  economicData: EconomicData;      // Gestión económica
  communications: Communication[]; // Historial de comunicaciones
  status: string;                  // Estado dinámico del expediente
  attachments: AttachedDocument[]; // Documentos adjuntos
  tasks: Task[];                   // Tareas pendientes
  
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  situation?: string;              // Situación actual
}
```

#### 2. **Clientes (ClientV2)** - Sistema Centralizado
```typescript
interface ClientV2 {
  id: string;
  tipo: 'PARTICULAR' | 'EMPRESA';
  nombre: string;                  // Nombre completo o razón social
  documento?: string;              // DNI/NIE/CIF
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt: string;
  updatedAt: string;
}
```

#### 3. **Vehículos (Vehicle)**
```typescript
interface Vehicle {
  id?: string;
  vin: string;        // Número de bastidor
  brand: string;      // Marca
  model: string;      // Modelo
  year: string;       // Año
  engineSize: string; // Cilindrada
  fuelType: string;   // Tipo de combustible
}
```

#### 4. **Datos Económicos (EconomicData)**
```typescript
interface EconomicData {
  lines: EconomicLineItem[];  // Líneas de concepto/importe
  subtotalAmount: number;     // Subtotal
  vatAmount: number;          // IVA
  totalAmount: number;        // Total
}
```

---

## 📂 Categorías de Expedientes

### Sistema Jerárquico

**Categoría → Subtipo → Campos Dinámicos**

#### Categorías Principales:

1. **GE-MAT** (Gestión - Matriculación)
   - Subtiposes: Matriculación, Transferencia, Baja Definitiva, Cambio de Titularidad
   
2. **FI-TRI** (Fiscal - Tributario)
   - Subtipos: IRPF, IVA, Sociedades, Autónomos
   
3. **FI-CONTA** (Financiero - Contable)
   - Subtipos: Contabilidad Mensual, Auditoría, Cierre Fiscal

### Campos Dinámicos Configurables

Cada categoría puede tener campos personalizados (dropdowns) configurables desde la aplicación.

**Ejemplo para GE-MAT:**
```typescript
{
  id: "field_vehicleCondition",
  label: "Estado del Vehículo",
  options: ["Nuevo", "Segunda Mano", "KM 0"]
}
```

---

## 🚀 Funcionalidades Principales

### 1. **Dashboard Inteligente**
- Vista general de expedientes con métricas clave
- Filtros avanzados (cliente, estado, tipo, fechas)
- Búsqueda rápida por número de expediente
- Sistema de vistas guardadas (filtros preconfigurados)
- Tarjetas visuales con códigos de color por estado

### 2. **Gestión de Expedientes**

#### Creación y Edición:
- Formulario completo con validación
- Autocompletado de clientes con búsqueda inteligente
- Alta rápida de clientes sin salir del formulario
- Datos del vehículo con validación de VIN
- Configuración económica con plantillas predefinidas
- Gestión de documentos adjuntos con Firebase Storage
- Sistema de tareas con asignación a usuarios
- Historial de comunicaciones categorizado

#### Estados Dinámicos:
Estados configurables por el usuario (defaults):
- Pendiente Documentación
- En Trámite
- Pendiente DGT
- Pendiente Pago
- Finalizado
- Archivado

### 3. **Sistema de Clientes Centralizado**

**Componente: `ClientTypeahead`**
- Búsqueda inteligente por nombre o documento
- Normalización de texto (sin tildes, case-insensitive)
- Debounce de 250ms para rendimiento
- Alta rápida desde el formulario de expediente
- Snapshot de datos para rendimiento en listados

**Administrador: `ClientExplorer`**
- CRUD completo de clientes
- Búsqueda avanzada
- Activar/desactivar clientes
- Ver expedientes asociados por cliente

### 4. **Gestión Económica Avanzada**

#### Características:
- Líneas de concepto con importes
- Cálculo automático de IVA
- Plantillas económicas por tipo de trámite
- Exportación a PDF de resúmenes económicos
- Integración con facturación

#### Plantillas Económicas:
```typescript
{
  "Matriculación": [
    { concept: "Tasas DGT", amount: 94.50, included: true },
    { concept: "Honorarios Gestoría", amount: 120.00, included: true },
    { concept: "Desplazamiento", amount: 30.00, included: false }
  ]
}
```

### 5. **Inteligencia Artificial (Gemini)**

#### OCR Inteligente:
- Extracción de datos desde documentos escaneados
- Soporte para:
  - DNI/NIE (datos personales)
  - Permiso de Circulación (datos vehículo)
  - Documentos DGT
- Validación automática de campos extraídos
- Sugerencias de corrección

#### Asistente IA:
- Responde preguntas sobre normativa
- Sugiere acciones según el estado del expediente
- Generación de textos para comunicaciones

### 6. **Generación de Documentos**

#### Mandatos (DOCX):
- Plantilla personalizable con docxtemplater
- Variables dinámicas del cliente y expediente
- Generación y descarga automática

#### Informes PDF:
- Resumen completo del expediente
- Datos económicos detallados
- Historial de comunicaciones
- Lista de documentos adjuntos

### 7. **Sistema de Comunicaciones**

#### Tipos:
- 📞 Llamadas telefónicas
- 📧 Emails
- 💬 WhatsApp
- 📝 Notas internas

#### Características:
- Timestamp preciso
- Autor registrado (multiusuario)
- Búsqueda por concepto
- Historial cronológico

### 8. **Gestión de Documentos**

#### Firebase Storage:
- Subida de archivos con barra de progreso
- Organización por expediente: `case_files/{fileNumber}/{documentId}`
- Estados: local, uploading, synced, error
- Visualización inline de PDFs e imágenes
- Descarga con un click

#### Formatos Soportados:
- PDF, DOC, DOCX
- JPG, PNG, WEBP
- XLS, XLSX
- Cualquier formato (visualización genérica)

### 9. **Sistema de Tareas**

#### Características:
- Asignación a usuarios
- Estado completado/pendiente
- Autor registrado
- Fecha de creación
- Filtrado por responsable

### 10. **Integración con Hermes (DGT)**

Preparado para integración con la plataforma oficial de la DGT:
- Envío de trámites
- Recepción de informes
- Actualización automática de estados

---

## 👥 Sistema Multiusuario

### Usuarios (User):
```typescript
interface User {
  id: string;
  name: string;
  initials: string;   // Para avatares
  avatarColor: string; // Color distintivo
}
```

### Gestión:
- Pantalla de administración de usuarios (`/#/admin/users`)
- Asignación de tareas por usuario
- Filtros por responsable
- Trazabilidad de acciones (quién creó, quién modificó)

---

## 🎨 Diseño y UX

### Características Destacadas:
- **Diseño Premium**: Glassmorphism, sombras suaves, animaciones fluidas
- **Responsive**: Optimizado para desktop y móvil
- **Breadcrumbs**: Navegación contextual siempre visible
- **Modales Inteligentes**: Confirmación antes de acciones destructivas
- **Toasts**: Notificaciones no intrusivas
- **Temas de Color**: Basados en estado del expediente
- **Iconografía Consistent**: Lucide Icons en toda la app

### Navegación:
```
/#/                          → Dashboard
/#/case/:id                  → Detalle de expediente
/#/case/new                  → Crear expediente
/#/clients                   → Gestor de clientes
/#/settings                  → Configuración
/#/admin/users               → Administración de usuarios
/#/admin/field-config        → Configurar campos dinámicos
/#/admin/economic-templates  → Plantillas económicas
```

---

## 🔒 Seguridad y Autenticación

### Firebase Authentication:
- Login con email/password
- Protección de rutas
- Sesiones persistentes
- Logout seguro

### Firestore Security Rules:
- Acceso basado en usuario autenticado
- Reglas granulares por colección
- Validación de datos en el backend

---

## 📊 Reportes y Analytics

### Métricas del Dashboard:
- Total de expedientes activos
- Expedientes por estado
- Ingresos totales (suma económica)
- Expedientes pendientes de pago
- Gráficos con Recharts

### Exportaciones:
- PDF de expediente individual
- Resumen económico global (futuro)
- Listado de clientes (Excel)

---

## 🛠️ Herramientas de Importación

### Scripts Disponibles:

#### 1. **Importación de Clientes desde Excel**
```bash
npm run import-clients
npm run import-clients-fast  # Versión optimizada
```

**Formato esperado (clientes-ejemplo.xlsx):**
- Columnas: Tipo, Nombre, Documento, Teléfono, Email, Dirección, Notas
- Detección de duplicados por documento
- Validación de campos requeridos

#### 2. **Generación de Excel de Ejemplo**
```bash
npm run generate-sample-excel
```

#### 3. **Eliminación Masiva de Clientes**
```bash
npm run delete-all-clients  # ⚠️ PELIGROSO - Solo desarrollo
```

---

## 📦 Estructura del Proyecto

```
gestor-de-expedientes-pro/
├── src/
│   ├── components/       # 126+ componentes React
│   ├── services/         # 34+ servicios (Firebase, IA, etc.)
│   ├── hooks/            # 13 hooks personalizados
│   ├── types/            # 7 archivos de tipos TypeScript
│   ├── utils/            # 8 utilidades
│   ├── contexts/         # Contextos (Auth, Settings)
│   ├── config/           # Configuración Firebase
│   ├── pages/            # Páginas principales
│   ├── store/            # Zustand store
│   └── App.tsx           # Componente raíz
├── docs/                 # 14 documentos de especificación
├── scripts/              # 5 scripts de utilidad
├── public/               # Assets estáticos
├── FICHEROS MANDATO/     # Plantillas DOCX
└── firebase.json         # Configuración Firebase Hosting
```

---

## 🚧 Estado Actual y TODOs

### ✅ Funcionalidades Completadas:
- ✅ Sistema de clientes centralizado
- ✅ CRUD de expedientes
- ✅ Gestión económica con plantillas
- ✅ Generación de mandatos DOCX
- ✅ OCR con IA (Gemini)
- ✅ Sistema de comunicaciones
- ✅ Gestión de documentos (Firebase Storage)
- ✅ Dashboard con métricas
- ✅ Vistas guardadas
- ✅ Sistema multiusuario
- ✅ Importación masiva de clientes

### 🔨 En Desarrollo:
- 🔨 Integración completa con Hermes DGT
- 🔨 Informes PDF avanzados
- 🔨 Sincronización offline (Service Workers)
- 🔨 Migración de expedientes legacy a nuevo sistema de clientes

### 📋 Roadmap Futuro:
- 📋 App móvil (React Native)
- 📋 Notificaciones push
- 📋 Calendario de vencimientos
- 📋 Gestión de caja y tesorería
- 📋 Facturación electrónica integrada
- 📋 Firma digital de documentos
- 📋 API pública para integraciones

---

## 📈 Métricas de Rendimiento

### Optimizaciones Implementadas:
- **Debounce** en búsquedas (250ms)
- **Lazy loading** de componentes pesados
- **Snapshots de clientes** para evitar queries adicionales
- **Límites de resultados** en listados (50-100 items)
- **Índices compuestos** en Firestore
- **Caching en localStorage** para datos de configuración

### Tiempos Esperados:
- ⚡ Carga inicial: < 2s
- ⚡ Búsqueda de clientes: 50-100ms
- ⚡ Filtrado de expedientes: instantáneo (en memoria)
- ⚡ Carga de expediente: < 500ms

---

## 🔧 Configuración y Despliegue

### Desarrollo Local:
```bash
npm install
npm run dev  # http://localhost:5173
```

### Producción:
```bash
npm run build
firebase deploy --only hosting
```

### Variables de Entorno (.env.local):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
```

---

## 🎓 Guías de Uso

Ver carpeta `/docs`:
- **client-system.md**: Sistema de clientes centralizado
- **economic-model-specification.md**: Modelo económico detallado (32KB)
- **migration-notes.md**: Migración de datos legacy
- **confirmation-modal-guide.md**: Modales de confirmación
- **admin-auth-protection.md**: Protección de rutas admin
- **SAVED-VIEWS-SYSTEM.md**: Sistema de vistas guardadas
- **IMPORTACION-CLIENTES.md**: Guía de importación

---

## 📝 Notas Importantes para Claude

1. **Base de Datos**: Firestore (NoSQL)
   - Colecciones principales: `cases`, `clients`, `users`, `settings`
   - Snapshot pattern para rendimiento

2. **IA Generativa**: Google Gemini
   - Modelo: gemini-1.5-flash
   - Usos: OCR, asistente, validación

3. **Estado**: Zustand (alternativa ligera a Redux)
   - Store global para configuración
   - Contextos para auth y settings

4. **Routing**: Hash-based (`/#/`)
   - Compatible con Firebase Hosting
   - No requiere configuración servidor

5. **Compatibilidad Legacy**:
   - Mantiene campos deprecados (`client` embebido)
   - Migración gradual a sistema centralizado
   - Prioridad: clienteId > clientSnapshot > legacy

6. **Extensibilidad**:
   - Campos dinámicos configurables
   - Estados personalizables
   - Plantillas económicas editables
   - Multi-tenant preparado (futuro)

---

## 🤝 Soporte y Contacto

**Desarrollador**: Antonio Sánchez  
**Proyecto**: Gestor de Expedientes PRO  
**Versión**: 1.0.0  
**Última Actualización**: Enero 2026

---

## 🎯 Conclusión

**Gestor de Expedientes PRO** es una solución integral y moderna para gestorías administrativas que buscan:
- ✅ **Digitalizar** completamente sus procesos
- ✅ **Automatizar** tareas repetitivas con IA
- ✅ **Centralizar** información de clientes y expedientes
- ✅ **Escalar** sin límites técnicos
- ✅ **Optimizar** tiempos y reducir errores

La aplicación está diseñada con arquitectura escalable, UX premium y las mejores prácticas de desarrollo moderno (TypeScript, componentes reutilizables, testing preparado, CI/CD con Firebase).
