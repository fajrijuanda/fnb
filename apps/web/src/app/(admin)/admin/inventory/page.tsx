'use client';

import { useState, useEffect, useCallback } from 'react';
import { InventoryPrediction } from '@/components/admin/ai/InventoryPrediction';
import { Lock, Phone, Plus, Search, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { extractApiArray } from '@/lib/api-utils';
import { Ingredient, ApiResponse } from '@/types/api';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function InventoryPage() {
    const { user } = useAuthStore();
    // Admin is always subscribed (lifetime). Mitra depends on subscription.
    const isUnlocked = user?.role === 'superadmin' || user?.is_subscribed;

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchIngredients = useCallback(async () => {
        if (!isUnlocked) return;
        setIsLoading(true);
        try {
            const response = await api.get<ApiResponse<Ingredient[]>>('/inventory/ingredients/');
            const data = extractApiArray(response.data);
            setIngredients(data);
        } catch (error) {
            console.error('Failed to fetch ingredients:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isUnlocked]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    const filteredIngredients = ingredients.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative min-h-screen space-y-6">
            <AdminHeader
                title="Inventori"
                description="Kelola stok bahan baku dan peringatan stok otomatis."
            />

            {/* AI Prediction (Always visible if unlocked, blurred if locked) */}
            <div className={!isUnlocked ? 'filter blur-md pointer-events-none select-none opacity-50' : ''}>
                <InventoryPrediction />
            </div>

            {/* Main Content */}
            <div className={`relative ${!isUnlocked ? 'filter blur-md pointer-events-none select-none opacity-50 h-[500px] overflow-hidden' : ''}`}>

                {/* Actions & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari bahan baku..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-primary to-red-700 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform">
                        <Plus size={20} />
                        <span>Tambah Stok</span>
                    </button>
                    <button onClick={fetchIngredients} className="p-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:rotate-180 transition-all duration-500">
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Nama Bahan</th>
                                <th className="px-6 py-4">Stok Saat Ini</th>
                                <th className="px-6 py-4">Satuan</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data inventori...</td>
                                </tr>
                            ) : filteredIngredients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada bahan baku.</td>
                                </tr>
                            ) : (
                                filteredIngredients.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">{item.current_stock}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${item.status === 'SAFE' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900/30' :
                                                    item.status === 'LOW' ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/30' :
                                                        'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-900/30'
                                                }`}>
                                                {item.status === 'SAFE' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                                {item.status === 'SAFE' ? 'Aman' : item.status === 'LOW' ? 'Menipis' : 'Kritis'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary hover:underline text-xs font-bold">Detail</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Lock Overlay (Only if Locked) */}
            {!isUnlocked && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-lg w-full bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-8 text-center shadow-2xl animation-scale-in">
                        {/* Decorative Background Glow */}
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
                                <Lock className="h-10 w-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Fitur Premium Terkunci 🔒
                            </h2>

                            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                Maaf, fitur <span className="font-semibold text-red-700 dark:text-red-500">Manajemen Inventori</span> adalah fitur tambahan eksklusif.
                                Fitur ini memungkinkan Anda melacak stok bahan baku, mengatur peringatan stok menipis, dan manajemen resep produk secara otomatis.
                            </p>

                            <div className="flex flex-col w-full gap-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    Tertarik membuka fitur ini? Hubungi Developer:
                                </p>
                                <Link
                                    href="https://wa.me/6285217861296?text=Halo%2C%20saya%20tertarik%20untuk%20membuka%20fitur%20Inventori%20pada%20aplikasi%20POS%20saya."
                                    target="_blank"
                                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Phone size={24} />
                                    <span>Hubungi via WhatsApp</span>
                                </Link>

                                <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-primary/10">
                                    <p className="text-xs font-mono text-red-700 dark:text-red-500">
                                        Developer Contact: 0852-1786-1296
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
