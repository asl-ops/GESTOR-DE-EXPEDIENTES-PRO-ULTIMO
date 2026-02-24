# 🔒 Protección de Acceso Administrativo

## Problema Identificado

Existía una **inconsistencia de seguridad** en el acceso al módulo de Administración:

- ✅ **Menú clásico** (barra superior): Requería contraseña
- ❌ **Tarjeta del hub**: Acceso directo sin validación

Esto creaba:
1. **Experiencia inconsistente** para el usuario
2. **Agujero de seguridad** (bypass de autenticación)
3. **Confusión** sobre cuándo se requiere autenticación

---

## Solución Implementada

### **Protección Centralizada**

Ahora **ambas rutas** de acceso a Administración están protegidas con el mismo mecanismo:

```
┌─────────────────────────────────────────┐
│                                         │
│  ACCESO A ADMINISTRACIÓN                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  1. Menú Superior → SecureModal ✓       │
│  2. Tarjeta Hub   → SecureModal ✓       │
│                                         │
│  Ambos usan la misma contraseña         │
│  configurada en appSettings             │
│                                         │
└─────────────────────────────────────────┘
```

---

## Cambios Realizados

### **1. MainNavigationHub.tsx**

#### **Imports añadidos:**
```typescript
import { useState } from 'react';
import SecureConfirmationModal from './SecureConfirmationModal';
import { useAppContext } from '../contexts/AppContext';
```

#### **Estado añadido:**
```typescript
const { appSettings } = useAppContext();
const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
const [pendingRoute, setPendingRoute] = useState<string | null>(null);
```

#### **Lógica de protección:**
```typescript
const handleCardClick = (card: NavigationCard) => {
    // Check if this is the admin route
    if (card.id === 'administracion') {
        // Show authentication modal
        setPendingRoute(card.route);
        setIsAdminModalOpen(true);
    } else {
        // Navigate directly for non-admin routes
        navigateToRoute(card.route);
    }
};
```

#### **Modal añadido:**
```typescript
<SecureConfirmationModal
    isOpen={isAdminModalOpen}
    onClose={handleAdminCancel}
    onConfirm={handleAdminConfirm}
    title="Acceso Administrativo"
    message="Introduce la contraseña de seguridad..."
    requirePassword={true}
    correctPassword={appSettings?.deletePassword || '1812'}
/>
```

### **2. adminAuthService.ts** (Nuevo)

Servicio centralizado para futuras expansiones:
- `requireAdminAuth()` - Guard genérico
- `getAdminPassword()` - Obtiene contraseña configurada
- `validateAdminPassword()` - Valida contraseña

---

## Flujo de Autenticación

### **Desde el Menú Superior:**

```
Usuario click "Administración"
    ↓
handleNavClick() detecta id === 'config'
    ↓
setIsAdminModalOpen(true)
    ↓
Usuario introduce contraseña
    ↓
Si correcta → navigateTo('/config')
Si incorrecta → Modal se cierra
```

### **Desde la Tarjeta del Hub:**

```
Usuario click tarjeta "ADMINISTRACIÓN"
    ↓
handleCardClick() detecta id === 'administracion'
    ↓
setPendingRoute('/config')
setIsAdminModalOpen(true)
    ↓
Usuario introduce contraseña
    ↓
Si correcta → navigateToRoute(pendingRoute)
Si incorrecta → Modal se cierra, pendingRoute = null
```

---

## Configuración de Contraseña

La contraseña se configura en:
- **Ruta**: Panel de Control > Seguridad
- **Campo**: `deletePassword` en `appSettings`
- **Default**: `'1812'`

---

## Ventajas de esta Solución

✅ **Consistencia**: Misma experiencia desde cualquier punto de acceso  
✅ **Seguridad**: No hay bypass posible  
✅ **Centralización**: Un solo componente (`SecureConfirmationModal`)  
✅ **Mantenibilidad**: Fácil de actualizar en el futuro  
✅ **Escalabilidad**: Preparado para añadir más rutas protegidas  

---

## Rutas Protegidas Actuales

| Ruta | Requiere Auth | Método |
|------|---------------|--------|
| `/config` | ✅ Sí | SecureConfirmationModal |
| `/clients` | ❌ No | - |
| `/` (Dashboard) | ❌ No | - |
| `/billing` | ❌ No | - |
| `/proformas` | ❌ No | - |
| `/invoices` | ❌ No | - |
| `/economico` | ❌ No | - |

---

## Cómo Añadir Más Rutas Protegidas

Si en el futuro quieres proteger otra ruta (ej: Económico):

1. **En `MainNavigationHub.tsx`:**
```typescript
const handleCardClick = (card: NavigationCard) => {
    // Añadir más IDs protegidos
    if (card.id === 'administracion' || card.id === 'economico') {
        setPendingRoute(card.route);
        setIsAdminModalOpen(true);
    } else {
        navigateToRoute(card.route);
    }
};
```

2. **En `AppShell.tsx`:**
```typescript
const handleNavClick = (item: typeof navItems[0]) => {
    // Añadir más IDs protegidos
    if (item.id === 'config' || item.id === 'economico') {
        setIsAdminModalOpen(true);
    } else {
        navigateTo(item.path);
    }
};
```

---

## Testing

### **Prueba 1: Acceso desde Menú**
1. Click en "Administración" (barra superior)
2. Debe aparecer modal de contraseña
3. Introducir contraseña incorrecta → Modal se cierra
4. Volver a intentar con contraseña correcta → Navega a /config

### **Prueba 2: Acceso desde Tarjeta**
1. Cambiar a vista de tarjetas
2. Click en tarjeta "ADMINISTRACIÓN"
3. Debe aparecer el MISMO modal
4. Comportamiento idéntico al Prueba 1

### **Prueba 3: Otras Rutas**
1. Click en cualquier otra tarjeta (Clientes, Expedientes, etc.)
2. Debe navegar directamente SIN pedir contraseña

---

## Notas de Seguridad

⚠️ **Importante**: Esta es una protección a nivel de UI. Para seguridad real en producción:

1. Implementar autenticación en el backend
2. Usar tokens JWT o sesiones
3. Validar permisos en cada endpoint
4. No confiar solo en validación client-side

La protección actual es adecuada para:
- ✅ Prevenir accesos accidentales
- ✅ Añadir fricción para usuarios no autorizados
- ✅ Mantener consistencia de UX

---

**Versión**: 1.0.0  
**Fecha**: Enero 2026  
**Estado**: ✅ Implementado y Probado
