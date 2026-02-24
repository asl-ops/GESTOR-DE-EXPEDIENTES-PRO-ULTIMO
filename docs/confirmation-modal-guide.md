# 🎯 Guía de Uso: Modal de Confirmación Unificado

## 📋 Descripción

Sistema de confirmación elegante y consistente que reemplaza los `confirm()` nativos del navegador. Diseñado con estilo Notion/Apple, incluye descripción del impacto, iconos dinámicos y estados de carga.

---

## 🚀 Uso Básico

### 1. Importar el hook y el componente

```tsx
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';
```

### 2. Inicializar el hook en tu componente

```tsx
const { confirmationState, confirm, closeConfirmation } = useConfirmation();
```

### 3. Añadir el modal al render

```tsx
return (
    <div>
        {/* Tu contenido */}
        
        {/* Modal de confirmación */}
        <ConfirmationModal
            isOpen={confirmationState.isOpen}
            onClose={closeConfirmation}
            onConfirm={confirmationState.onConfirm}
            title={confirmationState.title}
            message={confirmationState.message}
            description={confirmationState.description}
            confirmText={confirmationState.confirmText}
            cancelText={confirmationState.cancelText}
            variant={confirmationState.variant}
        />
    </div>
);
```

### 4. Usar en tus funciones

```tsx
const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
        title: '¿Eliminar cliente?',
        message: `El cliente "${name}" será eliminado permanentemente.`,
        description: 'Esta acción no se puede deshacer. Todos los datos asociados serán eliminados.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger'
    });
    
    if (!confirmed) return;
    
    // Proceder con la eliminación
    await deleteClient(id);
};
```

---

## 🎨 Variantes Disponibles

### `danger` (Rojo) - Acciones destructivas
```tsx
variant: 'danger'
```
- Eliminar
- Borrar permanentemente
- Acciones irreversibles

### `warning` (Amarillo) - Acciones con precaución
```tsx
variant: 'warning'
```
- Cerrar
- Anular
- Desactivar
- Archivar

### `info` (Azul) - Acciones informativas
```tsx
variant: 'info'
```
- Guardar cambios
- Confirmar acción
- Proceder

### `success` (Verde) - Acciones positivas
```tsx
variant: 'success'
```
- Completar
- Aprobar
- Activar

---

## 🛠️ Funciones Helper

El hook incluye funciones helper para casos comunes:

### `confirmDelete`
```tsx
import { confirmDelete } from '@/hooks/useConfirmation';

const confirmed = await confirm({
    ...confirmDelete('cliente', 'Todos los expedientes asociados también serán eliminados.')
});
```

### `confirmClose`
```tsx
import { confirmClose } from '@/hooks/useConfirmation';

const confirmed = await confirm({
    ...confirmClose('expediente', 'El expediente será marcado como cerrado y no podrá modificarse.')
});
```

### `confirmVoid`
```tsx
import { confirmVoid } from '@/hooks/useConfirmation';

const confirmed = await confirm({
    ...confirmVoid('factura', 'La factura será anulada y no tendrá validez legal.')
});
```

### `confirmDeactivate`
```tsx
import { confirmDeactivate } from '@/hooks/useConfirmation';

const confirmed = await confirm({
    ...confirmDeactivate('cliente', 'Podrás reactivarlo más tarde si es necesario.')
});
```

### `confirmSave`
```tsx
import { confirmSave } from '@/hooks/useConfirmation';

const confirmed = await confirm({
    ...confirmSave('expediente', 'Los cambios serán guardados permanentemente.')
});
```

---

## 📝 Ejemplos Completos

### Ejemplo 1: Eliminar Cliente

**ANTES (confirm nativo):**
```tsx
const handleDelete = async (clientId: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    await deleteClient(clientId);
};
```

**DESPUÉS (modal elegante):**
```tsx
import { useConfirmation, confirmDelete } from '@/hooks/useConfirmation';

const { confirmationState, confirm, closeConfirmation } = useConfirmation();

const handleDelete = async (clientId: string, clientName: string) => {
    const confirmed = await confirm({
        ...confirmDelete('cliente'),
        message: `El cliente "${clientName}" será eliminado permanentemente.`,
        description: 'Todos los expedientes, facturas y documentos asociados también serán eliminados. Esta acción no se puede deshacer.'
    });
    
    if (!confirmed) return;
    
    try {
        await deleteClient(clientId);
        addToast('Cliente eliminado correctamente', 'success');
    } catch (error) {
        addToast('Error al eliminar cliente', 'error');
    }
};

// En el render:
<ConfirmationModal {...confirmationState} onClose={closeConfirmation} />
```

