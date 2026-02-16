'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, CreditCard } from 'lucide-react';

interface PremiumLockedProps {
    featureName?: string;
    description?: string;
}

export const PremiumLocked: React.FC<PremiumLockedProps> = ({
    featureName = 'Fitur Premium Terkunci',
    description = 'Maaf, fitur ini adalah fitur tambahan eksklusif. Fitur ini memungkinkan Anda melacak stok bahan baku, mengatur peringatan stok menipis, dan manajemen resep produk secara otomatis.',
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-8 animate-fade-in relative z-10 w-full max-w-2xl mx-auto">
            {/* Lock Icon Container */}
            <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 dark:bg-red-500/10 blur-2xl rounded-full transform scale-150 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/30 ring-4 ring-white dark:ring-[#121212] transform rotate-3">
                    <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
            </div>

            <div className="space-y-4 max-w-lg">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-3">
                    {featureName} <Lock size={24} className="text-red-500 mb-1" />
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>

            <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-white/10 p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    Silakan perpanjang langganan Anda untuk membuka kembali akses fitur ini.
                </p>

                <Link
                    href="/admin/billing"
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300"
                >
                    <CreditCard className="w-6 h-6" />
                    Buka Halaman Langganan
                </Link>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-2">
                    <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                        Butuh bantuan? Hubungi <span className="text-blue-500 font-semibold tracking-wider">Superadmin</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
