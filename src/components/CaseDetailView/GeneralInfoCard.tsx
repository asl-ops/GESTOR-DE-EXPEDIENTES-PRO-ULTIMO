import React, { useEffect, useState } from 'react';
import { PrefixConfig } from '../../types';

interface GeneralInfoCardProps {
    fileNumber: string; // 'new' or actual number
    predictedFileNumber: string;
    selectedPrefix: string;
    setSelectedPrefix: (p: string) => void;
    availablePrefixes: PrefixConfig[];
    fileConfig: any; // simplified, contains responsibleUserId, openedAt, closedAt, situation, status
    onFileConfigChange: (cfg: any) => void;
    users: any[];
    caseStatus: string;
    setCaseStatus: (s: string) => void;
    availableStatuses: string[];
    createdAt: string;
    onUnsavedChange?: (changed: boolean) => void;
}

export const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({
    fileNumber,
    predictedFileNumber,
    selectedPrefix,
    setSelectedPrefix,
    availablePrefixes,
    fileConfig,
    onFileConfigChange,
    users,
    caseStatus,
    setCaseStatus,
    availableStatuses,
    onUnsavedChange,
}) => {
    // Detect changes to mark unsaved
    const [localConfig, setLocalConfig] = useState(fileConfig);

    useEffect(() => {
        setLocalConfig(fileConfig);
    }, [fileConfig]);

    const handleChange = (field: string, value: any) => {
        const newCfg = { ...localConfig, [field]: value };
        setLocalConfig(newCfg);
        onFileConfigChange(newCfg);
        if (field === 'status') {
            setCaseStatus(value);
        }
        onUnsavedChange && onUnsavedChange(true);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100">
            {/* Prefijo + expediente */}
            <div className="mb-8">
                <label className="app-label-block">Identidad del Expediente</label>
                {fileNumber === 'new' ? (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[200px]">
                            <select
                                value={selectedPrefix}
                                onChange={e => setSelectedPrefix(e.target.value)}
                                className="w-full h-10 border border-[#cfdbe7] rounded-xl px-4 text-sm font-normal bg-white focus:ring-4 focus:ring-[#1380ec]/10 focus:border-[#1380ec] outline-none transition-all cursor-pointer shadow-sm"
                            >
                                {availablePrefixes.length === 0 && <option value="EXP">EXP</option>}
                                {[...availablePrefixes]
                                    .filter(p => p?.code && p.code.trim())
                                    .sort((a, b) => a.code.localeCompare(b.code))
                                    .map(p => (
                                        <option key={p.id} value={p.code}>{p.code}</option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="flex items-center gap-3 px-4 h-10 bg-slate-50 border border-slate-200 rounded-xl shadow-inner transition-all hover:bg-white hover:border-[#cfdbe7]">
                            <span className="text-[10px] font-normal uppercase tracking-[0.1em] text-[#617589]">Vista previa:</span>
                            <span className="text-base font-normal font-mono text-[#111418] tracking-tighter">
                                {predictedFileNumber.split('-').pop() || '0001'}
                            </span>
                            <div className="ml-2 px-2 py-0.5 bg-sky-50 text-[10px] font-normal text-sky-600 rounded border border-sky-100 uppercase tracking-tighter">
                                {selectedPrefix}-{predictedFileNumber.split('-').pop()}
                            </div>
                        </div>
                    </div>
                ) : (
                    null
                )}
            </div>

            {/* Responsable + Fecha Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Responsable */}
                <div>
                    <label className="app-label-block">Responsable Directo</label>
                    <div className="relative group">
                        <select
                            value={localConfig.responsibleUserId || ''}
                            onChange={e => handleChange('responsibleUserId', e.target.value)}
                            className="w-full h-10 border border-[#cfdbe7] rounded-xl px-4 text-sm font-normal bg-white focus:ring-4 focus:ring-[#1380ec]/10 focus:border-[#1380ec] outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Seleccionar responsable...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Fecha Apertura */}
                <div>
                    <label className="app-label-block">Fecha de Apertura</label>
                    <div className="relative group">
                        <input
                            type="date"
                            value={localConfig.openingDate ? localConfig.openingDate.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                            onChange={e => handleChange('openingDate', e.target.value)}
                            className="w-full h-10 border border-[#cfdbe7] rounded-xl px-4 text-sm font-normal bg-white focus:ring-4 focus:ring-[#1380ec]/10 focus:border-[#1380ec] outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Estado */}
            <div>
                <label className="app-label-block">Estado</label>
                <select
                    value={caseStatus}
                    onChange={e => handleChange('status', e.target.value)}
                    className="w-full h-9 border border-[#cfdbe7] rounded px-3 text-sm font-normal bg-white focus:ring-2 focus:ring-[#1380ec] outline-none"
                >
                    {availableStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
