'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Plus, RefreshCw, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import type { Ingredient, ApiResponse } from '@/types/api';
import { extractApiArray } from '@/lib/api-utils';

export default function InventoryPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchIngredients = useCallback(async () => {
        try {
            const res = await api.get<ApiResponse<Ingredient[]>>('/inventory/ingredients/');
            const data = extractApiArray(res.data);
            setIngredients(data);
        } catch (error) {
            console.error('Failed to fetch ingredients:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLowStock = useCallback(async () => {
        try {
            const res = await api.get('/inventory/ingredients/low-stock/');
            setLowStockCount(res.data.count);
        } catch (error) {
            console.error('Failed to fetch low stock:', error);
        }
    }, []);

    useEffect(() => {
        fetchIngredients();
        fetchLowStock();
    }, [fetchIngredients, fetchLowStock]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CRITICAL':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400">
                        <AlertTriangle size={12} /> Habis
                    </span>
                );
            case 'LOW':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/30 dark:text-yellow-400">
                        <AlertTriangle size={12} /> Menipis
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400">
                        <CheckCircle size={12} /> Aman
                    </span>
                );
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Inventori</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola stok bahan baku</p>
                </div>
                <button
                    onClick={fetchIngredients}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-sm font-medium"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Alert Banner */}
            {lowStockCount > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0" size={20} />
                    <div>
                        <p className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">Perhatian!</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500">{lowStockCount} bahan baku dengan stok menipis atau habis</p>
                    </div>
                </div>
            )}

            {/* Ingredients Table */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Bahan Baku</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Stok Saat Ini</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                            <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                                        <span>Memuat data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : ingredients.length > 0 ? (
                            ingredients.map((ingredient) => (
                                <tr key={ingredient.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Plus className="text-primary" size={14} />
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-white">{ingredient.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">
                                        {ingredient.current_stock} {ingredient.unit}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(ingredient.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs text-gray-400">Kelola di Menu Inventori</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    Belum ada data bahan baku
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
