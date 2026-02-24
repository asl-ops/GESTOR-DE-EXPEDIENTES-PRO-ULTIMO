
import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    Plus,
    Trash2,
    Pencil,
    X,
    Check,
    GripVertical
} from 'lucide-react';
import { PaymentMethod } from '@/types/paymentMethod';
import {
    subscribeToPaymentMethods,
    savePaymentMethod,
    deletePaymentMethod,
    seedPaymentMethods
} from '@/services/paymentMethodService';
import { useToast } from '@/hooks/useToast';
import { Button } from './ui/Button';
import { useConfirmation } from '@/hooks/useConfirmation';
import ConfirmationModal from './ConfirmationModal';

const PaymentMethodManager: React.FC = () => {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<PaymentMethod>>({});
    const { addToast } = useToast();
    const { confirmationState, confirm, closeConfirmation } = useConfirmation();

    useEffect(() => {
        const unsubscribe = subscribeToPaymentMethods(setMethods);
        return () => unsubscribe();
    }, []);

    const handleSeed = async () => {
        try {
            await seedPaymentMethods();
            addToast('Valores iniciales cargados', 'success');
        } catch (error) {
            addToast('Error al cargar valores iniciales', 'error');
        }
    };

    const handleEdit = (method: PaymentMethod) => {
        setEditingId(method.id);
        setEditForm(method);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async () => {
        if (editForm.codigo === undefined || !editForm.nombre) {
            addToast('Código y Nombre son obligatorios', 'error');
            return;
        }

        // Validar código único (excepto si estamos editando el mismo)
        const isDuplicate = methods.find(m => m.codigo === Number(editForm.codigo) && m.id !== editingId);
        if (isDuplicate) {
            addToast('El código ya existe', 'error');
            return;
        }

        try {
            await savePaymentMethod({
                ...editForm,
                codigo: Number(editForm.codigo),
                activo: editForm.activo ?? true,
                orden: editForm.orden ?? (methods.length > 0 ? Math.max(...methods.map(m => m.orden)) + 1 : 0)
            });
            addToast(editingId ? 'Actualizado correctamente' : 'Creado correctamente', 'success');
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            addToast('Error al guardar', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Eliminar forma de cobro',
            message: '¿Seguro que deseas eliminar esta forma de cobro?',
            description: 'Esta acción desactivará el registro y puede afectar listados y configuraciones existentes.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await deletePaymentMethod(id);
            addToast('Eliminado correctamente', 'info');
        } catch (error) {
            addToast('Error al eliminar', 'error');
        }
    };

    const toggleStatus = async (method: PaymentMethod) => {
        try {
            await savePaymentMethod({ ...method, activo: !method.activo });
        } catch (error) {
            addToast('Error al cambiar estado', 'error');
        }
    };

    const handleAddNew = () => {
        setEditingId('new');
        setEditForm({
            codigo: methods.length > 0 ? Math.max(...methods.map(m => m.codigo)) + 1 : 0,
            nombre: '',
            activo: true,
            orden: methods.length > 0 ? Math.max(...methods.map(m => m.orden)) + 1 : 0
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        Formas de Cobro / Pago
                    </h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                        Gestione los conceptos disponibles para el cobro de facturas
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {methods.length === 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl"
                            onClick={handleSeed}
                        >
                            Cargar iniciales
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="h-10 px-4 rounded-xl"
                        onClick={handleAddNew}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 app-label">Orden</th>
                            <th className="px-8 py-5 app-label">Código</th>
                            <th className="px-8 py-5 app-label">Concepto / Nombre</th>
                            <th className="px-8 py-5 app-label text-center">Estado</th>
                            <th className="px-8 py-5 app-label text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {methods.map((method) => (
                            <tr key={method.id} className={`group hover:bg-slate-50/50 transition-all ${editingId === method.id ? 'bg-sky-50/30' : ''}`}>
                                <td className="px-8 py-4 text-xs text-slate-400 font-mono">
                                    {editingId === method.id ? (
                                        <input
                                            type="number"
                                            value={editForm.orden ?? ''}
                                            onChange={e => setEditForm({ ...editForm, orden: parseInt(e.target.value) })}
                                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <GripVertical size={12} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                            {method.orden}
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-4 text-xs font-black text-slate-700">
                                    {editingId === method.id ? (
                                        <input
                                            type="number"
                                            value={editForm.codigo ?? ''}
                                            onChange={e => setEditForm({ ...editForm, codigo: parseInt(e.target.value) })}
                                            className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                                        />
                                    ) : method.codigo}
                                </td>
                                <td className="px-8 py-4 text-xs font-bold text-slate-600">
                                    {editingId === method.id ? (
                                        <input
                                            type="text"
                                            value={editForm.nombre ?? ''}
                                            onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold"
                                        />
                                    ) : (
                                        <span className={method.activo ? '' : 'text-slate-300 line-through'}>{method.nombre}</span>
                                    )}
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <button
                                        onClick={() => toggleStatus(method)}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${method.activo ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : 'bg-slate-100 text-slate-400 opacity-50'}`}
                                    >
                                        {method.activo ? 'Activo' : 'Inactivo'}
                                    </button>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        {editingId === method.id ? (
                                            <>
                                                <button onClick={handleSave} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><Check size={16} /></button>
                                                <button onClick={handleCancel} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X size={16} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEdit(method)} className="p-2 text-sky-500 hover:bg-sky-50 rounded-xl transition-all"><Pencil size={16} /></button>
                                                <button onClick={() => handleDelete(method.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {editingId === 'new' && (
                            <tr className="bg-sky-50/30 animate-in slide-in-from-bottom-2">
                                <td className="px-8 py-4">
                                    <input
                                        type="number"
                                        value={editForm.orden ?? ''}
                                        onChange={e => setEditForm({ ...editForm, orden: parseInt(e.target.value) })}
                                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                    />
                                </td>
                                <td className="px-8 py-4">
                                    <input
                                        type="number"
                                        value={editForm.codigo ?? ''}
                                        onChange={e => setEditForm({ ...editForm, codigo: parseInt(e.target.value) })}
                                        className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                                        placeholder="Cod"
                                    />
                                </td>
                                <td className="px-8 py-4">
                                    <input
                                        type="text"
                                        value={editForm.nombre ?? ''}
                                        onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold"
                                        placeholder="Nombre de la forma de cobro..."
                                    />
                                </td>
                                <td className="px-8 py-4 text-center">
                                    <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">NUEVO</span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={handleSave} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><Check size={16} /></button>
                                        <button onClick={handleCancel} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {methods.length === 0 && editingId !== 'new' && (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-4">
                                            <CreditCard className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Sin formas de cobro configuradas</p>
                                        <p className="text-slate-200 font-bold uppercase tracking-widest text-[8px] mt-1">Haga clic en el botón superior o cargue los iniciales</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
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
};

export default PaymentMethodManager;
