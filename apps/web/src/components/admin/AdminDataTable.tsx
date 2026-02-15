'use client';

import { ReactNode } from 'react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
}

interface AdminDataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    mobileCardRender?: (item: T) => ReactNode;
    onRowClick?: (item: T) => void;
    keyExtractor: (item: T) => string | number;
}

export function AdminDataTable<T>({
    data,
    columns,
    isLoading,
    emptyMessage = "Tidak ada data ditemukan.",
    mobileCardRender,
    onRowClick,
    keyExtractor
}: AdminDataTableProps<T>) {
    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                            {columns.map((col, idx) => (
                                <th key={idx} className={`px-3 py-2.5 text-[10px] xl:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.className}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 text-sm">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span>Memuat data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 text-sm italic">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={keyExtractor(item)}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={`px-3 py-2 text-[11px] xl:text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors ${col.className}`}>
                                            {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs italic bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                        {emptyMessage}
                    </div>
                ) : (
                    data.map((item) => (
                        <div key={keyExtractor(item)} onClick={() => onRowClick && onRowClick(item)}>
                            {mobileCardRender ? mobileCardRender(item) : (
                                <div className="p-4 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl">
                                    {columns.map((col, idx) => (
                                        <div key={idx} className="flex justify-between py-1 border-b border-gray-100 dark:border-white/5 last:border-0">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{col.header}</span>
                                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                                                {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as ReactNode)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
