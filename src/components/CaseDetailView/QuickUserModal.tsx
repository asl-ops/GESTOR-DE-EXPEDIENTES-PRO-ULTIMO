import React, { useState } from 'react';
import { X, UserPlus, Shield, User } from 'lucide-react';
import { User as UserType } from '../../types';

interface QuickUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: UserType) => void;
}

export const QuickUserModal: React.FC<QuickUserModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) return;

        const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['bg-sky-600', 'bg-emerald-600', 'bg-amber-600', 'bg-indigo-600', 'bg-rose-600', 'bg-violet-600'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newUser: UserType = {
            id: `user-${Date.now()}`,
            name: name.trim(),
            initials,
            avatarColor: randomColor,
            role
        };

        onSave(newUser);
        onClose();
        setName('');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="size-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <UserPlus size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Nuevo Responsable</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alta rápida de gestor</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Nombre Completo</label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Juan Pérez Sánchez"
                                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Rol del Usuario</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setRole('user')}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${role === 'user'
                                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                            : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    <User size={18} />
                                    <span className="text-sm font-black uppercase tracking-tight">Gestor</span>
                                </button>
                                <button
                                    onClick={() => setRole('admin')}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${role === 'admin'
                                            ? 'border-sky-500 bg-sky-50/50 text-sky-700'
                                            : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    <Shield size={18} />
                                    <span className="text-sm font-black uppercase tracking-tight">Admin</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name.trim()}
                            className="flex-1 h-12 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            Guardar Gestor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
