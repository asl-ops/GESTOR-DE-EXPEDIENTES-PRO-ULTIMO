import React, { useState, useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export interface ExplorerColumn<T> {
    id: string;
    label: string;
    minWidth: number;
    defaultWidth: number;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    render: (row: T) => React.ReactNode;
}

interface ResizableExplorerTableProps<T> {
    data: T[];
    columns: ExplorerColumn<T>[];
    storageKey: string;
    onRowClick?: (row: T) => void;
    onRowDoubleClick?: (row: T) => void;
    selectedRowIds?: string[] | number[];
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    onSort?: (key: string) => void;
    rowIdKey: keyof T;
    onToggleSelectAll?: () => void;
    allSelected?: boolean;
    className?: string;
    density?: 'compact' | 'normal';
}

export function ResizableExplorerTable<T>({
    data,
    columns,
    storageKey,
    onRowClick,
    onRowDoubleClick,
    selectedRowIds = [],
    sortConfig,
    onSort,
    rowIdKey,
    onToggleSelectAll,
    allSelected,
    className = '',
    density = 'compact'
}: ResizableExplorerTableProps<T>) {
    const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing colWidths', e);
            }
        }
        const defaults: Record<string, number> = {};
        columns.forEach(col => {
            defaults[col.id] = col.defaultWidth;
        });
        return defaults;
    });

    const resizingRef = useRef<{ colId: string, startX: number, startWidth: number } | null>(null);

    const handleColResizeMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current) return;

        const { colId, startX, startWidth } = resizingRef.current;
        const column = columns.find(c => c.id === colId);
        const minWidth = column?.minWidth || 60;

        const delta = e.clientX - startX;
        const nextWidth = Math.max(minWidth, startWidth + delta);

        setColWidths(prev => ({
            ...prev,
            [colId]: nextWidth
        }));
    }, [columns]);

    const handleColResizeEnd = useCallback(() => {
        if (resizingRef.current) {
            setColWidths(prev => {
                localStorage.setItem(storageKey, JSON.stringify(prev));
                return prev;
            });
        }

        resizingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        window.removeEventListener('mousemove', handleColResizeMove);
        window.removeEventListener('mouseup', handleColResizeEnd);
    }, [handleColResizeMove, storageKey]);

    const handleColResizeStart = (e: React.MouseEvent, colId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const column = columns.find(c => c.id === colId);
        if (!column) return;

        resizingRef.current = {
            colId,
            startX: e.clientX,
            startWidth: colWidths[colId] || column.defaultWidth
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('mousemove', handleColResizeMove);
        window.addEventListener('mouseup', handleColResizeEnd);
    };

    const rowHeightClass = density === 'compact' ? 'py-1.5' : 'py-3';
    const cellTextSize = density === 'compact' ? 'text-[13px]' : 'text-sm';

    return (
        <div className={`rounded-lg border border-[#cfdbe7] bg-slate-50 w-full overflow-x-auto custom-scrollbar ${className}`}>
            <table className="w-full min-w-max border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                    <tr className="bg-slate-50">
                        {columns.map((col) => {
                            const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                            const justifyClass = col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start';
                            const isSortable = col.sortable !== false;

                            return (
                                <th
                                    key={col.id}
                                    style={{ width: colWidths[col.id] || col.defaultWidth }}
                                    className={`relative px-3 py-2 ${alignClass} app-label !text-slate-600 border-b app-divider transition-colors ${isSortable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                                    onClick={() => isSortable && onSort && onSort(col.id)}
                                >
                                    <div className={`flex items-center gap-1 overflow-hidden ${justifyClass}`}>
                                        {col.id === 'select' ? (
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={onToggleSelectAll}
                                                className="h-4 w-4 rounded border-slate-200 border-2 bg-transparent text-[#4c739a] checked:bg-[#4c739a] checked:border-[#4c739a] focus:ring-0 focus:ring-offset-0 focus:border-slate-200 focus:outline-none"
                                            />
                                        ) : (
                                            <>
                                                <span className="truncate">{col.label}</span>
                                                {isSortable && onSort && (
                                                    sortConfig?.key === col.id ? (
                                                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1380ec] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#1380ec] shrink-0" />
                                                    ) : <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div
                                        onMouseDown={(e) => handleColResizeStart(e, col.id)}
                                        className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize opacity-0 hover:opacity-100 hover:bg-sky-400/50 z-10 transition-opacity"
                                    />
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.map((row, rowIndex) => {
                        const rowId = String(row[rowIdKey]);
                        const isSelected = selectedRowIds.includes(rowId as never);

                        return (
                            <tr
                                key={rowId || rowIndex}
                                className={`border-t app-divider hover:bg-[#f8fafc] cursor-pointer transition-colors group ${isSelected ? 'bg-sky-50/50' : ''}`}
                                onClick={() => onRowClick?.(row)}
                                onDoubleClick={() => onRowDoubleClick?.(row)}
                            >
                                {columns.map((col) => {
                                    const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                                    return (
                                        <td
                                            key={col.id}
                                            className={`${rowHeightClass} px-3 ${cellTextSize} font-normal leading-tight truncate ${alignClass} text-slate-700`}
                                            onClick={(col.id === 'select' || col.id === 'actions' || col.id === 'quick_view') ? (e) => e.stopPropagation() : undefined}
                                        >
                                            {col.render(row)}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
