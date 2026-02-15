'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface Ingredient {
    id: number;
    name: string;
    unit: string;
    current_stock: number;
    min_stock_alert: number;
    status: 'SAFE' | 'LOW' | 'CRITICAL';
}

export default function InventoryPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [restockModal, setRestockModal] = useState<Ingredient | null>(null);
    const [restockQty, setRestockQty] = useState('');
    const [restockNotes, setRestockNotes] = useState('');

    useEffect(() => {
        fetchIngredients();
        fetchLowStock();
    }, []);

    const fetchIngredients = async () => {
        try {
            const res = await api.get('/inventory/ingredients/');
            setIngredients(res.data.data);
        } catch (error) {
            console.error('Failed to fetch ingredients:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLowStock = async () => {
        try {
            const res = await api.get('/inventory/ingredients/low-stock/');
            setLowStockCount(res.data.count);
        } catch (error) {
            console.error('Failed to fetch low stock:', error);
        }
    };

    const handleRestock = async () => {
        if (!restockModal || !restockQty) return;

        try {
            await api.post(`/inventory/ingredients/${restockModal.id}/restock/`, {
                quantity: parseFloat(restockQty),
                notes: restockNotes
            });
            setRestockModal(null);
            setRestockQty('');
            setRestockNotes('');
            fetchIngredients();
            fetchLowStock();
        } catch (error) {
            console.error('Failed to restock:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CRITICAL':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-light text-danger">Habis</span>;
            case 'LOW':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-light text-warning">Menipis</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-light text-success">Aman</span>;
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Manajemen Inventori</h1>
                    <p className="text-muted-foreground">Kelola stok bahan baku</p>
                </div>
                <button
                    onClick={() => fetchIngredients()}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {/* Alert Banner */}
            {lowStockCount > 0 && (
                <div className="bg-warning-light border border-warning rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="text-warning" size={24} />
                    <div>
                        <p className="font-semibold text-warning">Perhatian!</p>
                        <p className="text-sm text-warning">{lowStockCount} bahan baku dengan stok menipis atau habis</p>
                    </div>
                </div>
            )}

            {/* Ingredients Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Bahan Baku</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Stok Saat Ini</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Minimum</th>
                            <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                            <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : ingredients.length > 0 ? (
                            ingredients.map((ingredient) => (
                                <tr key={ingredient.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-accent/10 rounded-lg">
                                                <Package className="text-accent" size={20} />
                                            </div>
                                            <span className="font-medium text-foreground">{ingredient.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground">
                                        {ingredient.current_stock} {ingredient.unit}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {ingredient.min_stock_alert} {ingredient.unit}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(ingredient.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setRestockModal(ingredient)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                                        >
                                            <Plus size={16} />
                                            Restock
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    Belum ada data bahan baku
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Restock Modal */}
            {restockModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-bold text-foreground mb-4">
                            Tambah Stok: {restockModal.name}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">
                                    Jumlah ({restockModal.unit})
                                </label>
                                <input
                                    type="number"
                                    value={restockQty}
                                    onChange={(e) => setRestockQty(e.target.value)}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                                    placeholder="Masukkan jumlah"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">
                                    Catatan (opsional)
                                </label>
                                <input
                                    type="text"
                                    value={restockNotes}
                                    onChange={(e) => setRestockNotes(e.target.value)}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                                    placeholder="Contoh: Beli dari supplier X"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setRestockModal(null)}
                                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleRestock}
                                disabled={!restockQty}
                                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                            >
                                Tambah Stok
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
