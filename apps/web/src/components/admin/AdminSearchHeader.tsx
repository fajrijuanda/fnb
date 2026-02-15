'use client';

import { Search, Plus } from 'lucide-react';

interface AdminSearchHeaderProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    addButtonLabel?: string;
    onAddClick?: () => void;
    extraActions?: React.ReactNode;
}

export const AdminSearchHeader = ({
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Cari...",
    addButtonLabel,
    onAddClick,
    extraActions
}: AdminSearchHeaderProps) => {
    return (
        <div className="flex flex-col md:flex-row gap-3 justify-between mb-4">
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                />
            </div>
            <div className="flex items-center gap-2">
                {extraActions}
                {addButtonLabel && onAddClick && (
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 group"
                    >
                        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>{addButtonLabel}</span>
                    </button>
                )}
            </div>
        </div>
    );
};
