'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export const AdminPagination = ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange
}: AdminPaginationProps) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    // if (totalPages <= 1) return null; // Always show pagination for consistency

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
            <p className="text-[10px] xl:text-xs text-gray-500 dark:text-gray-400">
                Menampilkan <span className="font-bold">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold">{Math.min(currentPage * pageSize, totalItems)}</span> dari <span className="font-bold">{totalItems}</span> data
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 xl:p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                    <ChevronLeft size={14} className="xl:w-4 xl:h-4 text-gray-600 dark:text-gray-300" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                    <button
                        key={i}
                        onClick={() => onPageChange(i + 1)}
                        className={`min-w-[28px] xl:min-w-[32px] h-7 xl:h-8 text-[10px] xl:text-xs font-bold rounded-lg transition-all ${currentPage === i + 1
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10'
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 xl:p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                    <ChevronRight size={14} className="xl:w-4 xl:h-4 text-gray-600 dark:text-gray-300" />
                </button>
            </div>
        </div>
    );
};
