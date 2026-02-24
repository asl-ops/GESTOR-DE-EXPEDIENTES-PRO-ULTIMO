import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PAGE_SIZE_OPTIONS = [25, 50, 100, "all"] as const;

export type PageSize = typeof PAGE_SIZE_OPTIONS[number];

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    pageSize: PageSize;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: PageSize) => void;
    variant?: 'default' | 'minimal';
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    variant = 'default',
}) => {
    // If pageSize is 'all', treat as single page with all items
    const isAll = pageSize === 'all';
    const effectivePageSize = isAll ? totalItems : pageSize;

    const startItem = totalItems === 0 ? 0 : isAll ? 1 : (currentPage - 1) * effectivePageSize + 1;
    const endItem = isAll ? totalItems : Math.min(currentPage * effectivePageSize, totalItems);
    const effectiveTotalPages = isAll ? 1 : totalPages;

    return (
        <div className={`flex items-center justify-between bg-white px-4 py-3 sm:px-6 ${variant === 'default' ? 'border-t border-slate-100' : ''}`}>
            {/* Left side: Items per page */}
            <div className="flex items-center gap-3">
                <span className={`text-[10px] uppercase font-normal tracking-widest text-slate-400`}>
                    Por página
                </span>
                <select
                    value={pageSize}
                    onChange={(e) => {
                        const val = e.target.value;
                        const newSize = val === 'all' ? 'all' : Number(val) as PageSize;
                        onPageSizeChange(newSize);
                        onPageChange(1); // Reset to first page
                    }}
                    className={`h-9 px-3 border border-slate-200 rounded-xl bg-white text-xs font-normal text-slate-700 outline-none hover:border-sky-300 hover:text-sky-600 transition-all cursor-pointer shadow-sm focus:ring-4 focus:ring-sky-500/5`}
                >
                    {PAGE_SIZE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                            {opt === 'all' ? 'Todos' : opt}
                        </option>
                    ))}
                </select>
            </div>

            {/* Center: Item count */}
            {variant === 'default' && (
                <div className="hidden sm:block">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        Mostrando <span className="text-slate-900 font-normal">{startItem}</span> a{' '}
                        <span className="text-slate-900 font-normal">{endItem}</span> de{' '}
                        <span className="text-sky-600 font-normal">{totalItems}</span>
                    </p>
                </div>
            )}

            {/* Right side: Page navigation */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isAll}
                    className={`flex items-center justify-center size-9 rounded-xl border transition-all ${currentPage === 1 || isAll
                        ? 'text-slate-200 border-slate-50 cursor-not-allowed'
                        : 'text-slate-500 border-slate-100 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100'
                        }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {!isAll && (
                    <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(effectiveTotalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (effectiveTotalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= effectiveTotalPages - 2) {
                                pageNum = effectiveTotalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`size-9 text-xs font-normal rounded-xl transition-all ${currentPage === pageNum
                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                )}

                {isAll && (
                    <div className="size-9 flex items-center justify-center text-xs font-normal text-sky-600 bg-sky-50 border border-sky-100 rounded-xl">
                        1
                    </div>
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isAll}
                    className={`flex items-center justify-center size-9 rounded-xl border transition-all ${currentPage === effectiveTotalPages || effectiveTotalPages === 0 || isAll
                        ? 'text-slate-200 border-slate-50 cursor-not-allowed'
                        : 'text-slate-500 border-slate-100 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100'
                        }`}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;