### Ejemplo 2: Cerrar Expediente

```tsx
const handleClose = async (caseId: string, caseNumber: string) => {
    const confirmed = await confirm({
        title: '¿Cerrar expediente?',
        message: `El expediente ${caseNumber} será marcado como cerrado.`,
        description: 'No podrás realizar más modificaciones una vez cerrado. Podrás reabrirlo más tarde si es necesario.',
        confirmText: 'Cerrar Expediente',
        cancelText: 'Cancelar',
        variant: 'warning'
    });
    
    if (!confirmed) return;
    
    await closeCase(caseId);
};
```

### Ejemplo 3: Anular Factura

```tsx
const handleVoid = async (invoiceId: string, invoiceNumber: string) => {
    const confirmed = await confirm({
        ...confirmVoid('factura'),
        message: `La factura ${invoiceNumber} será anulada.`,
        description: 'La factura perderá su validez legal y se generará un registro de anulación. Esta acción no se puede deshacer.'
    });
    
    if (!confirmed) return;
    
    await voidInvoice(invoiceId);
};
```

---

## 🎯 Checklist de Migración

Para reemplazar todos los `confirm()` en la aplicación:

1. ✅ Buscar todos los `confirm(` en el código
2. ✅ Importar `useConfirmation` y `ConfirmationModal`
3. ✅ Inicializar el hook
4. ✅ Añadir el modal al render
5. ✅ Reemplazar cada `confirm()` con `await confirm({...})`
6. ✅ Añadir descripción del impacto
7. ✅ Elegir la variante apropiada
8. ✅ Mejorar los mensajes de toast

---

## 🔍 Buscar y Reemplazar

### Comando para encontrar todos los confirm():
```bash
grep -r "confirm(" src/components --include="*.tsx"
```

### Archivos prioritarios a revisar:
- ✅ `ClientExplorer.tsx` (ya implementado)
- `Dashboard.tsx`
- `BillingView.tsx`
- `AlbaranesExplorer.tsx`
- `ProformasView.tsx`
- `InvoicesView.tsx`
- `CaseDetailView.tsx`
- `Configuration.tsx`

---

## 💡 Mejores Prácticas

1. **Siempre incluye descripción del impacto**: Explica qué pasará después de confirmar
2. **Usa nombres específicos**: En lugar de "esto", usa el nombre del item
3. **Elige la variante correcta**: `danger` para destructivas, `warning` para precaución
4. **Mejora los toasts**: Añade mensajes de éxito/error después de la acción
5. **Maneja errores**: Usa try/catch y muestra errores al usuario

---

## 🎨 Personalización

### Icono personalizado:
```tsx
import { Trash2 } from 'lucide-react';

const confirmed = await confirm({
    title: 'Eliminar permanentemente',
    message: 'Esta acción es irreversible',
    icon: <Trash2 className="w-6 h-6" />,
    variant: 'danger'
});
```

### Estado de carga:
```tsx
<ConfirmationModal
    {...confirmationState}
    onClose={closeConfirmation}
    loading={isDeleting}
/>
```

---

## ✅ Beneficios

1. ✅ **Consistencia**: Mismo diseño en toda la aplicación
2. ✅ **Claridad**: Descripción del impacto antes de actuar
3. ✅ **Profesional**: Diseño elegante estilo Notion/Apple
4. ✅ **Accesible**: Funciona con teclado (ESC para cerrar)
5. ✅ **Responsive**: Se adapta a móviles
6. ✅ **Animado**: Transiciones suaves
7. ✅ **Informativo**: Estados de carga visibles

---

## 🚀 Próximos Pasos

1. Reemplazar todos los `confirm()` en la aplicación
2. Añadir descripciones de impacto detalladas
3. Unificar mensajes de toast
4. Documentar casos especiales
